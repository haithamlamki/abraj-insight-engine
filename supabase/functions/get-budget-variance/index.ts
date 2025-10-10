import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface VarianceRequest {
  report_key: string;
  rig_code?: string;
  year: number;
  month?: number;
  metric_key?: string;
  version_id?: string;
}

interface VarianceResponse {
  actual: number | null;
  variance_pct: number | null;
  band: 'within_5' | 'within_10' | 'within_20' | 'above_20' | null;
  direction: 'above' | 'below' | 'on_target' | null;
  status: 'good' | 'warning' | 'critical' | 'unknown';
  message: string;
  budget_value?: number;
  currency?: string;
}

const TABLE_MAPPING: Record<string, { table: string; column: string; aggregate: string }> = {
  'utilization': { table: 'utilization', column: 'utilization_rate', aggregate: 'avg' },
  'ytd_npt': { table: 'billing_npt', column: 'npt_hours', aggregate: 'sum' },
  'billing_npt': { table: 'billing_npt', column: 'npt_hours', aggregate: 'sum' },
  'revenue': { table: 'revenue', column: 'revenue_actual', aggregate: 'sum' },
  'fuel': { table: 'fuel_consumption', column: 'total_cost', aggregate: 'sum' },
  'csr': { table: 'customer_satisfaction', column: 'satisfaction_score', aggregate: 'avg' },
  'stock': { table: 'stock_levels', column: 'current_qty', aggregate: 'sum' },
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Get authenticated user
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Check if user is admin
    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);
    
    const isAdmin = roles?.some(r => r.role === 'admin') ?? false;

    // Parse request
    const body: VarianceRequest = await req.json();
    const { report_key, rig_code, year, month, metric_key, version_id } = body;

    // 1. Get report_id
    const { data: report } = await supabase
      .from('dim_report')
      .select('id')
      .eq('report_key', report_key)
      .single();
    
    if (!report) {
      return new Response(JSON.stringify({ 
        status: 'unknown', 
        message: 'No budget set',
        actual: null,
        variance_pct: null,
        band: null,
        direction: null
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 2. Get active budget version if not specified
    let activeVersionId = version_id;
    if (!activeVersionId) {
      const { data: activeVersion } = await supabase
        .from('budget_version')
        .select('id')
        .in('status', ['approved', 'locked'])
        .eq('fiscal_year', year)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      activeVersionId = activeVersion?.id;
    }

    // 3. Get budget value (only if version exists)
    let budgetValue: number | null = null;
    let currency = 'OMR';
    
    if (activeVersionId) {
      const budgetQuery = supabase
        .from('fact_budget')
        .select('budget_value, currency')
        .eq('version_id', activeVersionId)
        .eq('report_id', report.id)
        .eq('year', year);
      
      if (rig_code) {
        const { data: rig } = await supabase
          .from('dim_rig')
          .select('id')
          .eq('rig_code', rig_code)
          .maybeSingle();
        if (rig) budgetQuery.eq('rig_id', rig.id);
      }
      
      if (month) budgetQuery.eq('month', month);
      
      if (metric_key) {
        const { data: metric } = await supabase
          .from('dim_metric')
          .select('id')
          .eq('metric_key', metric_key)
          .maybeSingle();
        if (metric) budgetQuery.eq('metric_id', metric.id);
      }

      const { data: budget } = await budgetQuery.maybeSingle();
      if (budget) {
        budgetValue = budget.budget_value;
        currency = budget.currency;
      }
    }

    // 4. Get actual value from appropriate fact table
    let actualValue: number | null = null;
    
    const mapping = TABLE_MAPPING[report_key];
    if (mapping) {
      let query = supabase
        .from(mapping.table)
        .select(mapping.column)
        .eq('year', year);
      
      if (rig_code) query = query.eq('rig', rig_code);
      if (month) {
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                           'July', 'August', 'September', 'October', 'November', 'December'];
        query = query.eq('month', monthNames[month - 1]);
      }

      const { data: actuals } = await query;
      
      if (actuals && actuals.length > 0) {
        if (mapping.aggregate === 'sum') {
          actualValue = actuals.reduce((sum: number, row: any) => sum + (Number(row[mapping.column]) || 0), 0);
        } else if (mapping.aggregate === 'avg') {
          const values = actuals.map((row: any) => row[mapping.column]).filter((v: any) => v != null);
          actualValue = values.length > 0 
            ? values.reduce((sum: number, v: number) => sum + v, 0) / values.length 
            : null;
        }
      }
    }

    // 5. Calculate variance (if budget exists)
    let variancePct: number | null = null;
    let band: VarianceResponse['band'] = null;
    let direction: VarianceResponse['direction'] = null;
    let status: VarianceResponse['status'] = 'unknown';
    let message = 'No budget set for this period';

    if (budgetValue && actualValue !== null) {
      variancePct = ((actualValue - budgetValue) / budgetValue) * 100;
      
      const absVariance = Math.abs(variancePct);
      if (absVariance <= 5) band = 'within_5';
      else if (absVariance <= 10) band = 'within_10';
      else if (absVariance <= 20) band = 'within_20';
      else band = 'above_20';

      if (variancePct > 0) direction = 'above';
      else if (variancePct < 0) direction = 'below';
      else direction = 'on_target';

      // Status logic
      const lowerIsBetter = ['ytd_npt', 'billing_npt', 'fuel'].includes(report_key);
      
      if (band === 'within_5') {
        status = 'good';
        message = 'Within 5% of target';
      } else if (band === 'within_10') {
        status = 'warning';
        message = `${Math.abs(variancePct).toFixed(1)}% ${direction} target`;
      } else {
        status = 'critical';
        message = `${Math.abs(variancePct).toFixed(1)}% ${direction} target`;
      }
      
      // Adjust status for metrics where lower is better
      if (lowerIsBetter) {
        if (direction === 'below') status = status === 'critical' ? 'good' : status;
        if (direction === 'above' && status === 'good') status = 'warning';
      }
    }

    // 6. Build response (masked for non-admins)
    const response: VarianceResponse = {
      actual: actualValue,
      variance_pct: variancePct,
      band,
      direction,
      status,
      message
    };

    // Only add budget_value for admins
    if (isAdmin && budgetValue !== null) {
      response.budget_value = budgetValue;
      response.currency = currency;
    }

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in get-budget-variance:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

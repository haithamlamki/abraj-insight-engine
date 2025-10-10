import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AlertRule {
  id: string;
  report_key: string;
  threshold_pct: number;
  alert_type: 'email' | 'notification';
  recipients: string[];
  enabled: boolean;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Starting budget alert check...');

    // Get current year and month
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    // Get all active reports
    const { data: reports, error: reportsError } = await supabase
      .from('dim_report')
      .select('*')
      .eq('active', true);

    if (reportsError) throw reportsError;

    const alerts: any[] = [];

    // Check variances for each report
    for (const report of reports || []) {
      // Get active budget version
      const { data: version } = await supabase
        .from('budget_version')
        .select('id')
        .eq('fiscal_year', year)
        .in('status', ['approved', 'locked'])
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (!version) continue;

      // Get all rigs
      const { data: rigs } = await supabase
        .from('dim_rig')
        .select('*')
        .eq('active', true);

      if (!rigs) continue;

      // Check variance for each rig
      for (const rig of rigs) {
        const { data: metrics } = await supabase
          .from('dim_metric')
          .select('*')
          .eq('report_id', report.id)
          .eq('active', true);

        if (!metrics) continue;

        for (const metric of metrics) {
          // Get budget
          const { data: budget } = await supabase
            .from('fact_budget')
            .select('budget_value')
            .eq('version_id', version.id)
            .eq('report_id', report.id)
            .eq('rig_id', rig.id)
            .eq('metric_id', metric.id)
            .eq('year', year)
            .eq('month', month)
            .maybeSingle();

          if (!budget) continue;

          // Get actual value from appropriate table
          let actual = null;
          const tableName = getTableName(report.report_key);
          
          if (tableName) {
            const { data: actuals } = await supabase
              .from(tableName)
              .select('*')
              .eq('rig', rig.rig_code)
              .eq('year', year)
              .eq('month', getMonthName(month));

            if (actuals && actuals.length > 0) {
              actual = getActualValue(actuals, metric.metric_key, metric.aggregation_type);
            }
          }

          if (actual !== null && budget.budget_value) {
            const variancePct = ((actual - budget.budget_value) / budget.budget_value) * 100;
            
            // Check if variance exceeds threshold (20% for critical alerts)
            if (Math.abs(variancePct) > 20) {
              alerts.push({
                report_key: report.report_key,
                report_name: report.display_name,
                rig_code: rig.rig_code,
                metric_key: metric.metric_key,
                metric_name: metric.display_name,
                year,
                month,
                budget: budget.budget_value,
                actual,
                variance_pct: variancePct,
                severity: Math.abs(variancePct) > 30 ? 'critical' : 'warning',
                timestamp: new Date().toISOString(),
              });
            }
          }
        }
      }
    }

    console.log(`Found ${alerts.length} budget alerts`);

    return new Response(
      JSON.stringify({
        success: true,
        alerts,
        count: alerts.length,
        checked_at: new Date().toISOString(),
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error: any) {
    console.error('Error checking budget alerts:', error);
    return new Response(
      JSON.stringify({ 
        error: error?.message || 'Unknown error',
        success: false 
      }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

function getTableName(reportKey: string): string | null {
  const mapping: Record<string, string> = {
    'utilization': 'utilization',
    'billing_npt': 'billing_npt',
    'revenue': 'revenue',
    'fuel_consumption': 'fuel_consumption',
    'customer_satisfaction': 'customer_satisfaction',
    'stock_levels': 'stock_levels',
  };
  return mapping[reportKey] || null;
}

function getMonthName(month: number): string {
  const months = ['January', 'February', 'March', 'April', 'May', 'June',
                  'July', 'August', 'September', 'October', 'November', 'December'];
  return months[month - 1];
}

function getActualValue(records: any[], metricKey: string, aggregationType: string | null): number | null {
  if (!records || records.length === 0) return null;

  const columnMap: Record<string, string> = {
    'utilization_rate': 'utilization_rate',
    'npt_hours': 'npt_hours',
    'revenue_omr': 'revenue_actual',
    'fuel_cost_omr': 'total_cost',
    'satisfaction_score': 'satisfaction_score',
    'stock_quantity': 'current_qty',
  };

  const column = columnMap[metricKey];
  if (!column) return null;

  const values = records.map(r => parseFloat(r[column])).filter(v => !isNaN(v));
  if (values.length === 0) return null;

  if (aggregationType === 'sum') {
    return values.reduce((sum, val) => sum + val, 0);
  } else if (aggregationType === 'avg') {
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  } else {
    return values[0];
  }
}

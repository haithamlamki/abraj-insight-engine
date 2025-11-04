import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { filters, focusArea = 'operational-efficiency' } = await req.json();
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Fetch billing NPT data
    const headers = {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
    };

    let query = `${supabaseUrl}/rest/v1/billing_npt?select=*&order=date.desc&limit=1000`;
    
    if (filters?.years?.length > 0) {
      query += `&year=in.(${filters.years.join(',')})`;
    }
    if (filters?.rigs?.length > 0) {
      query += `&rig=in.(${filters.rigs.join(',')})`;
    }

    const response = await fetch(query, { headers });
    const data = await response.json();

    // Calculate aggregated metrics
    const totalNPT = data.reduce((sum: number, r: any) => sum + (r.npt_hours || 0), 0);
    const totalRecords = data.length;
    const rigsAffected = new Set(data.map((r: any) => r.rig)).size;

    // Group by rig
    const rigMap = new Map();
    data.forEach((record: any) => {
      const rigData = rigMap.get(record.rig) || {
        rig: record.rig,
        totalNPT: 0,
        incidents: 0,
        billable: 0,
        nonBillable: 0
      };
      rigData.totalNPT += record.npt_hours || 0;
      rigData.incidents += 1;
      if (record.billable) {
        rigData.billable += record.npt_hours || 0;
      } else {
        rigData.nonBillable += record.npt_hours || 0;
      }
      rigMap.set(record.rig, rigData);
    });

    const rigPerformance = Array.from(rigMap.values())
      .sort((a, b) => b.totalNPT - a.totalNPT)
      .slice(0, 5);

    // Group by system
    const systemMap = new Map();
    data.forEach((record: any) => {
      if (record.system) {
        const current = systemMap.get(record.system) || 0;
        systemMap.set(record.system, current + (record.npt_hours || 0));
      }
    });

    const topSystems = Array.from(systemMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    // Group by month
    const monthlyMap = new Map();
    data.forEach((record: any) => {
      const key = `${record.year}-${record.month}`;
      const current = monthlyMap.get(key) || 0;
      monthlyMap.set(key, current + (record.npt_hours || 0));
    });

    const context = {
      totalNPT,
      totalRecords,
      rigsAffected,
      avgNPTPerIncident: totalRecords > 0 ? Math.round(totalNPT / totalRecords) : 0,
      topRigs: rigPerformance,
      topSystems,
      monthlyTrend: Array.from(monthlyMap.entries())
    };

    // Generate AI insights
    const systemPrompt = `You are an expert drilling operations analyst specializing in Non-Productive Time (NPT) analysis. 
Analyze the provided NPT data and provide actionable insights, recommendations, and alerts.`;

    const userPrompt = focusArea === 'operational-efficiency'
      ? `Analyze operational efficiency based on this NPT data:
      
Total NPT: ${context.totalNPT} hours across ${context.totalRecords} incidents
Rigs affected: ${context.rigsAffected}
Average NPT per incident: ${context.avgNPTPerIncident} hours

Top 5 Rigs by NPT:
${context.topRigs.map((r: any) => `- Rig ${r.rig}: ${r.totalNPT} hrs (${r.incidents} incidents, ${r.billable} billable, ${r.nonBillable} non-billable)`).join('\n')}

Top 5 Systems causing NPT:
${context.topSystems.map(([sys, hrs]: [string, number]) => `- ${sys}: ${hrs} hours`).join('\n')}

Provide:
1. 3-5 key insights about operational efficiency
2. 3-5 actionable recommendations to reduce NPT
3. 1-3 critical alerts about concerning patterns`
      : focusArea === 'npt-drivers'
      ? `Analyze NPT drivers and root causes based on this data:

${context.topSystems.map(([sys, hrs]: [string, number]) => `${sys}: ${hrs} hours`).join('\n')}

Worst performing rigs:
${context.topRigs.map((r: any) => `Rig ${r.rig}: ${r.totalNPT} hrs total`).join('\n')}

Identify:
1. Primary NPT drivers
2. Root cause patterns
3. Recommendations to address top drivers`
      : `Provide an executive summary of NPT performance:

Total NPT: ${context.totalNPT} hours
Total incidents: ${context.totalRecords}
Rigs with high NPT: ${context.topRigs.length}

Summarize:
1. Overall NPT performance status
2. Key areas of concern
3. Top 3 action items for management`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Payment required. Please add credits to your Lovable workspace.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices[0].message.content;

    // Parse AI response
    const insights: string[] = [];
    const recommendations: string[] = [];
    const alerts: string[] = [];

    const lines = content.split('\n');
    let currentSection = '';

    lines.forEach((line: string) => {
      const trimmed = line.trim();
      if (trimmed.toLowerCase().includes('insight')) {
        currentSection = 'insights';
      } else if (trimmed.toLowerCase().includes('recommendation')) {
        currentSection = 'recommendations';
      } else if (trimmed.toLowerCase().includes('alert') || trimmed.toLowerCase().includes('concern')) {
        currentSection = 'alerts';
      } else if (trimmed && (trimmed.startsWith('-') || trimmed.startsWith('•') || /^\d+\./.test(trimmed))) {
        const text = trimmed.replace(/^[-•\d.]\s*/, '');
        if (text) {
          if (currentSection === 'insights') insights.push(text);
          else if (currentSection === 'recommendations') recommendations.push(text);
          else if (currentSection === 'alerts') alerts.push(text);
        }
      }
    });

    return new Response(
      JSON.stringify({
        insights: insights.length > 0 ? insights : ['Analysis completed based on current NPT data'],
        recommendations: recommendations.length > 0 ? recommendations : ['Continue monitoring NPT trends'],
        alerts: alerts.length > 0 ? alerts : [],
        context
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in billing-npt-insights:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

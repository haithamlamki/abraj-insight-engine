import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { filters, focusArea } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Create Supabase client
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Fetch revenue data with filters
    let query = supabase.from('revenue').select('*');

    if (filters?.years?.length > 0) {
      query = query.in('year', filters.years);
    }
    if (filters?.months?.length > 0) {
      query = query.in('month', filters.months);
    }
    if (filters?.rigs?.length > 0) {
      query = query.in('rig', filters.rigs);
    }

    const { data: revenueData, error: dbError } = await query.order('year', { ascending: false }).order('month', { ascending: false });

    if (dbError) {
      console.error('Database error:', dbError);
      throw new Error('Failed to fetch revenue data');
    }

    if (!revenueData || revenueData.length === 0) {
      return new Response(
        JSON.stringify({ 
          insights: ['No data available for the selected filters.'],
          recommendations: ['Try adjusting your filters to include more data.'],
          alerts: []
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Calculate aggregated metrics for AI analysis
    const totalActual = revenueData.reduce((sum, r) => sum + (r.revenue_actual || 0), 0);
    const totalBudget = revenueData.reduce((sum, r) => sum + (r.revenue_budget || 0), 0);
    const totalVariance = totalActual - totalBudget;
    const variancePct = totalBudget !== 0 ? (totalVariance / totalBudget) * 100 : 0;
    const totalNPT = revenueData.reduce((sum, r) => sum + (r.npt_repair || 0) + (r.npt_zero || 0), 0);

    // Group by rig for performance analysis
    const rigPerformance = revenueData.reduce((acc, row) => {
      if (!acc[row.rig]) {
        acc[row.rig] = { actual: 0, budget: 0, variance: 0, count: 0, npt: 0 };
      }
      acc[row.rig].actual += row.revenue_actual || 0;
      acc[row.rig].budget += row.revenue_budget || 0;
      acc[row.rig].variance += row.variance || 0;
      acc[row.rig].count += 1;
      acc[row.rig].npt += (row.npt_repair || 0) + (row.npt_zero || 0);
      return acc;
    }, {} as Record<string, any>);

    // Find top and bottom performers
    const rigList = Object.entries(rigPerformance)
      .map(([rig, perf]: [string, any]) => ({
        rig,
        variance: perf.variance,
        variancePct: perf.budget !== 0 ? (perf.variance / perf.budget) * 100 : 0,
        npt: perf.npt,
      }))
      .sort((a, b) => b.variance - a.variance);

    const topPerformer = rigList[0];
    const bottomPerformer = rigList[rigList.length - 1];

    // Group by month for trend analysis
    const monthlyData = revenueData.slice(0, 12).reduce((acc, row) => {
      const key = `${row.year}-${row.month}`;
      if (!acc[key]) {
        acc[key] = { actual: 0, budget: 0, variance: 0 };
      }
      acc[key].actual += row.revenue_actual || 0;
      acc[key].budget += row.revenue_budget || 0;
      acc[key].variance += row.variance || 0;
      return acc;
    }, {} as Record<string, any>);

    // Prepare context for AI
    const context = {
      totalRecords: revenueData.length,
      totalActual: `$${(totalActual / 1000000).toFixed(2)}M`,
      totalBudget: `$${(totalBudget / 1000000).toFixed(2)}M`,
      totalVariance: `$${(totalVariance / 1000000).toFixed(2)}M`,
      variancePct: `${variancePct.toFixed(1)}%`,
      totalNPT: `$${totalNPT.toLocaleString()}`,
      rigCount: Object.keys(rigPerformance).length,
      topPerformer: topPerformer ? {
        rig: topPerformer.rig,
        variance: `$${(topPerformer.variance / 1000000).toFixed(2)}M`,
        variancePct: `${topPerformer.variancePct.toFixed(1)}%`,
      } : null,
      bottomPerformer: bottomPerformer ? {
        rig: bottomPerformer.rig,
        variance: `$${(bottomPerformer.variance / 1000000).toFixed(2)}M`,
        variancePct: `${bottomPerformer.variancePct.toFixed(1)}%`,
      } : null,
      monthlyTrend: Object.keys(monthlyData).length > 1 ? 'Available' : 'Insufficient data',
    };

    // Prepare prompt based on focus area
    let systemPrompt = "You are a financial analyst specializing in oil and gas rig operations. Analyze revenue data and provide actionable insights.";
    let userPrompt = "";

    if (focusArea === "variance_drivers") {
      userPrompt = `Analyze this revenue data and identify key variance drivers:
      
Data Summary:
- Total Actual Revenue: ${context.totalActual}
- Total Budget Revenue: ${context.totalBudget}
- Variance: ${context.totalVariance} (${context.variancePct})
- Total NPT Costs: ${context.totalNPT}
- Number of Rigs: ${context.rigCount}
- Top Performer: Rig ${context.topPerformer?.rig} (${context.topPerformer?.variance} variance, ${context.topPerformer?.variancePct})
- Bottom Performer: Rig ${context.bottomPerformer?.rig} (${context.bottomPerformer?.variance} variance, ${context.bottomPerformer?.variancePct})

Provide:
1. Three key insights about what's driving revenue variance
2. Three actionable recommendations to improve performance
3. Any critical alerts or concerns to address immediately

Keep each point concise (1-2 sentences). Focus on specific, actionable items.`;
    } else if (focusArea === "rig_performance") {
      userPrompt = `Analyze rig-level performance trends:

Rig Performance:
${rigList.slice(0, 5).map(r => `- Rig ${r.rig}: ${r.variancePct.toFixed(1)}% variance, $${r.npt.toLocaleString()} NPT`).join('\n')}

Overall: ${context.totalVariance} total variance across ${context.rigCount} rigs.

Provide:
1. Performance patterns across rigs
2. Recommendations for underperforming rigs
3. Best practices from top performers`;
    } else {
      userPrompt = `Provide an executive summary of revenue performance:

Summary:
- Revenue: ${context.totalActual} actual vs ${context.totalBudget} budget
- Variance: ${context.totalVariance} (${context.variancePct})
- NPT Impact: ${context.totalNPT}
- Rigs: ${context.rigCount}

Give a brief, high-level overview with top 3 insights and recommendations.`;
    }

    console.log('Calling Lovable AI for insights...');

    // Call Lovable AI
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limits exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required. Please add credits to your Lovable AI workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errorText);
      throw new Error("AI gateway error");
    }

    const aiData = await aiResponse.json();
    const aiContent = aiData.choices?.[0]?.message?.content || '';

    console.log('AI insights generated successfully');

    // Parse AI response into structured format
    const lines = aiContent.split('\n').filter((line: string) => line.trim());
    
    const insights: string[] = [];
    const recommendations: string[] = [];
    const alerts: string[] = [];
    
    let currentSection = '';
    
    for (const line of lines) {
      const lowerLine = line.toLowerCase();
      if (lowerLine.includes('insight') || lowerLine.includes('key finding')) {
        currentSection = 'insights';
        continue;
      } else if (lowerLine.includes('recommendation') || lowerLine.includes('action')) {
        currentSection = 'recommendations';
        continue;
      } else if (lowerLine.includes('alert') || lowerLine.includes('concern') || lowerLine.includes('warning')) {
        currentSection = 'alerts';
        continue;
      }
      
      const cleanLine = line.replace(/^[-*•]\s*\d*\.?\s*/, '').trim();
      if (cleanLine.length > 10) {
        if (currentSection === 'insights') insights.push(cleanLine);
        else if (currentSection === 'recommendations') recommendations.push(cleanLine);
        else if (currentSection === 'alerts') alerts.push(cleanLine);
        else insights.push(cleanLine);
      }
    }

    return new Response(
      JSON.stringify({
        insights: insights.length > 0 ? insights : ['Analysis complete.'],
        recommendations: recommendations.length > 0 ? recommendations : ['Continue monitoring performance.'],
        alerts: alerts.length > 0 ? alerts : [],
        context: context,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("revenue-insights error:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error",
        insights: [],
        recommendations: [],
        alerts: []
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

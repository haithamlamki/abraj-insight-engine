import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { reportType, rigCode } = await req.json();
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    
    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch historical data based on report type
    let historicalData: any[] = [];
    let tableName = '';
    
    switch (reportType) {
      case 'revenue':
        tableName = 'revenue';
        const { data: revenueData } = await supabase
          .from('revenue')
          .select('rig, year, month, revenue_actual, revenue_budget, dayrate_actual, dayrate_budget, working_days')
          .order('year', { ascending: false })
          .order('month', { ascending: false })
          .limit(24);
        historicalData = revenueData || [];
        break;
        
      case 'utilization':
        tableName = 'utilization';
        const { data: utilizationData } = await supabase
          .from('utilization')
          .select('rig, year, month, operating_days, npt_days, working_days, utilization_rate')
          .order('year', { ascending: false })
          .order('month', { ascending: false })
          .limit(24);
        historicalData = utilizationData || [];
        break;
        
      case 'billing_npt':
        tableName = 'billing_npt_summary';
        const { data: nptData } = await supabase
          .from('billing_npt_summary')
          .select('rig, year, month, total_npt, opr_rate, reduce_rate, repair_rate, zero_rate')
          .order('year', { ascending: false })
          .order('month', { ascending: false })
          .limit(24);
        historicalData = nptData || [];
        break;
        
      case 'fuel':
        tableName = 'fuel_consumption';
        const { data: fuelData } = await supabase
          .from('fuel_consumption')
          .select('rig, year, month, total_consumed, fuel_cost, rig_engine_consumption')
          .order('year', { ascending: false })
          .order('month', { ascending: false })
          .limit(24);
        historicalData = fuelData || [];
        break;
    }

    if (rigCode) {
      historicalData = historicalData.filter(d => d.rig === rigCode);
    }

    console.log(`Analyzing ${historicalData.length} records for ${reportType}`);

    // Prepare prompt for AI analysis
    const systemPrompt = `You are a budget analysis expert specializing in rig operations and financial planning. 
Analyze historical data trends and provide actionable budget recommendations.
Focus on identifying patterns, seasonality, growth trends, and variance characteristics.`;

    const userPrompt = `Analyze the following ${reportType} data and provide budget recommendations:

Historical Data (last 24 months):
${JSON.stringify(historicalData, null, 2)}

Please provide:
1. Recommended budget values for next year (monthly breakdown if patterns are clear)
2. Optimal variance threshold percentage based on historical variance patterns
3. Key insights and trends observed
4. Risk factors to consider
5. Confidence level in recommendations (low/medium/high)

Consider:
- Seasonal patterns and cyclical trends
- Growth or decline trajectories
- Historical variance between actual and budget
- Volatility and stability of metrics
- Industry best practices for rig operations`;

    // Call Lovable AI with structured output
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
        tools: [{
          type: 'function',
          function: {
            name: 'provide_budget_recommendations',
            description: 'Return structured budget recommendations based on historical analysis',
            parameters: {
              type: 'object',
              properties: {
                recommendedValues: {
                  type: 'object',
                  description: 'Recommended budget values by metric',
                  additionalProperties: { type: 'number' }
                },
                varianceThreshold: {
                  type: 'number',
                  description: 'Recommended variance threshold percentage (1-50)'
                },
                insights: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Key insights from the analysis'
                },
                trends: {
                  type: 'object',
                  properties: {
                    direction: { type: 'string', enum: ['increasing', 'decreasing', 'stable', 'volatile'] },
                    seasonality: { type: 'string', enum: ['high', 'medium', 'low', 'none'] },
                    predictability: { type: 'string', enum: ['high', 'medium', 'low'] }
                  },
                  required: ['direction', 'seasonality', 'predictability']
                },
                riskFactors: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Risk factors to consider'
                },
                confidence: {
                  type: 'string',
                  enum: ['low', 'medium', 'high'],
                  description: 'Confidence level in recommendations'
                },
                reasoning: {
                  type: 'string',
                  description: 'Explanation of the recommendation rationale'
                }
              },
              required: ['recommendedValues', 'varianceThreshold', 'insights', 'trends', 'riskFactors', 'confidence', 'reasoning'],
              additionalProperties: false
            }
          }
        }],
        tool_choice: { type: 'function', function: { name: 'provide_budget_recommendations' } }
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
          JSON.stringify({ error: 'Lovable AI credits exhausted. Please add credits to continue.' }), 
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    console.log('AI response:', JSON.stringify(aiData, null, 2));
    
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      throw new Error('No tool call in AI response');
    }

    const recommendations = JSON.parse(toolCall.function.arguments);

    return new Response(
      JSON.stringify({ 
        success: true,
        reportType,
        rigCode: rigCode || 'all',
        dataPoints: historicalData.length,
        recommendations 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in budget-recommendations:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { data, metric, timeframe } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Prepare data summary for AI
    const dataSummary = JSON.stringify(data.slice(-20)); // Last 20 data points
    
    const systemPrompt = `You are a predictive analytics AI expert specializing in oil & gas rig operations.
Analyze the provided ${metric} data and generate predictions.

Return your analysis in this exact JSON structure:
{
  "predictions": [
    {"period": "2024-01", "value": 1234567, "confidence": 85},
    {"period": "2024-02", "value": 1345678, "confidence": 82}
  ],
  "trend": "increasing|decreasing|stable",
  "insights": [
    "Key insight 1",
    "Key insight 2"
  ],
  "recommendations": [
    "Actionable recommendation 1",
    "Actionable recommendation 2"
  ],
  "risks": [
    "Potential risk 1"
  ],
  "confidence_overall": 85
}`;

    const userPrompt = `Analyze this ${metric} data for ${timeframe} and provide predictions:
${dataSummary}

Current trends observed:
- Latest value: ${data[data.length - 1]?.value || 'N/A'}
- Average: ${data.reduce((sum: number, d: any) => sum + (d.value || 0), 0) / data.length}
- Min: ${Math.min(...data.map((d: any) => d.value || 0))}
- Max: ${Math.max(...data.map((d: any) => d.value || 0))}

Generate ${timeframe === 'next_month' ? '1 month' : timeframe === 'next_quarter' ? '3 months' : '6 months'} predictions.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        tools: [{
          type: "function",
          function: {
            name: "provide_analytics",
            description: "Provide predictive analytics results",
            parameters: {
              type: "object",
              properties: {
                predictions: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      period: { type: "string" },
                      value: { type: "number" },
                      confidence: { type: "number" }
                    }
                  }
                },
                trend: { type: "string", enum: ["increasing", "decreasing", "stable"] },
                insights: { type: "array", items: { type: "string" } },
                recommendations: { type: "array", items: { type: "string" } },
                risks: { type: "array", items: { type: "string" } },
                confidence_overall: { type: "number" }
              },
              required: ["predictions", "trend", "insights", "recommendations"]
            }
          }
        }],
        tool_choice: { type: "function", function: { name: "provide_analytics" } }
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits." }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const result = await response.json();
    const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall) {
      throw new Error('No analytics generated');
    }

    const analytics = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(analytics), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Predictive analytics error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

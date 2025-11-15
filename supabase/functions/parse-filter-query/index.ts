import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, reportType, availableFields } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are a filter query parser that converts natural language queries into structured filters.

Available report types and their fields:
- utilization: rig, month, year, status, utilization_rate, operating_days, working_days, npt_days, client
- revenue: rig, month, year, revenue_actual, revenue_budget, dayrate_actual, dayrate_budget, variance, client
- billing_npt: rig, date, month, year, npt_hours, npt_type, billable, system, root_cause
- fuel_consumption: rig, month, year, total_consumed, total_received, closing_balance, fuel_cost
- rig_moves: rig, move_date, from_location, to_location, actual_cost, budgeted_cost
- work_orders: rig, month, year, mech_open, mech_closed, elec_open, elec_closed

Common filter patterns:
- Time ranges: "last month", "this quarter", "last 7 days", "Q1 2024", "January 2025"
- Performance: "high performers", "low utilization", "over budget", "under budget"
- Thresholds: ">85%", "<50%", "above $500K", "more than 24 hours"
- Status: "active", "operating", "billable", "non-billable"
- Comparisons: "top 10", "bottom 5", "best", "worst"

Convert the query into a filter configuration with:
1. dateRange: { start: ISO date, end: ISO date } for time-based filters
2. conditions: array of { field, operator, value } for value-based filters
3. sortBy: { field, direction: "asc" | "desc" } for ranking queries
4. limit: number for "top N" or "bottom N" queries

Operators: "=", "!=", ">", "<", ">=", "<=", "contains"

Examples:
- "show last month high performers" → dateRange (last month) + conditions (utilization_rate > 85)
- "rigs over budget in Q1" → dateRange (Q1) + conditions (variance > 0)
- "top 10 revenue generators" → sortBy (revenue_actual desc) + limit (10)
- "billable NPT this year" → dateRange (YTD) + conditions (billable = true)`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { 
            role: "user", 
            content: `Parse this query for ${reportType} report: "${query}"\n\nAvailable fields: ${availableFields.join(", ")}` 
          }
        ],
        tools: [{
          type: "function",
          function: {
            name: "apply_filters",
            description: "Apply parsed filters to the data table",
            parameters: {
              type: "object",
              properties: {
                dateRange: {
                  type: "object",
                  properties: {
                    start: { type: "string", description: "ISO date string" },
                    end: { type: "string", description: "ISO date string" },
                    label: { type: "string", description: "Human-readable description" }
                  }
                },
                conditions: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      field: { type: "string" },
                      operator: { type: "string", enum: ["=", "!=", ">", "<", ">=", "<=", "contains"] },
                      value: { type: ["string", "number", "boolean"] }
                    },
                    required: ["field", "operator", "value"]
                  }
                },
                sortBy: {
                  type: "object",
                  properties: {
                    field: { type: "string" },
                    direction: { type: "string", enum: ["asc", "desc"] }
                  }
                },
                limit: { type: "number" },
                summary: { type: "string", description: "Human-readable summary of applied filters" }
              },
              required: ["summary"]
            }
          }
        }],
        tool_choice: { type: "function", function: { name: "apply_filters" } }
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required. Please add credits to your workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall) {
      throw new Error("No filter configuration generated");
    }

    const filterConfig = JSON.parse(toolCall.function.arguments);

    return new Response(
      JSON.stringify({ filterConfig }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Parse filter query error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface VarianceData {
  rig: string;
  metric: string;
  actual: number;
  budget: number;
  variance: number;
  variancePercentage: number;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Starting budget variance alert check...");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get all active budget alerts
    const { data: alerts, error: alertsError } = await supabase
      .from("budget_alerts")
      .select("*, profiles!inner(email, full_name)")
      .eq("is_active", true);

    if (alertsError) {
      console.error("Error fetching alerts:", alertsError);
      throw alertsError;
    }

    if (!alerts || alerts.length === 0) {
      console.log("No active alerts found");
      return new Response(
        JSON.stringify({ message: "No active alerts to process" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Processing ${alerts.length} active alerts...`);

    const currentMonth = new Date().toLocaleString('default', { month: 'short' });
    const currentYear = new Date().getFullYear();
    let totalAlertsTriggered = 0;

    // Process each alert
    for (const alert of alerts) {
      try {
        console.log(`Processing alert for user ${alert.user_id}, report: ${alert.report_type}`);

        const variances: VarianceData[] = [];

        // Check variances based on report type
        if (alert.report_type === "revenue") {
          const { data: revenueData } = await supabase
            .from("revenue")
            .select("rig, revenue_actual, revenue_budget, month, year")
            .eq("year", currentYear)
            .eq("month", currentMonth);

          if (revenueData) {
            for (const record of revenueData) {
              const actual = Number(record.revenue_actual) || 0;
              const budget = Number(record.revenue_budget) || 0;
              if (budget > 0) {
                const variance = actual - budget;
                const variancePercentage = (variance / budget) * 100;
                
                if (Math.abs(variancePercentage) >= alert.threshold_percentage) {
                  variances.push({
                    rig: record.rig,
                    metric: "Revenue",
                    actual,
                    budget,
                    variance,
                    variancePercentage,
                  });
                }
              }
            }
          }
        } else if (alert.report_type === "utilization") {
          const { data: utilizationData } = await supabase
            .from("utilization")
            .select("rig, utilization_rate, month, year")
            .eq("year", currentYear)
            .eq("month", currentMonth);

          if (utilizationData) {
            // For utilization, we check if it's below expected (e.g., 85%)
            const targetUtilization = 85;
            for (const record of utilizationData) {
              const actual = Number(record.utilization_rate) || 0;
              const variance = actual - targetUtilization;
              const variancePercentage = (variance / targetUtilization) * 100;
              
              if (Math.abs(variancePercentage) >= alert.threshold_percentage) {
                variances.push({
                  rig: record.rig,
                  metric: "Utilization Rate",
                  actual,
                  budget: targetUtilization,
                  variance,
                  variancePercentage,
                });
              }
            }
          }
        } else if (alert.report_type === "billing_npt") {
          const { data: nptData } = await supabase
            .from("billing_npt")
            .select("rig, npt_hours, month, year")
            .eq("year", currentYear)
            .gte("date", `${currentYear}-${String(new Date().getMonth() + 1).padStart(2, '0')}-01`)
            .lte("date", `${currentYear}-${String(new Date().getMonth() + 1).padStart(2, '0')}-31`);

          if (nptData) {
            // Group NPT by rig
            const nptByRig = nptData.reduce((acc: any, record) => {
              if (!acc[record.rig]) acc[record.rig] = 0;
              acc[record.rig] += Number(record.npt_hours) || 0;
              return acc;
            }, {});

            // Target is to keep NPT low (e.g., max 50 hours per month per rig)
            const targetNPT = 50;
            for (const [rig, actualNPT] of Object.entries(nptByRig)) {
              const actual = actualNPT as number;
              if (actual > targetNPT) {
                const variance = actual - targetNPT;
                const variancePercentage = (variance / targetNPT) * 100;
                
                if (variancePercentage >= alert.threshold_percentage) {
                  variances.push({
                    rig,
                    metric: "NPT Hours",
                    actual,
                    budget: targetNPT,
                    variance,
                    variancePercentage,
                  });
                }
              }
            }
          }
        }

        if (variances.length > 0) {
          console.log(`Found ${variances.length} variances exceeding threshold for user ${alert.user_id}`);
          totalAlertsTriggered += variances.length;

          // Create in-app notification
          if (alert.alert_type === "in_app" || alert.alert_type === "both") {
            const notificationTitle = `Budget Alert: ${variances.length} ${alert.report_type} variance${variances.length > 1 ? 's' : ''} detected`;
            const notificationMessage = variances
              .slice(0, 5)
              .map(v => 
                `${v.rig} - ${v.metric}: ${v.variancePercentage > 0 ? '+' : ''}${v.variancePercentage.toFixed(1)}% (${v.actual.toLocaleString()} vs ${v.budget.toLocaleString()})`
              )
              .join('\n') + (variances.length > 5 ? `\n...and ${variances.length - 5} more` : '');

            const { error: notifError } = await supabase
              .from("notifications")
              .insert({
                user_id: alert.user_id,
                title: notificationTitle,
                message: notificationMessage,
                type: "warning",
                metadata: {
                  report_type: alert.report_type,
                  alert_id: alert.id,
                  variances: variances.slice(0, 10),
                },
              });

            if (notifError) {
              console.error("Error creating notification:", notifError);
            } else {
              console.log("In-app notification created successfully");
            }
          }

          // Send email notification
          if ((alert.alert_type === "email" || alert.alert_type === "both") && resendApiKey && alert.profiles?.email) {
            const userName = alert.profiles.full_name || "User";
            const emailHtml = `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #e53e3e;">⚠️ Budget Variance Alert</h2>
                <p>Hello ${userName},</p>
                <p>We detected <strong>${variances.length}</strong> budget variance${variances.length > 1 ? 's' : ''} for <strong>${alert.report_type}</strong> that exceed your ${alert.threshold_percentage}% threshold:</p>
                
                <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                  <thead>
                    <tr style="background-color: #f7fafc;">
                      <th style="padding: 10px; border: 1px solid #e2e8f0; text-align: left;">Rig</th>
                      <th style="padding: 10px; border: 1px solid #e2e8f0; text-align: left;">Metric</th>
                      <th style="padding: 10px; border: 1px solid #e2e8f0; text-align: right;">Actual</th>
                      <th style="padding: 10px; border: 1px solid #e2e8f0; text-align: right;">Budget</th>
                      <th style="padding: 10px; border: 1px solid #e2e8f0; text-align: right;">Variance</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${variances.slice(0, 10).map(v => `
                      <tr>
                        <td style="padding: 10px; border: 1px solid #e2e8f0;">${v.rig}</td>
                        <td style="padding: 10px; border: 1px solid #e2e8f0;">${v.metric}</td>
                        <td style="padding: 10px; border: 1px solid #e2e8f0; text-align: right;">${v.actual.toLocaleString()}</td>
                        <td style="padding: 10px; border: 1px solid #e2e8f0; text-align: right;">${v.budget.toLocaleString()}</td>
                        <td style="padding: 10px; border: 1px solid #e2e8f0; text-align: right; color: ${v.variancePercentage > 0 ? '#48bb78' : '#e53e3e'};">
                          ${v.variancePercentage > 0 ? '+' : ''}${v.variancePercentage.toFixed(1)}%
                        </td>
                      </tr>
                    `).join('')}
                    ${variances.length > 10 ? `
                      <tr>
                        <td colspan="5" style="padding: 10px; border: 1px solid #e2e8f0; text-align: center; color: #718096;">
                          ...and ${variances.length - 10} more variances
                        </td>
                      </tr>
                    ` : ''}
                  </tbody>
                </table>
                
                <p style="margin-top: 20px;">Please review your budget performance and take necessary actions.</p>
                <p style="color: #718096; font-size: 12px; margin-top: 30px;">
                  You received this email because you have budget variance alerts enabled. 
                  You can manage your alert settings in the Smart Budget Settings.
                </p>
              </div>
            `;

            try {
              const response = await fetch("https://api.resend.com/emails", {
                method: "POST",
                headers: {
                  "Authorization": `Bearer ${resendApiKey}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  from: "Budget Alerts <onboarding@resend.dev>",
                  to: [alert.profiles.email],
                  subject: `⚠️ Budget Alert: ${variances.length} variance${variances.length > 1 ? 's' : ''} detected in ${alert.report_type}`,
                  html: emailHtml,
                }),
              });

              if (response.ok) {
                console.log(`Email sent to ${alert.profiles.email}`);
              } else {
                const error = await response.text();
                console.error("Error sending email:", error);
              }
            } catch (emailError) {
              console.error("Error sending email:", emailError);
            }
          }
        }
      } catch (error) {
        console.error(`Error processing alert ${alert.id}:`, error);
      }
    }

    console.log(`Budget variance check completed. ${totalAlertsTriggered} alerts triggered.`);

    return new Response(
      JSON.stringify({
        success: true,
        alertsProcessed: alerts.length,
        alertsTriggered: totalAlertsTriggered,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in budget-variance-alerts function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

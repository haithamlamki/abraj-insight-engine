import { supabase } from "@/integrations/supabase/client";

export async function importActualsAs2025Budget(versionId: string) {
  console.log("Starting import of 2024 actuals as 2025 budget...");
  
  // Get user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Fetch reference data
  const [reportsRes, metricsRes, rigsRes] = await Promise.all([
    supabase.from("dim_report").select("*").eq("active", true),
    supabase.from("dim_metric").select("*").eq("active", true),
    supabase.from("dim_rig").select("*").eq("active", true),
  ]);

  if (reportsRes.error) throw reportsRes.error;
  if (metricsRes.error) throw metricsRes.error;
  if (rigsRes.error) throw rigsRes.error;

  const reports = reportsRes.data;
  const metrics = metricsRes.data;
  const rigs = rigsRes.data;

  const budgetRecords: any[] = [];

  // Helper to find entities
  const findReport = (key: string) => reports.find(r => r.report_key === key);
  const findMetric = (reportId: string, key: string) => 
    metrics.find(m => m.report_id === reportId && m.metric_key === key);
  const findRig = (name: string) => rigs.find(r => r.rig_name === name);

  const monthMap: Record<string, number> = {
    "January": 1, "February": 2, "March": 3, "April": 4, "May": 5, "June": 6,
    "July": 7, "August": 8, "September": 9, "October": 10, "November": 11, "December": 12
  };

  // 1. Import Revenue actuals
  console.log("Importing revenue actuals...");
  const { data: revenueData, error: revenueError } = await supabase
    .from("revenue")
    .select("*")
    .eq("year", 2024);
  
  if (revenueError) throw revenueError;

  const revenueReport = findReport("revenue");
  if (revenueReport && revenueData) {
    for (const row of revenueData) {
      const rig = findRig(row.rig);
      if (!rig) continue;
      const month = monthMap[row.month];
      if (!month) continue;

      const metricsToImport = [
        { key: "revenue_actual", value: row.revenue_actual },
        { key: "dayrate_actual", value: row.dayrate_actual },
        { key: "working_days", value: row.working_days },
        { key: "fuel_charge", value: row.fuel_charge },
        { key: "npt_repair", value: row.npt_repair },
        { key: "npt_zero", value: row.npt_zero },
      ];

      for (const m of metricsToImport) {
        const metric = findMetric(revenueReport.id, m.key);
        if (metric && m.value != null) {
          budgetRecords.push({
            version_id: versionId,
            report_id: revenueReport.id,
            rig_id: rig.id,
            metric_id: metric.id,
            year: 2025,
            month,
            budget_value: m.value,
            created_by: user.id,
            updated_by: user.id,
          });
        }
      }
    }
  }

  // 2. Import Utilization actuals
  console.log("Importing utilization actuals...");
  const { data: utilizationData, error: utilizationError } = await supabase
    .from("utilization")
    .select("*")
    .eq("year", 2024);
  
  if (utilizationError) throw utilizationError;

  const utilizationReport = findReport("utilization");
  if (utilizationReport && utilizationData) {
    for (const row of utilizationData) {
      const rig = findRig(row.rig);
      if (!rig) continue;
      const month = monthMap[row.month];
      if (!month) continue;

      const metricsToImport = [
        { key: "operating_days", value: row.operating_days },
        { key: "npt_days", value: row.npt_days },
        { key: "utilization_rate", value: row.utilization_rate },
        { key: "working_days", value: row.working_days },
      ];

      for (const m of metricsToImport) {
        const metric = findMetric(utilizationReport.id, m.key);
        if (metric && m.value != null) {
          budgetRecords.push({
            version_id: versionId,
            report_id: utilizationReport.id,
            rig_id: rig.id,
            metric_id: metric.id,
            year: 2025,
            month,
            budget_value: m.value,
            created_by: user.id,
            updated_by: user.id,
          });
        }
      }
    }
  }

  // 3. Import Fuel Consumption actuals
  console.log("Importing fuel consumption actuals...");
  const { data: fuelData, error: fuelError } = await supabase
    .from("fuel_consumption")
    .select("*")
    .eq("year", 2024);
  
  if (fuelError) throw fuelError;

  const fuelReport = findReport("fuel");
  if (fuelReport && fuelData) {
    for (const row of fuelData) {
      const rig = findRig(row.rig);
      if (!rig) continue;
      const month = monthMap[row.month];
      if (!month) continue;

      const metricsToImport = [
        { key: "fuel_cost_usd", value: row.fuel_cost },
        { key: "total_consumed", value: row.total_consumed },
        { key: "rig_engine_consumption", value: row.rig_engine_consumption },
      ];

      for (const m of metricsToImport) {
        const metric = findMetric(fuelReport.id, m.key);
        if (metric && m.value != null) {
          budgetRecords.push({
            version_id: versionId,
            report_id: fuelReport.id,
            rig_id: rig.id,
            metric_id: metric.id,
            year: 2025,
            month,
            budget_value: m.value,
            created_by: user.id,
            updated_by: user.id,
          });
        }
      }
    }
  }

  // 4. Import Work Orders actuals
  console.log("Importing work orders actuals...");
  const { data: workOrdersData, error: workOrdersError } = await supabase
    .from("work_orders")
    .select("*")
    .eq("year", 2024);
  
  if (workOrdersError) throw workOrdersError;

  const workOrdersReport = findReport("work_orders");
  if (workOrdersReport && workOrdersData) {
    for (const row of workOrdersData) {
      const rig = findRig(row.rig);
      if (!rig) continue;
      const month = monthMap[row.month];
      if (!month) continue;

      const metricsToImport = [
        { key: "compliance_rate_percent", value: row.compliance_rate },
        { key: "total_open", value: (row.elec_open || 0) + (row.mech_open || 0) + (row.oper_open || 0) },
        { key: "total_closed", value: (row.elec_closed || 0) + (row.mech_closed || 0) + (row.oper_closed || 0) },
      ];

      for (const m of metricsToImport) {
        const metric = findMetric(workOrdersReport.id, m.key);
        if (metric && m.value != null) {
          budgetRecords.push({
            version_id: versionId,
            report_id: workOrdersReport.id,
            rig_id: rig.id,
            metric_id: metric.id,
            year: 2025,
            month,
            budget_value: m.value,
            created_by: user.id,
            updated_by: user.id,
          });
        }
      }
    }
  }

  // 5. Import Customer Satisfaction actuals
  console.log("Importing customer satisfaction actuals...");
  const { data: csatData, error: csatError } = await supabase
    .from("customer_satisfaction")
    .select("*")
    .eq("year", 2024);
  
  if (csatError) throw csatError;

  const csatReport = findReport("customer_satisfaction");
  if (csatReport && csatData) {
    for (const row of csatData) {
      const rig = findRig(row.rig);
      if (!rig) continue;
      const month = monthMap[row.month];
      if (!month) continue;

      const metric = findMetric(csatReport.id, "satisfaction_score_percent");
      if (metric && row.satisfaction_score != null) {
        budgetRecords.push({
          version_id: versionId,
          report_id: csatReport.id,
          rig_id: rig.id,
          metric_id: metric.id,
          year: 2025,
          month,
          budget_value: row.satisfaction_score,
          created_by: user.id,
          updated_by: user.id,
        });
      }
    }
  }

  // 6. Import Billing NPT Summary actuals
  console.log("Importing billing NPT actuals...");
  const { data: nptData, error: nptError } = await supabase
    .from("billing_npt_summary")
    .select("*")
    .eq("year", 2024);
  
  if (nptError) throw nptError;

  const nptReport = findReport("billing_npt");
  if (nptReport && nptData) {
    for (const row of nptData) {
      const rig = findRig(row.rig);
      if (!rig) continue;
      const month = monthMap[row.month];
      if (!month) continue;

      const metricsToImport = [
        { key: "total_npt_hours", value: row.total_npt },
        { key: "operational_rate_hours", value: row.opr_rate },
        { key: "repair_rate_hours", value: row.repair_rate },
      ];

      for (const m of metricsToImport) {
        const metric = findMetric(nptReport.id, m.key);
        if (metric && m.value != null) {
          budgetRecords.push({
            version_id: versionId,
            report_id: nptReport.id,
            rig_id: rig.id,
            metric_id: metric.id,
            year: 2025,
            month,
            budget_value: m.value,
            created_by: user.id,
            updated_by: user.id,
          });
        }
      }
    }
  }

  // Insert all budget records in batches
  console.log(`Inserting ${budgetRecords.length} budget records...`);
  const batchSize = 500;
  for (let i = 0; i < budgetRecords.length; i += batchSize) {
    const batch = budgetRecords.slice(i, i + batchSize);
    const { error } = await supabase.from("fact_budget").upsert(batch);
    if (error) throw error;
  }

  console.log("Import completed successfully!");
  return budgetRecords.length;
}

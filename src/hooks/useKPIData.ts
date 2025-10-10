import { useMemo } from "react";
import { useReportData } from "./useReportData";

/**
 * Hook to calculate KPIs from report data
 */
export function useKPIData(reportType: string) {
  const { data, isLoading, error } = useReportData(reportType);

  const kpis = useMemo(() => {
    if (!data || data.length === 0) return null;

    switch (reportType) {
      case "revenue": {
        const totalRevenue = data.reduce((sum, row) => sum + (Number(row.revenue_actual) || 0), 0);
        const totalBudget = data.reduce((sum, row) => sum + (Number(row.revenue_budget) || 0), 0);
        const variance = totalBudget > 0 ? ((totalRevenue - totalBudget) / totalBudget) * 100 : 0;
        const avgDayrate = data.length > 0 ? data.reduce((sum, row) => sum + (Number(row.dayrate_actual) || 0), 0) / data.length : 0;

        return {
          totalRevenue: totalRevenue.toFixed(0),
          variance: variance.toFixed(1),
          avgDayrate: avgDayrate.toFixed(0),
          recordCount: data.length,
        };
      }

      case "work_orders": {
        const totalOpen = data.reduce((sum, row) => 
          sum + (Number(row.mech_open) || 0) + (Number(row.elec_open) || 0) + (Number(row.oper_open) || 0), 0);
        const totalClosed = data.reduce((sum, row) => 
          sum + (Number(row.mech_closed) || 0) + (Number(row.elec_closed) || 0) + (Number(row.oper_closed) || 0), 0);
        const avgCompliance = data.length > 0 ? 
          data.reduce((sum, row) => sum + (Number(row.compliance_rate) || 0), 0) / data.length : 0;

        return {
          totalOpen,
          totalClosed,
          avgCompliance: avgCompliance.toFixed(1),
          recordCount: data.length,
        };
      }

      case "utilization": {
        const avgUtilization = data.length > 0 ?
          data.reduce((sum, row) => sum + (Number(row.utilization_rate) || 0), 0) / data.length : 0;
        const totalWorkingDays = data.reduce((sum, row) => sum + (Number(row.working_days) || 0), 0);
        const totalNPT = data.reduce((sum, row) => sum + (Number(row.npt_days) || 0), 0);

        return {
          avgUtilization: avgUtilization.toFixed(1),
          totalWorkingDays: totalWorkingDays.toFixed(0),
          totalNPT: totalNPT.toFixed(1),
          recordCount: data.length,
        };
      }

      case "fuel_consumption": {
        const totalFuel = data.reduce((sum, row) => sum + (Number(row.fuel_consumed) || 0), 0);
        const totalCost = data.reduce((sum, row) => sum + (Number(row.total_cost) || 0), 0);
        const avgPrice = totalFuel > 0 ? totalCost / totalFuel : 0;

        return {
          totalFuel: totalFuel.toFixed(0),
          totalCost: totalCost.toFixed(0),
          avgPrice: avgPrice.toFixed(2),
          recordCount: data.length,
        };
      }

      case "rig_moves": {
        const totalMoves = data.length;
        const totalDistance = data.reduce((sum, row) => sum + (Number(row.distance_km) || 0), 0);
        const totalCost = data.reduce((sum, row) => sum + (Number(row.actual_cost) || 0), 0);
        const totalProfit = data.reduce((sum, row) => sum + (Number(row.profit_loss) || 0), 0);

        return {
          totalMoves,
          totalDistance: totalDistance.toFixed(0),
          totalCost: totalCost.toFixed(0),
          totalProfit: totalProfit.toFixed(0),
        };
      }

      case "billing_npt": {
        const totalNPT = data.reduce((sum, row) => sum + (Number(row.npt_hours) || 0), 0);
        const billableCount = data.filter(row => row.billable).length;
        const billableRate = data.length > 0 ? (billableCount / data.length) * 100 : 0;

        return {
          totalNPT: totalNPT.toFixed(1),
          billableCount,
          billableRate: billableRate.toFixed(1),
          recordCount: data.length,
        };
      }

      case "stock": {
        const lowStock = data.filter(row => row.status === "Low" || row.status === "Critical").length;
        const totalItems = data.length;
        const avgStock = data.length > 0 ?
          data.reduce((sum, row) => sum + (Number(row.current_qty) || 0), 0) / data.length : 0;

        return {
          lowStock,
          totalItems,
          avgStock: avgStock.toFixed(0),
          stockHealth: totalItems > 0 ? ((totalItems - lowStock) / totalItems * 100).toFixed(1) : "0",
        };
      }

      case "customer_satisfaction": {
        const avgScore = data.length > 0 ?
          data.reduce((sum, row) => sum + (Number(row.satisfaction_score) || 0), 0) / data.length : 0;
        const highScores = data.filter(row => Number(row.satisfaction_score) >= 4).length;
        const satisfactionRate = data.length > 0 ? (highScores / data.length) * 100 : 0;

        return {
          avgScore: avgScore.toFixed(1),
          highScores,
          satisfactionRate: satisfactionRate.toFixed(1),
          recordCount: data.length,
        };
      }

      case "well_tracker": {
        const activeWells = data.filter(row => row.status === "Active" || row.status === "Drilling").length;
        const completedWells = data.filter(row => row.status === "Completed").length;
        const totalDepth = data.reduce((sum, row) => sum + (Number(row.actual_depth) || 0), 0);

        return {
          activeWells,
          completedWells,
          totalDepth: totalDepth.toFixed(0),
          recordCount: data.length,
        };
      }

      default:
        return {
          recordCount: data.length,
        };
    }
  }, [data, reportType]);

  return { kpis, isLoading, error };
}

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface MISFilters {
  rigs?: string[];
  startDate?: string;
  endDate?: string;
  year?: number;
  month?: string;
}

export function useMISData(filters: MISFilters = {}) {
  return useQuery({
    queryKey: ["mis-data", filters],
    queryFn: async () => {
      const { rigs, startDate, endDate, year, month } = filters;

      // Build date filter for billing_npt
      let dateFilter = supabase.from("billing_npt").select("*");
      if (rigs && rigs.length > 0) {
        dateFilter = dateFilter.in("rig", rigs);
      }
      if (startDate) {
        dateFilter = dateFilter.gte("date", startDate);
      }
      if (endDate) {
        dateFilter = dateFilter.lte("date", endDate);
      }
      if (year) {
        dateFilter = dateFilter.eq("year", year);
      }
      if (month) {
        dateFilter = dateFilter.eq("month", month);
      }

      // Build filters for month-based tables
      const buildMonthFilter = (query: any) => {
        let filtered = query;
        if (rigs && rigs.length > 0) {
          filtered = filtered.in("rig", rigs);
        }
        if (year) {
          filtered = filtered.eq("year", year);
        }
        if (month) {
          filtered = filtered.eq("month", month);
        }
        return filtered;
      };

      // Fetch all data in parallel
      const [
        revenueResult,
        utilizationResult,
        billingNptResult,
        billingNptSummaryResult,
        workOrdersResult,
        fuelResult,
        stockResult,
        satisfactionResult,
        rigMovesResult,
        wellTrackerResult,
      ] = await Promise.all([
        buildMonthFilter(supabase.from("revenue").select("*")).order("created_at", { ascending: false }),
        buildMonthFilter(supabase.from("utilization").select("*")).order("created_at", { ascending: false }),
        dateFilter.order("date", { ascending: false }),
        buildMonthFilter(supabase.from("billing_npt_summary").select("*")).order("created_at", { ascending: false }),
        buildMonthFilter(supabase.from("work_orders").select("*")).order("created_at", { ascending: false }),
        buildMonthFilter(supabase.from("fuel_consumption").select("*")).order("created_at", { ascending: false }),
        (rigs && rigs.length > 0 
          ? supabase.from("stock_levels").select("*").in("rig", rigs)
          : supabase.from("stock_levels").select("*")
        ).order("created_at", { ascending: false }),
        buildMonthFilter(supabase.from("customer_satisfaction").select("*")).order("created_at", { ascending: false }),
        (rigs && rigs.length > 0 
          ? supabase.from("rig_moves").select("*").in("rig", rigs)
          : supabase.from("rig_moves").select("*")
        ).order("move_date", { ascending: false }),
        (rigs && rigs.length > 0 
          ? supabase.from("well_tracker").select("*").in("rig", rigs)
          : supabase.from("well_tracker").select("*")
        ).order("start_date", { ascending: false }),
      ]);

      // Calculate KPIs
      const revenue = revenueResult.data || [];
      const utilization = utilizationResult.data || [];
      const billingNpt = billingNptResult.data || [];
      const workOrders = workOrdersResult.data || [];
      const stock = stockResult.data || [];
      const satisfaction = satisfactionResult.data || [];
      const fuel = fuelResult.data || [];
      const rigMoves = rigMovesResult.data || [];
      const wells = wellTrackerResult.data || [];

      // Total Revenue
      const totalRevenue = revenue.reduce((sum, r) => sum + (Number(r.revenue_actual) || 0), 0);
      const totalBudget = revenue.reduce((sum, r) => sum + (Number(r.revenue_budget) || 0), 0);
      const revenueVariance = totalRevenue - totalBudget;
      const revenueVariancePercent = totalBudget > 0 ? ((revenueVariance / totalBudget) * 100) : 0;

      // Utilization
      const avgUtilization = utilization.length > 0
        ? utilization.reduce((sum, u) => sum + (Number(u.utilization_rate) || 0), 0) / utilization.length
        : 0;

      // NPT
      const totalNPT = billingNpt.reduce((sum, n) => sum + (Number(n.npt_hours) || 0), 0);
      const billableNPT = billingNpt.filter(n => n.billable).reduce((sum, n) => sum + (Number(n.npt_hours) || 0), 0);
      const nonBillableNPT = totalNPT - billableNPT;

      // Stock Level - Critical & Low
      const criticalStock = stock.filter(s => s.status === "Critical").length;
      const lowStock = stock.filter(s => s.status === "Low").length;

      // Work Orders
      const totalOpenWOs = workOrders.reduce((sum, wo) => 
        sum + (Number(wo.mech_open) || 0) + (Number(wo.elec_open) || 0) + (Number(wo.oper_open) || 0), 0);
      const totalClosedWOs = workOrders.reduce((sum, wo) => 
        sum + (Number(wo.mech_closed) || 0) + (Number(wo.elec_closed) || 0) + (Number(wo.oper_closed) || 0), 0);

      // Customer Satisfaction
      const avgSatisfaction = satisfaction.length > 0
        ? satisfaction.reduce((sum, s) => sum + (Number(s.satisfaction_score) || 0), 0) / satisfaction.length
        : 0;

      // Fuel
      const totalFuelConsumed = fuel.reduce((sum, f) => sum + (Number(f.total_consumed) || 0), 0);
      const totalFuelCost = fuel.reduce((sum, f) => sum + (Number(f.fuel_cost) || 0), 0);

      // Rig Moves
      const totalRigMoves = rigMoves.length;
      const rigMoveCostVariance = rigMoves.reduce((sum, rm) => sum + (Number(rm.variance_cost) || 0), 0);

      // Wells
      const activeWells = wells.filter(w => w.status === "Active" || w.status === "Drilling").length;
      const completedWells = wells.filter(w => w.status === "Completed").length;

      // Active Rigs
      const activeRigs = new Set([
        ...revenue.map(r => r.rig),
        ...utilization.filter(u => u.status === "Active").map(u => u.rig)
      ]).size;

      return {
        kpis: {
          totalRevenue,
          revenueVariance,
          revenueVariancePercent,
          avgUtilization,
          totalNPT,
          billableNPT,
          nonBillableNPT,
          criticalStock,
          lowStock,
          totalOpenWOs,
          totalClosedWOs,
          avgSatisfaction,
          totalFuelConsumed,
          totalFuelCost,
          totalRigMoves,
          rigMoveCostVariance,
          activeWells,
          completedWells,
          activeRigs,
        },
        data: {
          revenue,
          utilization,
          billingNpt,
          billingNptSummary: billingNptSummaryResult.data || [],
          workOrders,
          fuel,
          stock,
          satisfaction,
          rigMoves,
          wells,
        },
      };
    },
  });
}

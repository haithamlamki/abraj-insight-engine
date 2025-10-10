import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Hook to fetch aggregated dashboard data
 */
export function useDashboardData() {
  return useQuery({
    queryKey: ["dashboard-data"],
    queryFn: async () => {
      // Fetch latest data from all tables
      const [
        revenueData,
        utilizationData,
        workOrdersData,
        nptData,
        stockData,
      ] = await Promise.all([
        supabase.from("revenue").select("*").order("created_at", { ascending: false }).limit(10),
        supabase.from("utilization").select("*").order("created_at", { ascending: false }).limit(10),
        supabase.from("work_orders").select("*").order("created_at", { ascending: false }).limit(10),
        supabase.from("billing_npt").select("*").order("created_at", { ascending: false }).limit(10),
        supabase.from("stock_levels").select("*").order("created_at", { ascending: false }).limit(50),
      ]);

      // Calculate key metrics
      const totalRevenue = revenueData.data?.reduce((sum, row) => sum + (Number(row.revenue_actual) || 0), 0) || 0;
      
      const avgUtilization = utilizationData.data && utilizationData.data.length > 0
        ? utilizationData.data.reduce((sum, row) => sum + (Number(row.utilization_rate) || 0), 0) / utilizationData.data.length
        : 0;

      const totalOpenWOs = workOrdersData.data?.reduce((sum, row) => 
        sum + (Number(row.mech_open) || 0) + (Number(row.elec_open) || 0) + (Number(row.oper_open) || 0), 0) || 0;

      const totalNPT = nptData.data?.reduce((sum, row) => sum + (Number(row.npt_hours) || 0), 0) || 0;

      const lowStockItems = stockData.data?.filter(row => 
        row.status === "Low" || row.status === "Critical"
      ).length || 0;

      const activeRigs = new Set([
        ...revenueData.data?.map(r => r.rig) || [],
        ...utilizationData.data?.map(r => r.rig) || []
      ]).size;

      return {
        totalRevenue,
        avgUtilization,
        totalOpenWOs,
        totalNPT,
        lowStockItems,
        activeRigs,
        recentRevenue: revenueData.data || [],
        recentUtilization: utilizationData.data || [],
      };
    },
  });
}

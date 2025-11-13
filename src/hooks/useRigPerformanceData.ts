import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface MonthlyData {
  month: number;
  monthName: string;
  actualNPT: number;
  allowableNPT: number;
  operatingDays: number;
  efficiency: number;
  status: string;
  complianceRate: number;
}

export interface RigPerformanceData {
  rigId: string;
  rigName: string;
  year: number;
  monthlyData: MonthlyData[];
  annualStats: {
    totalNPT: number;
    totalAllowableNPT: number;
    avgEfficiency: number;
    complianceRate: number;
    totalOperatingDays: number;
  };
  trend: "improving" | "declining" | "stable";
  color: string;
}

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

const RIG_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "#8B5CF6", // Purple
  "#EC4899", // Pink
  "#F59E0B", // Amber
  "#10B981", // Emerald
  "#3B82F6", // Blue
  "#EF4444", // Red
  "#6366F1", // Indigo
];

/**
 * Hook to fetch rig performance data for the entire year
 */
export function useRigPerformanceData(year: number, selectedRigs?: string[]) {
  return useQuery({
    queryKey: ["rig-performance-data", year, selectedRigs],
    queryFn: async () => {
      // Fetch utilization data for the entire year
      const { data: utilizationData, error } = await supabase
        .from("utilization")
        .select("*")
        .eq("year", year)
        .order("rig", { ascending: true })
        .order("month", { ascending: true });

      if (error) throw error;

      if (!utilizationData || utilizationData.length === 0) {
        return {
          rigs: [],
          allRigs: [],
          summary: {
            totalRigs: 0,
            avgEfficiency: 0,
            totalNPT: 0,
            totalOperatingDays: 0,
          },
        };
      }

      // Group data by rig
      const rigMap = new Map<string, any[]>();
      utilizationData.forEach((record) => {
        if (!rigMap.has(record.rig)) {
          rigMap.set(record.rig, []);
        }
        rigMap.get(record.rig)?.push(record);
      });

      // Process each rig
      const allRigs: RigPerformanceData[] = [];
      let colorIndex = 0;

      for (const [rigName, records] of rigMap.entries()) {
        // Create monthly data for all 12 months
        const monthlyData: MonthlyData[] = [];
        
        for (let month = 1; month <= 12; month++) {
          const record = records.find((r) => {
            // Handle both string and number month values
            const recordMonth = typeof r.month === 'string' 
              ? MONTH_NAMES.indexOf(r.month) + 1 
              : parseInt(r.month);
            return recordMonth === month;
          });

          if (record) {
            const actualNPT = Number(record.npt_days) || 0;
            const allowableNPT = Number(record.allowable_npt) || 0;
            const operatingDays = Number(record.operating_days) || 0;
            const utilizationRate = Number(record.utilization_rate) || 0;
            
            const complianceRate = allowableNPT > 0 
              ? Math.min(100, ((allowableNPT - actualNPT) / allowableNPT) * 100)
              : 100;

            monthlyData.push({
              month,
              monthName: MONTH_NAMES[month - 1],
              actualNPT,
              allowableNPT,
              operatingDays,
              efficiency: utilizationRate,
              status: record.status || "Active",
              complianceRate: Math.max(0, complianceRate),
            });
          } else {
            // No data for this month
            monthlyData.push({
              month,
              monthName: MONTH_NAMES[month - 1],
              actualNPT: 0,
              allowableNPT: 0,
              operatingDays: 0,
              efficiency: 0,
              status: "No Data",
              complianceRate: 100,
            });
          }
        }

        // Calculate annual statistics
        const totalNPT = monthlyData.reduce((sum, m) => sum + m.actualNPT, 0);
        const totalAllowableNPT = monthlyData.reduce((sum, m) => sum + m.allowableNPT, 0);
        const totalOperatingDays = monthlyData.reduce((sum, m) => sum + m.operatingDays, 0);
        const monthsWithData = monthlyData.filter(m => m.operatingDays > 0).length;
        const avgEfficiency = monthsWithData > 0
          ? monthlyData.reduce((sum, m) => sum + m.efficiency, 0) / monthsWithData
          : 0;
        const complianceRate = totalAllowableNPT > 0
          ? Math.min(100, Math.max(0, ((totalAllowableNPT - totalNPT) / totalAllowableNPT) * 100))
          : 100;

        // Determine trend (compare first 6 months vs last 6 months)
        const firstHalfEfficiency = monthlyData
          .slice(0, 6)
          .filter(m => m.operatingDays > 0)
          .reduce((sum, m) => sum + m.efficiency, 0) / 6;
        const secondHalfEfficiency = monthlyData
          .slice(6, 12)
          .filter(m => m.operatingDays > 0)
          .reduce((sum, m) => sum + m.efficiency, 0) / 6;
        
        let trend: "improving" | "declining" | "stable" = "stable";
        if (secondHalfEfficiency > firstHalfEfficiency + 2) {
          trend = "improving";
        } else if (secondHalfEfficiency < firstHalfEfficiency - 2) {
          trend = "declining";
        }

        allRigs.push({
          rigId: rigName,
          rigName,
          year,
          monthlyData,
          annualStats: {
            totalNPT,
            totalAllowableNPT,
            avgEfficiency,
            complianceRate,
            totalOperatingDays,
          },
          trend,
          color: RIG_COLORS[colorIndex % RIG_COLORS.length],
        });

        colorIndex++;
      }

      // Filter by selected rigs if provided
      const filteredRigs = selectedRigs && selectedRigs.length > 0
        ? allRigs.filter(r => selectedRigs.includes(r.rigName))
        : allRigs;

      // Calculate summary
      const summary = {
        totalRigs: allRigs.length,
        avgEfficiency: allRigs.length > 0
          ? allRigs.reduce((sum, r) => sum + r.annualStats.avgEfficiency, 0) / allRigs.length
          : 0,
        totalNPT: allRigs.reduce((sum, r) => sum + r.annualStats.totalNPT, 0),
        totalOperatingDays: allRigs.reduce((sum, r) => sum + r.annualStats.totalOperatingDays, 0),
      };

      return {
        rigs: filteredRigs,
        allRigs,
        summary,
      };
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
}

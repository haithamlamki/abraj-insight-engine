import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface FuelRecord {
  id: string;
  rig: string;
  date: string;
  fuel_consumed: number;
  fuel_type: string;
  unit_price: number;
  total_cost: number;
  supplier: string;
  remarks: string;
}

export interface FuelFilters {
  year?: number;
  month?: number;
  wbsElement?: string;
  costElement?: string;
  minValue?: number;
  maxValue?: number;
  searchText?: string;
}

export const useFuelAnalytics = (filters: FuelFilters = {}) => {
  return useQuery({
    queryKey: ['fuel-analytics', filters],
    queryFn: async () => {
      let query = supabase
        .from('fuel_consumption')
        .select('*')
        .order('date', { ascending: false });

      // Apply filters
      if (filters.year) {
        query = query.gte('date', `${filters.year}-01-01`)
                    .lte('date', `${filters.year}-12-31`);
      }
      
      if (filters.month && filters.year) {
        const monthStr = filters.month.toString().padStart(2, '0');
        query = query.gte('date', `${filters.year}-${monthStr}-01`)
                    .lte('date', `${filters.year}-${monthStr}-31`);
      }

      if (filters.wbsElement) {
        query = query.eq('rig', filters.wbsElement);
      }

      if (filters.costElement) {
        query = query.eq('fuel_type', filters.costElement);
      }

      if (filters.minValue !== undefined) {
        query = query.gte('total_cost', filters.minValue);
      }

      if (filters.maxValue !== undefined) {
        query = query.lte('total_cost', filters.maxValue);
      }

      if (filters.searchText) {
        query = query.or(`remarks.ilike.%${filters.searchText}%,supplier.ilike.%${filters.searchText}%`);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Calculate analytics
      const records = data as FuelRecord[];
      
      const totalCost = records.reduce((sum, r) => sum + (r.total_cost || 0), 0);
      const uniqueRigs = [...new Set(records.map(r => r.rig))];
      const avgCostPerRig = uniqueRigs.length > 0 ? totalCost / uniqueRigs.length : 0;

      // Top 5 cost elements
      const costByType = records.reduce((acc, r) => {
        const type = r.fuel_type || 'Unknown';
        acc[type] = (acc[type] || 0) + (r.total_cost || 0);
        return acc;
      }, {} as Record<string, number>);

      const topCostElements = Object.entries(costByType)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, value]) => ({ name, value }));

      // Cost by WBS Element (Rig)
      const costByRig = records.reduce((acc, r) => {
        const rig = r.rig || 'Unknown';
        acc[rig] = (acc[rig] || 0) + (r.total_cost || 0);
        return acc;
      }, {} as Record<string, number>);

      const rigBreakdown = Object.entries(costByRig)
        .sort((a, b) => b[1] - a[1])
        .map(([name, value]) => ({ name, value }));

      // Monthly trend
      const monthlyData = records.reduce((acc, r) => {
        const date = new Date(r.date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        if (!acc[monthKey]) {
          acc[monthKey] = { month: monthKey, cost: 0, count: 0 };
        }
        acc[monthKey].cost += r.total_cost || 0;
        acc[monthKey].count += 1;
        return acc;
      }, {} as Record<string, { month: string; cost: number; count: number }>);

      const monthlyTrend = Object.values(monthlyData).sort((a, b) => 
        a.month.localeCompare(b.month)
      );

      // Yearly comparison
      const yearlyData = records.reduce((acc, r) => {
        const year = new Date(r.date).getFullYear();
        if (!acc[year]) {
          acc[year] = { year: year.toString(), cost: 0, count: 0 };
        }
        acc[year].cost += r.total_cost || 0;
        acc[year].count += 1;
        return acc;
      }, {} as Record<number, { year: string; cost: number; count: number }>);

      const yearlyComparison = Object.values(yearlyData).sort((a, b) => 
        a.year.localeCompare(b.year)
      );

      // Cost element breakdown for pie chart
      const costElementBreakdown = Object.entries(costByType)
        .map(([name, value]) => ({ 
          name, 
          value,
          percentage: (value / totalCost * 100).toFixed(1)
        }));

      return {
        records,
        totalCost,
        avgCostPerRig,
        uniqueRigsCount: uniqueRigs.length,
        topCostElements,
        rigBreakdown,
        monthlyTrend,
        yearlyComparison,
        costElementBreakdown,
      };
    },
  });
};

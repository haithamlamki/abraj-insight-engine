import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface FuelRecord {
  id: string;
  rig: string;
  year: number;
  month: string;
  opening_stock: number;
  total_received: number;
  total_consumed: number;
  rig_engine_consumption: number;
  camp_engine_consumption: number;
  invoice_to_client: number;
  other_site_consumers: number;
  vehicles_consumption: number;
  closing_balance: number;
  fuel_cost: number;
}

export interface FuelFilters {
  year?: number;
  month?: string;
  rig?: string;
  minCost?: number;
  maxCost?: number;
  searchText?: string;
}

export const useFuelAnalytics = (filters: FuelFilters = {}) => {
  return useQuery({
    queryKey: ['fuel-analytics', filters],
    queryFn: async () => {
      let query = supabase
        .from('fuel_consumption')
        .select('*')
        .order('year', { ascending: false })
        .order('month', { ascending: false });

      // Apply filters
      if (filters.year) {
        query = query.eq('year', filters.year);
      }
      
      if (filters.month) {
        query = query.eq('month', filters.month);
      }

      if (filters.rig) {
        query = query.eq('rig', filters.rig);
      }

      if (filters.minCost !== undefined) {
        query = query.gte('fuel_cost', filters.minCost);
      }

      if (filters.maxCost !== undefined) {
        query = query.lte('fuel_cost', filters.maxCost);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Calculate analytics
      const records = data as FuelRecord[];
      
      const totalCost = records.reduce((sum, r) => sum + (r.fuel_cost || 0), 0);
      const totalConsumed = records.reduce((sum, r) => sum + (r.total_consumed || 0), 0);
      const totalReceived = records.reduce((sum, r) => sum + (r.total_received || 0), 0);
      const uniqueRigs = [...new Set(records.map(r => r.rig))];
      const avgCostPerRig = uniqueRigs.length > 0 ? totalCost / uniqueRigs.length : 0;

      // Top 5 consumers by total consumed
      const consumedByRig = records.reduce((acc, r) => {
        const rig = r.rig || 'Unknown';
        acc[rig] = (acc[rig] || 0) + (r.total_consumed || 0);
        return acc;
      }, {} as Record<string, number>);

      const topConsumers = Object.entries(consumedByRig)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, value]) => ({ name, value }));

      // Cost by Rig
      const costByRig = records.reduce((acc, r) => {
        const rig = r.rig || 'Unknown';
        acc[rig] = (acc[rig] || 0) + (r.fuel_cost || 0);
        return acc;
      }, {} as Record<string, number>);

      const rigBreakdown = Object.entries(costByRig)
        .sort((a, b) => b[1] - a[1])
        .map(([name, value]) => ({ name, value }));

      // Monthly trend
      const monthlyData = records.reduce((acc, r) => {
        const monthKey = `${r.year}-${r.month}`;
        if (!acc[monthKey]) {
          acc[monthKey] = { month: monthKey, cost: 0, consumed: 0, received: 0 };
        }
        acc[monthKey].cost += r.fuel_cost || 0;
        acc[monthKey].consumed += r.total_consumed || 0;
        acc[monthKey].received += r.total_received || 0;
        return acc;
      }, {} as Record<string, { month: string; cost: number; consumed: number; received: number }>);

      const monthlyTrend = Object.values(monthlyData).sort((a, b) => 
        a.month.localeCompare(b.month)
      );

      // Yearly comparison
      const yearlyData = records.reduce((acc, r) => {
        const year = r.year;
        if (!acc[year]) {
          acc[year] = { year: year.toString(), cost: 0, consumed: 0, received: 0 };
        }
        acc[year].cost += r.fuel_cost || 0;
        acc[year].consumed += r.total_consumed || 0;
        acc[year].received += r.total_received || 0;
        return acc;
      }, {} as Record<number, { year: string; cost: number; consumed: number; received: number }>);

      const yearlyComparison = Object.values(yearlyData).sort((a, b) => 
        a.year.localeCompare(b.year)
      );

      return {
        records,
        totalCost,
        totalConsumed,
        totalReceived,
        avgCostPerRig,
        uniqueRigsCount: uniqueRigs.length,
        topConsumers,
        rigBreakdown,
        monthlyTrend,
        yearlyComparison,
      };
    },
  });
};

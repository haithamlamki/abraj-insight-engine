import { useMemo } from 'react';
import { useReportData } from './useReportData';
import { RevenueFilters } from './useRevenueFilters';

export interface RevenueRecord {
  id: string;
  year: number;
  month: string;
  rig: string;
  revenue_actual: number;
  revenue_budget: number;
  variance: number;
  dayrate_actual: number | null;
  dayrate_budget: number | null;
  working_days: number | null;
  fuel_charge: number | null;
  npt_repair: number | null;
  npt_zero: number | null;
  client: string | null;
  comments: string | null;
  created_at: string;
  updated_at: string;
}

export interface MonthlyTrend {
  month: string;
  year: number;
  actual: number;
  budget: number;
  variance: number;
  variancePct: number;
  count: number;
}

export interface RigPerformance {
  rig: string;
  variance: number;
  variancePct: number;
  totalActual: number;
  totalBudget: number;
  count: number;
  avgDayrate: number;
}

export interface TopMonth {
  month: string;
  year: number;
  revenue: number;
  variance: number;
  variancePct: number;
}

export interface NPTCorrelation {
  rig: string;
  nptTotal: number;
  variance: number;
  revenueActual: number;
}

export interface RevenueAnalytics {
  data: RevenueRecord[];
  monthlyTrend: MonthlyTrend[];
  topRigsByVariance: RigPerformance[];
  bottomRigsByVariance: RigPerformance[];
  topMonthsByRevenue: TopMonth[];
  nptCorrelation: NPTCorrelation[];
  totalActual: number;
  totalBudget: number;
  totalVariance: number;
  variancePct: number;
  avgMonthlyRevenue: number;
  avgDayrate: number;
  totalNPT: number;
  historicalTimeSeries: { date: Date; value: number; month: string; year: number }[];
  correlationCoefficient: number;
}

const MONTH_ORDER = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

function getMonthIndex(month: string): number {
  return MONTH_ORDER.findIndex(m => m.toLowerCase() === month.toLowerCase()) || 0;
}

function calculateCorrelation(x: number[], y: number[]): number {
  const n = x.length;
  if (n === 0) return 0;

  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
  const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
  const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0);

  const numerator = n * sumXY - sumX * sumY;
  const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

  return denominator === 0 ? 0 : numerator / denominator;
}

export function useRevenueAnalytics(filters: RevenueFilters) {
  const { data: rawData, isLoading, error } = useReportData('revenue');

  const analytics = useMemo((): RevenueAnalytics => {
    if (!rawData || rawData.length === 0) {
      return {
        data: [],
        monthlyTrend: [],
        topRigsByVariance: [],
        bottomRigsByVariance: [],
        topMonthsByRevenue: [],
        nptCorrelation: [],
        totalActual: 0,
        totalBudget: 0,
        totalVariance: 0,
        variancePct: 0,
        avgMonthlyRevenue: 0,
        avgDayrate: 0,
        totalNPT: 0,
        historicalTimeSeries: [],
        correlationCoefficient: 0,
      };
    }

    // Apply filters
    let filteredData = rawData as RevenueRecord[];

    if (filters.years.length > 0) {
      filteredData = filteredData.filter(row => filters.years.includes(row.year));
    }

    if (filters.months.length > 0) {
      filteredData = filteredData.filter(row => 
        filters.months.some(m => m.toLowerCase() === row.month.toLowerCase())
      );
    }

    if (filters.rigs.length > 0) {
      filteredData = filteredData.filter(row => filters.rigs.includes(row.rig));
    }

    if (filters.revenueRange.min !== null) {
      filteredData = filteredData.filter(row => row.revenue_actual >= filters.revenueRange.min!);
    }

    if (filters.revenueRange.max !== null) {
      filteredData = filteredData.filter(row => row.revenue_actual <= filters.revenueRange.max!);
    }

    // Apply variance type filter
    if (filters.varianceType !== 'all') {
      filteredData = filteredData.filter(row => {
        const variancePct = row.revenue_budget !== 0 
          ? ((row.variance / row.revenue_budget) * 100)
          : 0;

        switch (filters.varianceType) {
          case 'positive':
            return row.variance > 0;
          case 'negative':
            return row.variance < 0;
          case 'within5':
            return Math.abs(variancePct) <= 5;
          case 'within10':
            return Math.abs(variancePct) <= 10;
          default:
            return true;
        }
      });
    }

    // Calculate summary KPIs
    const totalActual = filteredData.reduce((sum, row) => sum + (row.revenue_actual || 0), 0);
    const totalBudget = filteredData.reduce((sum, row) => sum + (row.revenue_budget || 0), 0);
    const totalVariance = totalActual - totalBudget;
    const variancePct = totalBudget !== 0 ? (totalVariance / totalBudget) * 100 : 0;

    const dayrateData = filteredData.filter(row => row.dayrate_actual !== null);
    const avgDayrate = dayrateData.length > 0
      ? dayrateData.reduce((sum, row) => sum + (row.dayrate_actual || 0), 0) / dayrateData.length
      : 0;

    const totalNPT = filteredData.reduce(
      (sum, row) => sum + (row.npt_repair || 0) + (row.npt_zero || 0),
      0
    );

    // Monthly trend
    const monthlyMap = new Map<string, MonthlyTrend>();
    filteredData.forEach(row => {
      const key = `${row.year}-${row.month}`;
      if (!monthlyMap.has(key)) {
        monthlyMap.set(key, {
          month: row.month,
          year: row.year,
          actual: 0,
          budget: 0,
          variance: 0,
          variancePct: 0,
          count: 0,
        });
      }
      const trend = monthlyMap.get(key)!;
      trend.actual += row.revenue_actual || 0;
      trend.budget += row.revenue_budget || 0;
      trend.variance += row.variance || 0;
      trend.count += 1;
    });

    const monthlyTrend = Array.from(monthlyMap.values())
      .map(trend => ({
        ...trend,
        variancePct: trend.budget !== 0 ? (trend.variance / trend.budget) * 100 : 0,
      }))
      .sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year;
        return getMonthIndex(a.month) - getMonthIndex(b.month);
      });

    const avgMonthlyRevenue = monthlyTrend.length > 0
      ? monthlyTrend.reduce((sum, trend) => sum + trend.actual, 0) / monthlyTrend.length
      : 0;

    // Rig performance
    const rigMap = new Map<string, RigPerformance>();
    filteredData.forEach(row => {
      if (!rigMap.has(row.rig)) {
        rigMap.set(row.rig, {
          rig: row.rig,
          variance: 0,
          variancePct: 0,
          totalActual: 0,
          totalBudget: 0,
          count: 0,
          avgDayrate: 0,
        });
      }
      const perf = rigMap.get(row.rig)!;
      perf.totalActual += row.revenue_actual || 0;
      perf.totalBudget += row.revenue_budget || 0;
      perf.variance += row.variance || 0;
      perf.count += 1;
      perf.avgDayrate += row.dayrate_actual || 0;
    });

    const rigPerformance = Array.from(rigMap.values())
      .map(perf => ({
        ...perf,
        variancePct: perf.totalBudget !== 0 ? (perf.variance / perf.totalBudget) * 100 : 0,
        avgDayrate: perf.count > 0 ? perf.avgDayrate / perf.count : 0,
      }))
      .sort((a, b) => b.variance - a.variance);

    const topRigsByVariance = rigPerformance.slice(0, 10);
    const bottomRigsByVariance = [...rigPerformance].sort((a, b) => a.variance - b.variance).slice(0, 10);

    // Top months by revenue
    const topMonthsByRevenue = monthlyTrend
      .map(trend => ({
        month: trend.month,
        year: trend.year,
        revenue: trend.actual,
        variance: trend.variance,
        variancePct: trend.variancePct,
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    // NPT correlation
    const nptCorrelation = Array.from(rigMap.entries())
      .map(([rig, perf]) => {
        const rigData = filteredData.filter(row => row.rig === rig);
        const nptTotal = rigData.reduce(
          (sum, row) => sum + (row.npt_repair || 0) + (row.npt_zero || 0),
          0
        );
        return {
          rig,
          nptTotal,
          variance: perf.variance,
          revenueActual: perf.totalActual,
        };
      })
      .filter(item => item.nptTotal > 0);

    // Calculate correlation coefficient between NPT and variance
    const nptValues = nptCorrelation.map(item => item.nptTotal);
    const varianceValues = nptCorrelation.map(item => item.variance);
    const correlationCoefficient = calculateCorrelation(nptValues, varianceValues);

    // Historical time series for forecasting
    const historicalTimeSeries = monthlyTrend.map(trend => ({
      date: new Date(trend.year, getMonthIndex(trend.month)),
      value: trend.actual,
      month: trend.month,
      year: trend.year,
    }));

    return {
      data: filteredData,
      monthlyTrend,
      topRigsByVariance,
      bottomRigsByVariance,
      topMonthsByRevenue,
      nptCorrelation,
      totalActual,
      totalBudget,
      totalVariance,
      variancePct,
      avgMonthlyRevenue,
      avgDayrate,
      totalNPT,
      historicalTimeSeries,
      correlationCoefficient,
    };
  }, [rawData, filters]);

  return {
    ...analytics,
    isLoading,
    error,
  };
}

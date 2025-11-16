import { useMemo } from "react";

export interface UtilizationKPIs {
  avgUtilization: number;
  totalActiveRigs: number;
  totalStackedRigs: number;
  totalAllowableNPT: number;
  totalActualNPT: number;
  lowUtilizationCount: number;
  topClient: string | null;
  totalRecords: number;
}

export interface ClientDistribution {
  client: string;
  rigCount: number;
  avgUtilization: number;
  workingDays: number;
}

export interface RigPerformance {
  rig: string;
  client: string | null;
  avgUtilization: number;
  status: string;
  workingDays: number;
  lastMonth: string;
  lastYear: number;
}

export interface TimeSeriesData {
  period: string;
  avgUtilization: number;
  activeRigs: number;
  stackedRigs: number;
}

export interface HeatmapCell {
  rig: string;
  month: string;
  year: number;
  utilization: number | null;
  status: string;
  client: string | null;
}

export function useUtilizationAnalytics(data: any[]) {
  const kpis = useMemo((): UtilizationKPIs => {
    if (!data || data.length === 0) {
      return {
        avgUtilization: 0,
        totalActiveRigs: 0,
        totalStackedRigs: 0,
        totalAllowableNPT: 0,
        totalActualNPT: 0,
        lowUtilizationCount: 0,
        topClient: null,
        totalRecords: 0,
      };
    }

    const validRecords = data.filter(d => d.utilization_rate !== null && d.utilization_rate !== undefined);
    const avgUtilization = validRecords.length > 0 
      ? validRecords.reduce((sum, d) => sum + (d.utilization_rate || 0), 0) / validRecords.length 
      : 0;

    const uniqueRigs = new Set(data.map(d => d.rig));
    const activeRigs = new Set(data.filter(d => d.status === 'Active').map(d => d.rig));
    const stackedRigs = new Set(data.filter(d => d.status === 'Stacked').map(d => d.rig));

    const totalAllowableNPT = data.reduce((sum, d) => sum + (d.allowable_npt || 0), 0);
    
    const lowUtilizationCount = data.filter(d => 
      d.utilization_rate !== null && d.utilization_rate < 0.5 && d.status === 'Active'
    ).length;

    // Find top client by rig count
    const clientCounts = data.reduce((acc, d) => {
      if (d.client) {
        acc[d.client] = (acc[d.client] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    const topClient = Object.keys(clientCounts).length > 0
      ? Object.entries(clientCounts).sort((a, b) => (b[1] as number) - (a[1] as number))[0][0]
      : null;

    return {
      avgUtilization: Math.round(avgUtilization * 100 * 10) / 10,
      totalActiveRigs: activeRigs.size,
      totalStackedRigs: stackedRigs.size,
      totalAllowableNPT: Math.round(totalAllowableNPT),
      totalActualNPT: 0,
      lowUtilizationCount,
      topClient,
      totalRecords: data.length,
    };
  }, [data]);

  const clientDistribution = useMemo((): ClientDistribution[] => {
    if (!data || data.length === 0) return [];

    const clientMap = new Map<string, { rigs: Set<string>; totalUtilization: number; count: number; workingDays: number }>();

    data.forEach(record => {
      const client = record.client || 'Unknown';
      if (!clientMap.has(client)) {
        clientMap.set(client, { rigs: new Set(), totalUtilization: 0, count: 0, workingDays: 0 });
      }
      const clientData = clientMap.get(client)!;
      clientData.rigs.add(record.rig);
      if (record.utilization_rate !== null) {
        clientData.totalUtilization += record.utilization_rate;
        clientData.count++;
      }
      clientData.workingDays += record.working_days || 0;
    });

    return Array.from(clientMap.entries())
      .map(([client, data]) => ({
        client,
        rigCount: data.rigs.size,
        avgUtilization: data.count > 0 ? Math.round(data.totalUtilization / data.count * 100 * 10) / 10 : 0,
        workingDays: data.workingDays,
      }))
      .sort((a, b) => b.rigCount - a.rigCount);
  }, [data]);

  const rigPerformance = useMemo((): RigPerformance[] => {
    if (!data || data.length === 0) return [];

    const rigMap = new Map<string, { records: any[] }>();

    data.forEach(record => {
      if (!rigMap.has(record.rig)) {
        rigMap.set(record.rig, { records: [] });
      }
      rigMap.get(record.rig)!.records.push(record);
    });

    return Array.from(rigMap.entries())
      .map(([rig, { records }]) => {
        const validRecords = records.filter(r => r.utilization_rate !== null);
        const avgUtilization = validRecords.length > 0
          ? validRecords.reduce((sum, r) => sum + r.utilization_rate, 0) / validRecords.length
          : 0;

        const latestRecord = records.sort((a, b) => {
          const monthA = typeof a.month === 'string' && isNaN(Number(a.month)) ? 1 : Number(a.month);
          const monthB = typeof b.month === 'string' && isNaN(Number(b.month)) ? 1 : Number(b.month);
          const dateA = new Date(a.year, monthA - 1);
          const dateB = new Date(b.year, monthB - 1);
          return dateB.getTime() - dateA.getTime();
        })[0];

        return {
          rig,
          client: latestRecord.client || null,
          avgUtilization: Math.round(avgUtilization * 100 * 10) / 10,
          status: latestRecord.status || 'Active',
          workingDays: records.reduce((sum, r) => sum + (r.working_days || 0), 0),
          lastMonth: latestRecord.month || '',
          lastYear: latestRecord.year || new Date().getFullYear(),
        };
      })
      .sort((a, b) => b.avgUtilization - a.avgUtilization);
  }, [data]);

  const timeSeriesData = useMemo((): TimeSeriesData[] => {
    if (!data || data.length === 0) return [];

    const periodMap = new Map<string, { utilization: number[]; activeRigs: Set<string>; stackedRigs: Set<string> }>();

    data.forEach(record => {
      const period = `${record.year}-${String(record.month).padStart(2, '0')}`;
      if (!periodMap.has(period)) {
        periodMap.set(period, { utilization: [], activeRigs: new Set(), stackedRigs: new Set() });
      }
      const periodData = periodMap.get(period)!;
      if (record.utilization_rate !== null) {
        periodData.utilization.push(record.utilization_rate);
      }
      if (record.status === 'Active') {
        periodData.activeRigs.add(record.rig);
      } else if (record.status === 'Stacked') {
        periodData.stackedRigs.add(record.rig);
      }
    });

    return Array.from(periodMap.entries())
      .map(([period, data]) => ({
        period,
        avgUtilization: data.utilization.length > 0
          ? Math.round(data.utilization.reduce((sum, u) => sum + u, 0) / data.utilization.length * 100 * 10) / 10
          : 0,
        activeRigs: data.activeRigs.size,
        stackedRigs: data.stackedRigs.size,
      }))
      .sort((a, b) => a.period.localeCompare(b.period))
      .slice(-12); // Last 12 periods
  }, [data]);

  const heatmapData = useMemo((): HeatmapCell[] => {
    return data.map(record => ({
      rig: record.rig,
      month: `${record.year}-${String(record.month).padStart(2, '0')}`,
      year: record.year,
      utilization: record.utilization_rate !== null ? record.utilization_rate * 100 : null,
      status: record.status || 'Active',
      client: record.client,
    }));
  }, [data]);

  return {
    kpis,
    clientDistribution,
    rigPerformance,
    timeSeriesData,
    heatmapData,
  };
}

import { useMemo } from 'react';
import { NPTRecord } from './useNPTRootCauseData';
import { NPTFilters } from './useNPTFilters';

function getDurationBucket(hrs: number): string {
  if (hrs < 2) return '<2h';
  if (hrs < 6) return '2-6h';
  if (hrs < 12) return '6-12h';
  return '>12h';
}

export function useNPTAnalytics(data: NPTRecord[], filters: NPTFilters) {
  const filteredData = useMemo(() => {
    return data.filter(record => {
      if (filters.years.length > 0 && !filters.years.includes(record.year)) return false;
      if (filters.months.length > 0 && !filters.months.includes(record.month)) return false;
      if (filters.rigs.length > 0 && !filters.rigs.includes(record.rig_number)) return false;
      if (filters.nptTypes.length > 0 && !filters.nptTypes.includes(record.npt_type)) return false;
      if (filters.systems.length > 0 && !filters.systems.includes(record.system)) return false;
      if (filters.departments.length > 0 && record.department_responsibility && 
          !filters.departments.includes(record.department_responsibility)) return false;
      if (filters.rootCauses.length > 0 && record.root_cause && 
          !filters.rootCauses.includes(record.root_cause)) return false;
      if (filters.durationBucket && getDurationBucket(record.hrs) !== filters.durationBucket) return false;
      
      return true;
    });
  }, [data, filters]);

  const kpis = useMemo(() => {
    const totalHours = filteredData.reduce((sum, r) => sum + r.hrs, 0);
    const eventCount = filteredData.length;
    const avgHoursPerEvent = eventCount > 0 ? totalHours / eventCount : 0;

    // Get previous year data for comparison
    const currentYear = Math.max(...data.map(r => r.year));
    const currentYearData = data.filter(r => r.year === currentYear);
    const previousYearData = data.filter(r => r.year === currentYear - 1);
    
    const currentYearHours = currentYearData.reduce((sum, r) => sum + r.hrs, 0);
    const previousYearHours = previousYearData.reduce((sum, r) => sum + r.hrs, 0);
    const yoyChange = previousYearHours > 0 
      ? ((currentYearHours - previousYearHours) / previousYearHours) * 100 
      : 0;

    // Top system
    const systemHours = new Map<string, number>();
    filteredData.forEach(r => {
      systemHours.set(r.system, (systemHours.get(r.system) || 0) + r.hrs);
    });
    const topSystem = Array.from(systemHours.entries())
      .sort((a, b) => b[1] - a[1])[0];

    return {
      totalHours: Math.round(totalHours * 10) / 10,
      eventCount,
      avgHoursPerEvent: Math.round(avgHoursPerEvent * 10) / 10,
      yoyChange: Math.round(yoyChange * 10) / 10,
      topSystem: topSystem ? {
        name: topSystem[0],
        hours: Math.round(topSystem[1]),
        percentage: Math.round((topSystem[1] / totalHours) * 100)
      } : null
    };
  }, [filteredData, data]);

  // Monthly trend
  const monthlyTrend = useMemo(() => {
    const trendMap = new Map<string, Map<number, number>>();
    
    filteredData.forEach(record => {
      if (!trendMap.has(record.month)) {
        trendMap.set(record.month, new Map());
      }
      const monthMap = trendMap.get(record.month)!;
      monthMap.set(record.year, (monthMap.get(record.year) || 0) + record.hrs);
    });

    const monthOrder = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const years = Array.from(new Set(filteredData.map(r => r.year))).sort();

    return monthOrder.map(month => {
      const result: any = { month };
      years.forEach(year => {
        result[`year${year}`] = trendMap.get(month)?.get(year) || 0;
      });
      return result;
    });
  }, [filteredData]);

  // NPT by rig
  const rigRanking = useMemo(() => {
    const rigMap = new Map<string, { hours: number; events: number }>();
    
    filteredData.forEach(record => {
      const existing = rigMap.get(record.rig_number) || { hours: 0, events: 0 };
      existing.hours += record.hrs;
      existing.events += 1;
      rigMap.set(record.rig_number, existing);
    });

    return Array.from(rigMap.entries())
      .map(([rig, data]) => ({
        rig,
        hours: Math.round(data.hours * 10) / 10,
        events: data.events,
        avgHours: Math.round((data.hours / data.events) * 10) / 10
      }))
      .sort((a, b) => b.hours - a.hours);
  }, [filteredData]);

  // NPT type distribution
  const nptTypeDistribution = useMemo(() => {
    const typeMap = new Map<string, number>();
    
    filteredData.forEach(record => {
      typeMap.set(record.npt_type, (typeMap.get(record.npt_type) || 0) + record.hrs);
    });

    return Array.from(typeMap.entries())
      .map(([type, hours]) => ({
        type,
        hours: Math.round(hours * 10) / 10,
        percentage: Math.round((hours / kpis.totalHours) * 100)
      }))
      .sort((a, b) => b.hours - a.hours);
  }, [filteredData, kpis.totalHours]);

  // System breakdown
  const systemBreakdown = useMemo(() => {
    const systemMap = new Map<string, number>();
    
    filteredData.forEach(record => {
      systemMap.set(record.system, (systemMap.get(record.system) || 0) + record.hrs);
    });

    return Array.from(systemMap.entries())
      .map(([system, hours]) => ({
        system,
        hours: Math.round(hours * 10) / 10,
        percentage: Math.round((hours / kpis.totalHours) * 100)
      }))
      .sort((a, b) => b.hours - a.hours);
  }, [filteredData, kpis.totalHours]);

  // Root cause Pareto
  const rootCausePareto = useMemo(() => {
    const causeMap = new Map<string, number>();
    
    filteredData.forEach(record => {
      if (record.root_cause) {
        causeMap.set(record.root_cause, (causeMap.get(record.root_cause) || 0) + record.hrs);
      }
    });

    const sorted = Array.from(causeMap.entries())
      .map(([cause, hours]) => ({
        cause,
        hours: Math.round(hours * 10) / 10
      }))
      .sort((a, b) => b.hours - a.hours);

    let cumulative = 0;
    const totalHours = sorted.reduce((sum, item) => sum + item.hours, 0);

    return sorted.map(item => {
      cumulative += item.hours;
      return {
        ...item,
        cumulativePercentage: Math.round((cumulative / totalHours) * 100)
      };
    });
  }, [filteredData]);

  // Department breakdown
  const departmentBreakdown = useMemo(() => {
    const deptMap = new Map<string, { hours: number; events: number }>();
    
    filteredData.forEach(record => {
      if (record.department_responsibility) {
        const existing = deptMap.get(record.department_responsibility) || { hours: 0, events: 0 };
        existing.hours += record.hrs;
        existing.events += 1;
        deptMap.set(record.department_responsibility, existing);
      }
    });

    return Array.from(deptMap.entries())
      .map(([department, data]) => ({
        department,
        hours: Math.round(data.hours * 10) / 10,
        events: data.events
      }))
      .sort((a, b) => b.hours - a.hours);
  }, [filteredData]);

  // Action party workload
  const actionPartyWorkload = useMemo(() => {
    const partyMap = new Map<string, { hours: number; events: number }>();
    
    filteredData.forEach(record => {
      if (record.action_party) {
        const existing = partyMap.get(record.action_party) || { hours: 0, events: 0 };
        existing.hours += record.hrs;
        existing.events += 1;
        partyMap.set(record.action_party, existing);
      }
    });

    return Array.from(partyMap.entries())
      .map(([party, data]) => ({
        party,
        hours: Math.round(data.hours * 10) / 10,
        events: data.events
      }))
      .sort((a, b) => b.hours - a.hours);
  }, [filteredData]);

  // Duration distribution
  const durationDistribution = useMemo(() => {
    const buckets = { '<2h': 0, '2-6h': 0, '6-12h': 0, '>12h': 0 };
    
    filteredData.forEach(record => {
      const bucket = getDurationBucket(record.hrs);
      buckets[bucket as keyof typeof buckets]++;
    });

    return Object.entries(buckets).map(([bucket, count]) => ({
      bucket,
      count
    }));
  }, [filteredData]);

  // Heatmap data (rig vs month)
  const heatmapData = useMemo(() => {
    const heatmap: any[] = [];
    const rigSet = new Set(filteredData.map(r => r.rig_number));
    const monthOrder = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    rigSet.forEach(rig => {
      monthOrder.forEach(month => {
        const records = filteredData.filter(r => r.rig_number === rig && r.month === month);
        if (records.length > 0) {
          const totalHours = records.reduce((sum, r) => sum + r.hrs, 0);
          heatmap.push({
            rig,
            month,
            hours: Math.round(totalHours * 10) / 10,
            events: records.length
          });
        }
      });
    });

    return heatmap;
  }, [filteredData]);

  return {
    filteredData,
    kpis,
    monthlyTrend,
    rigRanking,
    nptTypeDistribution,
    systemBreakdown,
    rootCausePareto,
    departmentBreakdown,
    actionPartyWorkload,
    durationDistribution,
    heatmapData
  };
}

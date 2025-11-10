import { useMemo } from 'react';
import { BillingNPTFilters } from './useBillingNPTFilters';

interface BillingNPTRecord {
  year: number;
  month: string;
  rig: string;
  opr_rate: number;
  reduce_rate: number;
  repair_rate: number;
  zero_rate: number;
  special_rate: number;
  rig_move_reduce: number;
  rig_move: number;
  a_maint: number;
  a_maint_zero: number;
  total: number;
  total_npt: number;
}

export function useBillingNPTAnalytics(data: any[], filters: BillingNPTFilters) {
  const filteredData = useMemo(() => {
    if (!data || data.length === 0) return [];

    return data.filter((record: any) => {
      // Year filter
      if (filters.years.length > 0 && !filters.years.includes(record.year)) {
        return false;
      }

      // Month filter
      if (filters.months.length > 0 && !filters.months.includes(record.month)) {
        return false;
      }

      // Rig filter
      if (filters.rigs.length > 0 && !filters.rigs.includes(record.rig)) {
        return false;
      }

      // NPT range filter
      const totalNPT = record.total_npt || 0;
      if (totalNPT < filters.nptRange[0] || totalNPT > filters.nptRange[1]) {
        return false;
      }

      // Low efficiency quick filter (operational rate < 70%)
      if (filters.quickFilter === 'low-efficiency') {
        const oprRate = ((record.opr_rate || 0) / (record.total || 1)) * 100;
        if (oprRate >= 70) return false;
      }

      return true;
    });
  }, [data, filters]);

  // KPIs
  const kpis = useMemo(() => {
    if (filteredData.length === 0) {
      return {
        totalNPTHours: 0,
        nptPercentage: 0,
        avgOperationalRate: 0,
        reducedRatePercentage: 0,
        repairNPTPercentage: 0,
        zeroNPTPercentage: 0,
        totalRecords: 0,
        problemRigsCount: 0,
        avgNPTPerRig: 0,
        totalOperationalHours: 0,
        totalHours: 0,
        yoyNPTChange: 0
      };
    }

    const totalNPT = filteredData.reduce((sum, r) => sum + (r.total_npt || 0), 0);
    const totalOprHours = filteredData.reduce((sum, r) => sum + (r.opr_rate || 0), 0);
    const totalReduceHours = filteredData.reduce((sum, r) => sum + (r.reduce_rate || 0), 0);
    const totalRepairHours = filteredData.reduce((sum, r) => sum + (r.repair_rate || 0), 0);
    const totalZeroHours = filteredData.reduce((sum, r) => sum + (r.zero_rate || 0), 0);
    const totalHours = filteredData.reduce((sum, r) => sum + (r.total || 0), 0);
    
    const nptPercentage = totalHours > 0 ? (totalNPT / totalHours) * 100 : 0;
    const avgOperationalRate = totalHours > 0 ? (totalOprHours / totalHours) * 100 : 0;
    const reducedRatePercentage = totalHours > 0 ? (totalReduceHours / totalHours) * 100 : 0;
    const repairNPTPercentage = totalNPT > 0 ? (totalRepairHours / totalNPT) * 100 : 0;
    const zeroNPTPercentage = totalNPT > 0 ? (totalZeroHours / totalNPT) * 100 : 0;
    
    const rigNPT = new Map<string, number>();
    filteredData.forEach(r => {
      const current = rigNPT.get(r.rig) || 0;
      rigNPT.set(r.rig, current + (r.total_npt || 0));
    });
    
    const problemRigs = Array.from(rigNPT.entries()).filter(([, npt]) => npt > 500);

    // YoY calculation
    const currentYear = Math.max(...filteredData.map(r => r.year));
    const previousYear = currentYear - 1;
    
    const currentYearData = data.filter(r => r.year === currentYear);
    const previousYearData = data.filter(r => r.year === previousYear);
    
    const currentYearTotal = currentYearData.reduce((sum, r) => sum + (r.total || 0), 0);
    const currentYearNPT = currentYearData.reduce((sum, r) => sum + (r.total_npt || 0), 0);
    const previousYearTotal = previousYearData.reduce((sum, r) => sum + (r.total || 0), 0);
    const previousYearNPT = previousYearData.reduce((sum, r) => sum + (r.total_npt || 0), 0);
    
    const currentYearNPTPercent = currentYearTotal > 0 ? (currentYearNPT / currentYearTotal) * 100 : 0;
    const previousYearNPTPercent = previousYearTotal > 0 ? (previousYearNPT / previousYearTotal) * 100 : 0;
    const yoyNPTChange = currentYearNPTPercent - previousYearNPTPercent;

    return {
      totalNPTHours: Math.round(totalNPT),
      nptPercentage: Math.round(nptPercentage * 10) / 10,
      avgOperationalRate: Math.round(avgOperationalRate * 10) / 10,
      reducedRatePercentage: Math.round(reducedRatePercentage * 10) / 10,
      repairNPTPercentage: Math.round(repairNPTPercentage * 10) / 10,
      zeroNPTPercentage: Math.round(zeroNPTPercentage * 10) / 10,
      totalRecords: filteredData.length,
      problemRigsCount: problemRigs.length,
      avgNPTPerRig: rigNPT.size > 0 ? Math.round(totalNPT / rigNPT.size) : 0,
      totalOperationalHours: Math.round(totalOprHours),
      totalHours: Math.round(totalHours),
      yoyNPTChange: Math.round(yoyNPTChange * 10) / 10
    };
  }, [filteredData, data]);

  // Monthly trends
  const monthlyTrends = useMemo(() => {
    const trendsMap = new Map<string, {
      yearMonth: string;
      operationalRate: number;
      totalNPT: number;
      repairRate: number;
      zeroRate: number;
      reduceRate: number;
      specialRate: number;
      totalHours: number;
      oprHours: number;
    }>();

    filteredData.forEach(record => {
      const key = `${record.year}-${record.month}`;
      const existing = trendsMap.get(key) || {
        yearMonth: key,
        operationalRate: 0,
        totalNPT: 0,
        repairRate: 0,
        zeroRate: 0,
        reduceRate: 0,
        specialRate: 0,
        totalHours: 0,
        oprHours: 0
      };

      existing.totalNPT += record.total_npt || 0;
      existing.repairRate += record.repair_rate || 0;
      existing.zeroRate += record.zero_rate || 0;
      existing.reduceRate += record.reduce_rate || 0;
      existing.specialRate += record.special_rate || 0;
      existing.totalHours += record.total || 0;
      existing.oprHours += record.opr_rate || 0;

      trendsMap.set(key, existing);
    });

    return Array.from(trendsMap.values()).map(item => ({
      ...item,
      operationalRate: item.totalHours > 0 
        ? Math.round((item.oprHours / item.totalHours) * 1000) / 10 
        : 0
    })).sort((a, b) => {
      const [yearA, monthA] = a.yearMonth.split('-');
      const [yearB, monthB] = b.yearMonth.split('-');
      return yearA === yearB 
        ? monthA.localeCompare(monthB)
        : Number(yearA) - Number(yearB);
    });
  }, [filteredData]);

  // Rig performance
  const rigPerformance = useMemo(() => {
    const rigMap = new Map<string, {
      rig: string;
      totalNPT: number;
      operationalHours: number;
      totalHours: number;
      operationalRate: number;
      recordCount: number;
    }>();

    filteredData.forEach(record => {
      const existing = rigMap.get(record.rig) || {
        rig: record.rig,
        totalNPT: 0,
        operationalHours: 0,
        totalHours: 0,
        operationalRate: 0,
        recordCount: 0
      };

      existing.totalNPT += record.total_npt || 0;
      existing.operationalHours += record.opr_rate || 0;
      existing.totalHours += record.total || 0;
      existing.recordCount += 1;

      rigMap.set(record.rig, existing);
    });

    return Array.from(rigMap.values()).map(item => ({
      ...item,
      operationalRate: item.totalHours > 0 
        ? Math.round((item.operationalHours / item.totalHours) * 1000) / 10 
        : 0
    })).sort((a, b) => b.operationalRate - a.operationalRate);
  }, [filteredData]);

  // Category breakdown
  const categoryBreakdown = useMemo(() => {
    const totals = {
      repair: 0,
      zero: 0,
      reduce: 0,
      special: 0,
      rigMove: 0,
      aMaint: 0
    };

    filteredData.forEach(record => {
      totals.repair += record.repair_rate || 0;
      totals.zero += record.zero_rate || 0;
      totals.reduce += record.reduce_rate || 0;
      totals.special += record.special_rate || 0;
      totals.rigMove += (record.rig_move || 0) + (record.rig_move_reduce || 0);
      totals.aMaint += (record.a_maint || 0) + (record.a_maint_zero || 0);
    });

    const total = Object.values(totals).reduce((sum, val) => sum + val, 0);

    return [
      { category: 'Repair', value: Math.round(totals.repair), percentage: total > 0 ? Math.round((totals.repair / total) * 100) : 0 },
      { category: 'Zero', value: Math.round(totals.zero), percentage: total > 0 ? Math.round((totals.zero / total) * 100) : 0 },
      { category: 'Reduce', value: Math.round(totals.reduce), percentage: total > 0 ? Math.round((totals.reduce / total) * 100) : 0 },
      { category: 'Special', value: Math.round(totals.special), percentage: total > 0 ? Math.round((totals.special / total) * 100) : 0 },
      { category: 'Rig Move', value: Math.round(totals.rigMove), percentage: total > 0 ? Math.round((totals.rigMove / total) * 100) : 0 },
      { category: 'A.Maint', value: Math.round(totals.aMaint), percentage: total > 0 ? Math.round((totals.aMaint / total) * 100) : 0 }
    ].filter(item => item.value > 0);
  }, [filteredData]);

  // Top and bottom performers
  const topPerformers = useMemo(() => {
    return rigPerformance.slice(0, 5);
  }, [rigPerformance]);

  const bottomPerformers = useMemo(() => {
    return [...rigPerformance].sort((a, b) => a.operationalRate - b.operationalRate).slice(0, 5);
  }, [rigPerformance]);

  // Correlation data
  const correlationData = useMemo(() => {
    return filteredData.map(record => ({
      rig: record.rig,
      yearMonth: `${record.year}-${record.month}`,
      operationalRate: record.total > 0 
        ? Math.round((record.opr_rate / record.total) * 1000) / 10 
        : 0,
      totalNPT: record.total_npt || 0,
      totalHours: record.total || 0
    }));
  }, [filteredData]);

  // Hour breakdown for stacked charts
  const hourBreakdown = useMemo(() => {
    const breakdownMap = new Map<string, any>();

    filteredData.forEach(record => {
      const key = `${record.year}-${record.month}`;
      const existing = breakdownMap.get(key) || {
        yearMonth: key,
        year: record.year,
        month: record.month,
        oprRate: 0,
        reduceRate: 0,
        repairRate: 0,
        zeroRate: 0,
        specialRate: 0,
        rigMove: 0,
        aMaint: 0,
        total: 0
      };

      existing.oprRate += record.opr_rate || 0;
      existing.reduceRate += record.reduce_rate || 0;
      existing.repairRate += record.repair_rate || 0;
      existing.zeroRate += record.zero_rate || 0;
      existing.specialRate += record.special_rate || 0;
      existing.rigMove += (record.rig_move || 0) + (record.rig_move_reduce || 0);
      existing.aMaint += (record.a_maint || 0) + (record.a_maint_zero || 0);
      existing.total += record.total || 0;

      breakdownMap.set(key, existing);
    });

    return Array.from(breakdownMap.values()).sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      const monthOrder = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return monthOrder.indexOf(a.month) - monthOrder.indexOf(b.month);
    });
  }, [filteredData]);

  // Rig hour breakdown
  const rigHourBreakdown = useMemo(() => {
    const rigMap = new Map<string, any>();

    filteredData.forEach(record => {
      const existing = rigMap.get(record.rig) || {
        rig: record.rig,
        oprRate: 0,
        reduceRate: 0,
        repairRate: 0,
        zeroRate: 0,
        specialRate: 0,
        rigMove: 0,
        aMaint: 0,
        total: 0
      };

      existing.oprRate += record.opr_rate || 0;
      existing.reduceRate += record.reduce_rate || 0;
      existing.repairRate += record.repair_rate || 0;
      existing.zeroRate += record.zero_rate || 0;
      existing.specialRate += record.special_rate || 0;
      existing.rigMove += (record.rig_move || 0) + (record.rig_move_reduce || 0);
      existing.aMaint += (record.a_maint || 0) + (record.a_maint_zero || 0);
      existing.total += record.total || 0;

      rigMap.set(record.rig, existing);
    });

    return Array.from(rigMap.values()).sort((a, b) => a.rig.localeCompare(b.rig));
  }, [filteredData]);

  // Heatmap data (Rig vs Month)
  const heatmapData = useMemo(() => {
    const heatmap: any[] = [];
    const rigSet = new Set(filteredData.map(r => r.rig));
    const monthOrder = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    rigSet.forEach(rig => {
      monthOrder.forEach(month => {
        const records = filteredData.filter(r => r.rig === rig && r.month === month);
        if (records.length > 0) {
          const totalNPT = records.reduce((sum, r) => sum + (r.total_npt || 0), 0);
          const totalHours = records.reduce((sum, r) => sum + (r.total || 0), 0);
          const nptPercent = totalHours > 0 ? (totalNPT / totalHours) * 100 : 0;
          
          heatmap.push({
            rig,
            month,
            nptPercent: Math.round(nptPercent * 10) / 10,
            totalNPT: Math.round(totalNPT)
          });
        }
      });
    });

    return heatmap;
  }, [filteredData]);

  return {
    filteredData,
    kpis,
    monthlyTrends,
    rigPerformance,
    categoryBreakdown,
    topPerformers,
    bottomPerformers,
    correlationData,
    hourBreakdown,
    rigHourBreakdown,
    heatmapData
  };
}

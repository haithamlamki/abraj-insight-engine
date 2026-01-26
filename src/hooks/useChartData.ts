import { useMemo } from "react";
import { useReportData } from "./useReportData";
import { useCrossReportFilters } from "@/contexts/CrossReportFilterContext";

export interface ChartFilters {
  years?: number[];
  months?: string[];
  rigs?: string[];
  rig?: string;
  startDate?: string;
  endDate?: string;
  nptTypes?: string[];
  systems?: string[];
}

/**
 * Apply filters to data array
 */
function applyFilters(data: any[], filters: ChartFilters, reportType: string): any[] {
  let filtered = [...data];

  // Filter by years
  if (filters.years && filters.years.length > 0) {
    filtered = filtered.filter(row => filters.years!.includes(Number(row.year)));
  }

  // Filter by months
  if (filters.months && filters.months.length > 0) {
    filtered = filtered.filter(row => {
      const rowMonth = row.month || (row.date ? new Date(row.date).toLocaleString('default', { month: 'short' }) : null);
      return rowMonth && filters.months!.includes(rowMonth);
    });
  }

  // Filter by single rig
  if (filters.rig) {
    const rigField = reportType === 'npt_root_cause' ? 'rig_number' : 'rig';
    filtered = filtered.filter(row => row[rigField] === filters.rig);
  }

  // Filter by multiple rigs
  if (filters.rigs && filters.rigs.length > 0) {
    const rigField = reportType === 'npt_root_cause' ? 'rig_number' : 'rig';
    filtered = filtered.filter(row => filters.rigs!.includes(row[rigField]));
  }

  // Filter by date range
  if (filters.startDate || filters.endDate) {
    filtered = filtered.filter(row => {
      const rowDate = row.date ? new Date(row.date) :
                     (row.year && row.month) ? new Date(`${row.month} 1, ${row.year}`) : null;
      if (!rowDate) return true;

      if (filters.startDate && rowDate < new Date(filters.startDate)) return false;
      if (filters.endDate && rowDate > new Date(filters.endDate)) return false;
      return true;
    });
  }

  // Filter by NPT types (for npt_root_cause)
  if (filters.nptTypes && filters.nptTypes.length > 0) {
    filtered = filtered.filter(row => row.npt_type && filters.nptTypes!.includes(row.npt_type));
  }

  // Filter by systems (for npt_root_cause)
  if (filters.systems && filters.systems.length > 0) {
    filtered = filtered.filter(row => row.system && filters.systems!.includes(row.system));
  }

  return filtered;
}

/**
 * Hook to aggregate data for charts with filter support
 */
export function useChartData(reportType: string, localFilters?: ChartFilters) {
  const { data, isLoading, error } = useReportData(reportType);
  const { getRelevantFilters } = useCrossReportFilters();

  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];

    // Get global filters and merge with local filters
    const globalFilters = getRelevantFilters(reportType);
    const mergedFilters: ChartFilters = {
      ...globalFilters,
      ...localFilters,
    };

    // Apply filters to data
    const filteredData = applyFilters(data, mergedFilters, reportType);

    if (filteredData.length === 0) return [];

    switch (reportType) {
      case "revenue": {
        // Group by month
        const monthlyData = filteredData.reduce((acc: any, row: any) => {
          const key = `${row.month}-${row.year}`;
          if (!acc[key]) {
            acc[key] = {
              month: row.month,
              year: row.year,
              actual: 0,
              budget: 0,
              count: 0,
            };
          }
          acc[key].actual += Number(row.revenue_actual) || 0;
          acc[key].budget += Number(row.revenue_budget) || 0;
          acc[key].count += 1;
          return acc;
        }, {});

        return Object.values(monthlyData).sort((a: any, b: any) => {
          if (a.year !== b.year) return a.year - b.year;
          const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
          return months.indexOf(a.month) - months.indexOf(b.month);
        });
      }

      case "work_orders": {
        // Group by month
        const monthlyData = filteredData.reduce((acc: any, row: any) => {
          const key = `${row.month}-${row.year}`;
          if (!acc[key]) {
            acc[key] = {
              month: row.month,
              open: 0,
              closed: 0,
            };
          }
          acc[key].open += (Number(row.mech_open) || 0) + (Number(row.elec_open) || 0) + (Number(row.oper_open) || 0);
          acc[key].closed += (Number(row.mech_closed) || 0) + (Number(row.elec_closed) || 0) + (Number(row.oper_closed) || 0);
          return acc;
        }, {});

        return Object.values(monthlyData);
      }

      case "utilization": {
        // Group by month
        const monthlyData = filteredData.reduce((acc: any, row: any) => {
          const key = `${row.month}-${row.year}`;
          if (!acc[key]) {
            acc[key] = {
              month: row.month,
              utilization: 0,
              count: 0,
            };
          }
          acc[key].utilization += Number(row.utilization_rate) || 0;
          acc[key].count += 1;
          return acc;
        }, {});

        return Object.values(monthlyData).map((item: any) => ({
          month: item.month,
          utilization: item.count > 0 ? item.utilization / item.count : 0,
        }));
      }

      case "fuel_consumption": {
        // Group by month and year
        const monthlyData = filteredData.reduce((acc: any, row: any) => {
          const monthKey = `${row.month}-${row.year}`;
          if (!acc[monthKey]) {
            acc[monthKey] = {
              month: row.month,
              year: row.year,
              consumed: 0,
              cost: 0,
            };
          }
          acc[monthKey].consumed += Number(row.total_consumed) || 0;
          acc[monthKey].cost += Number(row.fuel_cost) || 0;
          return acc;
        }, {});

        return Object.values(monthlyData).sort((a: any, b: any) => {
          if (a.year !== b.year) return a.year - b.year;
          const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
          return months.indexOf(a.month) - months.indexOf(b.month);
        });
      }

      case "rig_moves": {
        // Group by month from move_date
        const monthlyData = filteredData.reduce((acc: any, row: any) => {
          const date = new Date(row.move_date);
          const monthKey = `${date.toLocaleString('default', { month: 'short' })}-${date.getFullYear()}`;
          if (!acc[monthKey]) {
            acc[monthKey] = {
              month: date.toLocaleString('default', { month: 'short' }),
              moves: 0,
              distance: 0,
              cost: 0,
            };
          }
          acc[monthKey].moves += 1;
          acc[monthKey].distance += Number(row.distance_km) || 0;
          acc[monthKey].cost += Number(row.actual_cost) || 0;
          return acc;
        }, {});

        return Object.values(monthlyData);
      }

      case "billing_npt": {
        // Group by month from date
        const monthlyData = filteredData.reduce((acc: any, row: any) => {
          const date = new Date(row.date);
          const monthKey = `${date.toLocaleString('default', { month: 'short' })}-${date.getFullYear()}`;
          if (!acc[monthKey]) {
            acc[monthKey] = {
              month: date.toLocaleString('default', { month: 'short' }),
              nptHours: 0,
              incidents: 0,
            };
          }
          acc[monthKey].nptHours += Number(row.npt_hours) || 0;
          acc[monthKey].incidents += 1;
          return acc;
        }, {});

        return Object.values(monthlyData);
      }

      case "customer_satisfaction": {
        // Group by month
        const monthlyData = filteredData.reduce((acc: any, row: any) => {
          const key = `${row.month}-${row.year}`;
          if (!acc[key]) {
            acc[key] = {
              month: row.month,
              score: 0,
              count: 0,
            };
          }
          acc[key].score += Number(row.satisfaction_score) || 0;
          acc[key].count += 1;
          return acc;
        }, {});

        return Object.values(monthlyData).map((item: any) => ({
          month: item.month,
          score: item.count > 0 ? item.score / item.count : 0,
        }));
      }

      case "npt_root_cause": {
        // Group by month and year for trend analysis
        const monthlyData = filteredData.reduce((acc: any, row: any) => {
          const key = `${row.month}-${row.year}`;
          if (!acc[key]) {
            acc[key] = {
              month: row.month,
              year: row.year,
              totalHours: 0,
              incidents: 0,
              bySystem: {} as Record<string, number>,
              byType: {} as Record<string, number>,
              byRig: {} as Record<string, number>,
            };
          }
          const hours = Number(row.hrs) || 0;
          acc[key].totalHours += hours;
          acc[key].incidents += 1;

          // Aggregate by system
          if (row.system) {
            acc[key].bySystem[row.system] = (acc[key].bySystem[row.system] || 0) + hours;
          }

          // Aggregate by NPT type
          if (row.npt_type) {
            acc[key].byType[row.npt_type] = (acc[key].byType[row.npt_type] || 0) + hours;
          }

          // Aggregate by rig
          if (row.rig_number) {
            acc[key].byRig[row.rig_number] = (acc[key].byRig[row.rig_number] || 0) + hours;
          }

          return acc;
        }, {});

        return Object.values(monthlyData).sort((a: any, b: any) => {
          if (a.year !== b.year) return a.year - b.year;
          const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
          return months.indexOf(a.month) - months.indexOf(b.month);
        });
      }

      default:
        return [];
    }
  }, [data, reportType, localFilters, getRelevantFilters]);

  // Also return filtered data count for statistics
  const filteredCount = useMemo(() => {
    if (!data) return 0;
    const globalFilters = getRelevantFilters(reportType);
    const mergedFilters = { ...globalFilters, ...localFilters };
    return applyFilters(data, mergedFilters, reportType).length;
  }, [data, reportType, localFilters, getRelevantFilters]);

  return { chartData, isLoading, error, filteredCount, totalCount: data?.length || 0 };
}

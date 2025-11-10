import { useMemo } from "react";
import { useReportData } from "./useReportData";

/**
 * Hook to aggregate data for charts
 */
export function useChartData(reportType: string) {
  const { data, isLoading, error } = useReportData(reportType);

  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];

    switch (reportType) {
      case "revenue": {
        // Group by month
        const monthlyData = data.reduce((acc: any, row: any) => {
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
        const monthlyData = data.reduce((acc: any, row: any) => {
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
        const monthlyData = data.reduce((acc: any, row: any) => {
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
        const monthlyData = data.reduce((acc: any, row: any) => {
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
        const monthlyData = data.reduce((acc: any, row: any) => {
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
        const monthlyData = data.reduce((acc: any, row: any) => {
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
        const monthlyData = data.reduce((acc: any, row: any) => {
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

      default:
        return [];
    }
  }, [data, reportType]);

  return { chartData, isLoading, error };
}

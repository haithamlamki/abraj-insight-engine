import { DataEntryLayout } from "@/components/Reports/DataEntryLayout";
import { DataTableWithDB } from "@/components/Reports/DataTableWithDB";
import { HistoricalTrendChart } from "@/components/Reports/HistoricalTrendChart";
import { KPICard } from "@/components/Dashboard/KPICard";
import { Target, Gauge, CheckCircle2 } from "lucide-react";
import { useKPIData } from "@/hooks/useKPIData";
import { useChartData } from "@/hooks/useChartData";

const WellTracker = () => {
  const { kpis, isLoading: kpisLoading } = useKPIData("well_tracker");
  const { chartData, isLoading: chartLoading } = useChartData("well_tracker");

  const tableColumns = [
    { key: "rig", label: "Rig", sortable: true },
    { key: "wellName", label: "Well", sortable: true },
    { key: "startDate", label: "Start Date", sortable: true },
    { key: "actualDepth", label: "Depth (m)", sortable: true },
    { key: "status", label: "Status", sortable: true },
    { key: "operator", label: "Operator", sortable: true },
  ];

  const trendData = [
    { month: "Oct", drilling: 5, completed: 2, suspended: 1 },
    { month: "Nov", drilling: 6, completed: 3, suspended: 0 },
    { month: "Dec", drilling: 4, completed: 4, suspended: 2 },
    { month: "Jan", drilling: 5, completed: 2, suspended: 1 },
    { month: "Feb", drilling: 6, completed: 3, suspended: 1 },
    { month: "Mar", drilling: 5, completed: 3, suspended: 1 },
  ];

  return (
    <DataEntryLayout
      title="Well Tracker"
      description="Monitor drilling progress and well completion status"
      reportType="well_tracker"
      breadcrumbs={[
        { label: "Dashboard", href: "/" },
        { label: "Rig Performance", href: "/rig-performance" },
        { label: "Well Tracker" }
      ]}
      viewContent={
        <div className="space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            <KPICard 
              title="Completed Wells" 
              value={kpisLoading ? "..." : kpis?.completedWells || 0}
              icon={CheckCircle2} 
            />
            <KPICard 
              title="Active Wells" 
              value={kpisLoading ? "..." : kpis?.activeWells || 0}
              icon={Target} 
            />
            <KPICard 
              title="Total Depth" 
              value={kpisLoading ? "..." : `${Number(kpis?.totalDepth || 0).toLocaleString()} m`}
              icon={Gauge} 
            />
          </div>

          <HistoricalTrendChart
            title="Well Status Distribution"
            description="Drilling, completed, and suspended wells over time"
            data={trendData}
            dataKeys={[
              { key: "drilling", label: "Active Drilling", color: "hsl(var(--chart-1))" },
              { key: "completed", label: "Completed", color: "hsl(var(--chart-2))" },
              { key: "suspended", label: "Suspended", color: "hsl(var(--chart-3))" }
            ]}
            xAxisKey="month"
          />

          <DataTableWithDB 
            columns={tableColumns} 
            reportType="well_tracker"
            formatRow={(row) => ({
              ...row,
              wellName: row.well_name,
              startDate: new Date(row.start_date).toLocaleDateString(),
              actualDepth: row.actual_depth.toLocaleString()
            })}
          />
        </div>
      }
    />
  );
};

export default WellTracker;

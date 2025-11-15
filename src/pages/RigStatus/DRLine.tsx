import { DataEntryLayout } from "@/components/Reports/DataEntryLayout";
import { DataTableWithDB } from "@/components/Reports/DataTableWithDB";
import { HistoricalTrendChart } from "@/components/Reports/HistoricalTrendChart";
import { KPICard } from "@/components/Dashboard/KPICard";
import { Activity, CheckCircle2, AlertCircle } from "lucide-react";

const DRLine = () => {
  const tableColumns = [
    { key: "date", label: "Date", sortable: true },
    { key: "rigNumber", label: "Rig", sortable: true },
    { key: "status", label: "Status", sortable: true },
    { key: "uptime", label: "Uptime %", sortable: true },
    { key: "notes", label: "Notes", sortable: false },
  ];

  const trendData = [
    { month: "Oct", operational: 22, down: 3 },
    { month: "Nov", operational: 23, down: 2 },
    { month: "Dec", operational: 21, down: 4 },
    { month: "Jan", operational: 24, down: 1 },
    { month: "Feb", operational: 22, down: 3 },
    { month: "Mar", operational: 23, down: 2 },
  ];

  return (
    <DataEntryLayout
      title="DR Line Status"
      description="Daily rig line operational status tracking"
      breadcrumbs={[
        { label: "Dashboard", href: "/" },
        { label: "Rig Status", href: "/rig-status" },
        { label: "DR Line" }
      ]}
      viewContent={
        <div className="space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            <KPICard title="Operational" value="23/25" change={0} trend="neutral" icon={CheckCircle2} />
            <KPICard title="Down" value="2" change={-33} trend="up" icon={AlertCircle} />
            <KPICard title="Fleet Uptime" value="92%" change={3.2} trend="up" icon={Activity} />
          </div>

          <HistoricalTrendChart
            title="Rig Status Trend"
            description="Operational vs down rigs over time"
            data={trendData}
            dataKeys={[
              { key: "operational", label: "Operational", color: "hsl(var(--success))" },
              { key: "down", label: "Down", color: "hsl(var(--destructive))" }
            ]}
            xAxisKey="month"
          />

          <DataTableWithDB 
            columns={tableColumns} 
            reportType="stock"
            formatRow={(row) => ({
              ...row,
              date: new Date(row.last_reorder_date || row.created_at).toLocaleDateString(),
              rigNumber: row.rig,
              uptime: '-',
              notes: '-'
            })}
          />
        </div>
      }
    />
  );
};

export default DRLine;

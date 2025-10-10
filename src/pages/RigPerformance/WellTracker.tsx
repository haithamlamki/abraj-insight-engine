import { DataEntryLayout } from "@/components/Reports/DataEntryLayout";
import { DataEntryForm } from "@/components/Reports/DataEntryForm";
import { ExcelUploadZone } from "@/components/Reports/ExcelUploadZone";
import { DataTable } from "@/components/Reports/DataTable";
import { HistoricalTrendChart } from "@/components/Reports/HistoricalTrendChart";
import { KPICard } from "@/components/Dashboard/KPICard";
import { Target, Gauge, CheckCircle2 } from "lucide-react";

const WellTracker = () => {
  const formFields = [
    { name: "date", label: "Date", type: "date" as const, required: true },
    { name: "wellName", label: "Well Name", type: "text" as const, required: true },
    { name: "rigNumber", label: "Rig Number", type: "text" as const, required: true },
    { name: "depth", label: "Depth (m)", type: "number" as const, required: true },
    { name: "status", label: "Status", type: "select" as const, options: ["Drilling", "Completed", "Suspended"], required: true },
  ];

  const tableColumns = [
    { key: "wellName", label: "Well", sortable: true },
    { key: "rigNumber", label: "Rig", sortable: true },
    { key: "depth", label: "Depth", sortable: true },
    { key: "progress", label: "Progress", sortable: true },
    { key: "status", label: "Status", sortable: true },
  ];

  const sampleData = [
    { wellName: "Well-A-45", rigNumber: "Rig-101", depth: "3,240 m", progress: "85%", status: "Drilling" },
    { wellName: "Well-B-12", rigNumber: "Rig-102", depth: "2,890 m", progress: "100%", status: "Completed" },
    { wellName: "Well-C-78", rigNumber: "Rig-205", depth: "1,560 m", progress: "45%", status: "Drilling" },
  ];

  const trendData = [
    { month: "Oct", completed: 12, active: 8 },
    { month: "Nov", completed: 11, active: 9 },
    { month: "Dec", completed: 13, active: 7 },
    { month: "Jan", completed: 14, active: 8 },
    { month: "Feb", completed: 12, active: 9 },
    { month: "Mar", completed: 14, active: 10 },
  ];

  return (
    <DataEntryLayout
      title="Well Tracker"
      description="Monitor drilling progress and well completion status"
      breadcrumbs={[
        { label: "Dashboard", href: "/" },
        { label: "Rig Performance", href: "/rig-performance" },
        { label: "Well Tracker" }
      ]}
      viewContent={
        <div className="space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            <KPICard title="Completed Wells" value="14" change={8} trend="up" icon={CheckCircle2} />
            <KPICard title="Active Wells" value="10" change={11.1} trend="up" icon={Target} />
            <KPICard title="Avg Depth" value="2,850 m" change={5.2} trend="up" icon={Gauge} />
          </div>

          <HistoricalTrendChart
            title="Well Completion Trend"
            description="Completed vs active wells over time"
            data={trendData}
            dataKeys={[
              { key: "completed", label: "Completed Wells", color: "hsl(var(--success))" },
              { key: "active", label: "Active Wells", color: "hsl(var(--primary))" }
            ]}
            xAxisKey="month"
          />

          <DataTable columns={tableColumns} data={sampleData} />
        </div>
      }
      entryContent={
        <DataEntryForm
          title="Enter Well Data"
          fields={formFields}
          frequency="daily"
        />
      }
      uploadContent={
        <ExcelUploadZone
          title="Upload Well Tracker Report"
          templateName="well_tracker_template.xlsx"
        />
      }
    />
  );
};

export default WellTracker;

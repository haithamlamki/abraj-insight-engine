import { DataEntryLayout } from "@/components/Reports/DataEntryLayout";
import { DataEntryForm } from "@/components/Reports/DataEntryForm";
import { ExcelUploadZone } from "@/components/Reports/ExcelUploadZone";
import { DataTable } from "@/components/Reports/DataTable";
import { HistoricalTrendChart } from "@/components/Reports/HistoricalTrendChart";
import { KPICard } from "@/components/Dashboard/KPICard";
import { Target, Gauge, CheckCircle2 } from "lucide-react";

const WellTracker = () => {
  const formFields = [
    { name: "rig", label: "Rig", type: "text" as const, required: true },
    { name: "wellName", label: "Well Name", type: "text" as const, required: true },
    { name: "startDate", label: "Start Date", type: "date" as const, required: true },
    { name: "endDate", label: "End Date", type: "date" as const },
    { name: "targetDepth", label: "Target Depth (m)", type: "number" as const, required: true },
    { name: "actualDepth", label: "Actual Depth (m)", type: "number" as const, required: true },
    { name: "status", label: "Status", type: "select" as const, options: ["Drilling", "Completed", "Suspended", "P&A"], required: true },
    { name: "operator", label: "Operator", type: "text" as const, required: true },
    { name: "location", label: "Location", type: "text" as const },
  ];

  const tableColumns = [
    { key: "rig", label: "Rig", sortable: true },
    { key: "wellName", label: "Well", sortable: true },
    { key: "startDate", label: "Start Date", sortable: true },
    { key: "actualDepth", label: "Depth (m)", sortable: true },
    { key: "status", label: "Status", sortable: true },
    { key: "operator", label: "Operator", sortable: true },
  ];

  const sampleData = [
    { rig: "ADC-225", wellName: "BHD-2024-001", startDate: "2024-01-05", actualDepth: "3,245", status: "Drilling", operator: "ADNOC" },
    { rig: "ADC-226", wellName: "RWS-2024-012", startDate: "2023-12-28", actualDepth: "4,120", status: "Completed", operator: "ADNOC" },
    { rig: "ADC-227", wellName: "HAB-2024-003", startDate: "2024-01-15", actualDepth: "2,890", status: "Drilling", operator: "ADNOC" },
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
          reportType="well_tracker"
        />
      }
    />
  );
};

export default WellTracker;

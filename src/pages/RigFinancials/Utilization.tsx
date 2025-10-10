import { DataEntryLayout } from "@/components/Reports/DataEntryLayout";
import { DataEntryForm } from "@/components/Reports/DataEntryForm";
import { ExcelUploadZone } from "@/components/Reports/ExcelUploadZone";
import { DataTable } from "@/components/Reports/DataTable";
import { HistoricalTrendChart } from "@/components/Reports/HistoricalTrendChart";
import { KPICard } from "@/components/Dashboard/KPICard";
import { Percent, TrendingUp, Calendar } from "lucide-react";

const Utilization = () => {
  const formFields = [
    { name: "date", label: "Report Date", type: "date" as const, required: true },
    { name: "rigNumber", label: "Rig Number", type: "text" as const, required: true, placeholder: "e.g., Rig-101" },
    { name: "activeHours", label: "Active Hours", type: "number" as const, required: true },
    { name: "totalHours", label: "Total Available Hours", type: "number" as const, required: true },
    { name: "utilizationRate", label: "Utilization Rate (%)", type: "number" as const, required: true },
  ];

  const tableColumns = [
    { key: "date", label: "Date", sortable: true },
    { key: "rigNumber", label: "Rig", sortable: true },
    { key: "activeHours", label: "Active Hours", sortable: true },
    { key: "totalHours", label: "Total Hours", sortable: true },
    { key: "utilizationRate", label: "Utilization %", sortable: true },
  ];

  const sampleData = [
    { date: "2024-03-01", rigNumber: "Rig-101", activeHours: 21, totalHours: 24, utilizationRate: "87.5%" },
    { date: "2024-03-01", rigNumber: "Rig-102", activeHours: 22, totalHours: 24, utilizationRate: "91.7%" },
    { date: "2024-03-01", rigNumber: "Rig-103", activeHours: 19, totalHours: 24, utilizationRate: "79.2%" },
  ];

  const trendData = [
    { month: "Oct", utilization: 82 },
    { month: "Nov", utilization: 85 },
    { month: "Dec", utilization: 83 },
    { month: "Jan", utilization: 86 },
    { month: "Feb", utilization: 84 },
    { month: "Mar", utilization: 87.5 },
  ];

  return (
    <DataEntryLayout
      title="Rig Utilization"
      description="Track and analyze rig utilization rates across all operations"
      breadcrumbs={[
        { label: "Dashboard", href: "/" },
        { label: "Rig Financials", href: "/rig-financials" },
        { label: "Utilization" }
      ]}
      viewContent={
        <div className="space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            <KPICard title="Current Utilization" value="87.5%" change={2.3} trend="up" icon={Percent} />
            <KPICard title="Monthly Average" value="85.2%" change={1.5} trend="up" icon={TrendingUp} />
            <KPICard title="Active Days" value="28/31" change={0} trend="neutral" icon={Calendar} />
          </div>

          <HistoricalTrendChart
            title="6-Month Utilization Trend"
            description="Historical utilization rates over the past 6 months"
            data={trendData}
            dataKeys={[{ key: "utilization", label: "Utilization %", color: "hsl(var(--primary))" }]}
            xAxisKey="month"
          />

          <DataTable columns={tableColumns} data={sampleData} />
        </div>
      }
      entryContent={
        <DataEntryForm
          title="Enter Utilization Data"
          fields={formFields}
          frequency="daily"
        />
      }
      uploadContent={
        <ExcelUploadZone
          title="Upload Utilization Report"
          templateName="utilization_template.xlsx"
        />
      }
    />
  );
};

export default Utilization;

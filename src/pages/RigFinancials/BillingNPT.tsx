import { DataEntryLayout } from "@/components/Reports/DataEntryLayout";
import { DataEntryForm } from "@/components/Reports/DataEntryForm";
import { ExcelUploadZone } from "@/components/Reports/ExcelUploadZone";
import { DataTable } from "@/components/Reports/DataTable";
import { HistoricalTrendChart } from "@/components/Reports/HistoricalTrendChart";
import { KPICard } from "@/components/Dashboard/KPICard";
import { Clock, AlertTriangle, TrendingDown } from "lucide-react";

const BillingNPT = () => {
  const formFields = [
    { name: "date", label: "Date", type: "date" as const, required: true },
    { name: "rigNumber", label: "Rig Number", type: "text" as const, required: true },
    { name: "nptHours", label: "NPT Hours", type: "number" as const, required: true },
    { name: "category", label: "NPT Category", type: "select" as const, options: ["Equipment Failure", "Weather", "Maintenance", "Other"], required: true },
    { name: "cost", label: "Cost Impact ($)", type: "number" as const, required: true },
  ];

  const tableColumns = [
    { key: "date", label: "Date", sortable: true },
    { key: "rigNumber", label: "Rig", sortable: true },
    { key: "nptHours", label: "NPT Hours", sortable: true },
    { key: "category", label: "Category", sortable: true },
    { key: "cost", label: "Cost Impact", sortable: true },
  ];

  const sampleData = [
    { date: "2024-03-15", rigNumber: "Rig-301", nptHours: 8.5, category: "Equipment Failure", cost: "$12,500" },
    { date: "2024-03-14", rigNumber: "Rig-102", nptHours: 4.0, category: "Weather", cost: "$5,800" },
    { date: "2024-03-13", rigNumber: "Rig-205", nptHours: 12.0, category: "Maintenance", cost: "$18,000" },
  ];

  const trendData = [
    { month: "Oct", actual: 298, allowable: 274 },
    { month: "Nov", actual: 312, allowable: 274 },
    { month: "Dec", actual: 287, allowable: 274 },
    { month: "Jan", actual: 322, allowable: 274 },
    { month: "Feb", actual: 344, allowable: 274 },
    { month: "Mar", actual: 289, allowable: 274 },
  ];

  return (
    <DataEntryLayout
      title="Billing NPT"
      description="Non-productive time tracking and billing analysis"
      breadcrumbs={[
        { label: "Dashboard", href: "/" },
        { label: "Rig Financials", href: "/rig-financials" },
        { label: "Billing NPT" }
      ]}
      viewContent={
        <div className="space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            <KPICard title="Total NPT" value="344 hrs" change={25.4} trend="down" icon={Clock} />
            <KPICard title="Allowable NPT" value="274 hrs" change={0} trend="neutral" icon={AlertTriangle} />
            <KPICard title="NPT Cost Impact" value="$1.2M" change={-15.3} trend="up" icon={TrendingDown} />
          </div>

          <HistoricalTrendChart
            title="NPT Trend: Actual vs Allowable"
            description="Monthly non-productive time hours comparison"
            data={trendData}
            dataKeys={[
              { key: "actual", label: "Actual NPT", color: "hsl(var(--destructive))" },
              { key: "allowable", label: "Allowable NPT", color: "hsl(var(--chart-2))" }
            ]}
            xAxisKey="month"
          />

          <DataTable columns={tableColumns} data={sampleData} />
        </div>
      }
      entryContent={
        <DataEntryForm
          title="Enter NPT Data"
          fields={formFields}
          frequency="daily"
        />
      }
      uploadContent={
        <ExcelUploadZone
          title="Upload NPT Report"
          templateName="npt_template.xlsx"
        />
      }
    />
  );
};

export default BillingNPT;

import { DataEntryLayout } from "@/components/Reports/DataEntryLayout";
import { DataEntryForm } from "@/components/Reports/DataEntryForm";
import { ExcelUploadZone } from "@/components/Reports/ExcelUploadZone";
import { DataTable } from "@/components/Reports/DataTable";
import { HistoricalTrendChart } from "@/components/Reports/HistoricalTrendChart";
import { KPICard } from "@/components/Dashboard/KPICard";
import { DollarSign, TrendingUp, PieChart } from "lucide-react";

const Revenue = () => {
  const formFields = [
    { name: "date", label: "Date", type: "date" as const, required: true },
    { name: "rigNumber", label: "Rig Number", type: "text" as const, required: true },
    { name: "dailyRate", label: "Daily Rate ($)", type: "number" as const, required: true },
    { name: "billedHours", label: "Billed Hours", type: "number" as const, required: true },
    { name: "totalRevenue", label: "Total Revenue ($)", type: "number" as const, required: true },
  ];

  const tableColumns = [
    { key: "date", label: "Date", sortable: true },
    { key: "rigNumber", label: "Rig", sortable: true },
    { key: "dailyRate", label: "Daily Rate", sortable: true },
    { key: "billedHours", label: "Billed Hours", sortable: true },
    { key: "totalRevenue", label: "Revenue", sortable: true },
  ];

  const sampleData = [
    { date: "2024-03-15", rigNumber: "Rig-101", dailyRate: "$45,000", billedHours: 24, totalRevenue: "$45,000" },
    { date: "2024-03-15", rigNumber: "Rig-102", dailyRate: "$48,000", billedHours: 22, totalRevenue: "$44,000" },
    { date: "2024-03-15", rigNumber: "Rig-103", dailyRate: "$42,000", billedHours: 24, totalRevenue: "$42,000" },
  ];

  const trendData = [
    { month: "Oct", revenue: 1.72 },
    { month: "Nov", revenue: 1.68 },
    { month: "Dec", revenue: 1.78 },
    { month: "Jan", revenue: 1.82 },
    { month: "Feb", revenue: 1.75 },
    { month: "Mar", revenue: 1.85 },
  ];

  return (
    <DataEntryLayout
      title="Revenue Analysis"
      description="Detailed revenue tracking and breakdown by rig"
      breadcrumbs={[
        { label: "Dashboard", href: "/" },
        { label: "Rig Financials", href: "/rig-financials" },
        { label: "Revenue" }
      ]}
      viewContent={
        <div className="space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            <KPICard title="Monthly Revenue" value="$1.85M" change={8.7} trend="up" icon={DollarSign} />
            <KPICard title="Average Daily Rate" value="$45,000" change={3.2} trend="up" icon={TrendingUp} />
            <KPICard title="Revenue per Rig" value="$74K" change={5.5} trend="up" icon={PieChart} />
          </div>

          <HistoricalTrendChart
            title="Monthly Revenue Trend"
            description="Revenue performance over the past 6 months"
            data={trendData}
            dataKeys={[{ key: "revenue", label: "Revenue ($M)", color: "hsl(var(--primary))" }]}
            xAxisKey="month"
          />

          <DataTable columns={tableColumns} data={sampleData} />
        </div>
      }
      entryContent={
        <DataEntryForm
          title="Enter Revenue Data"
          fields={formFields}
          frequency="daily"
        />
      }
      uploadContent={
        <ExcelUploadZone
          title="Upload Revenue Report"
          templateName="revenue_template.xlsx"
        />
      }
    />
  );
};

export default Revenue;

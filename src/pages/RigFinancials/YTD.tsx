import { DataEntryLayout } from "@/components/Reports/DataEntryLayout";
import { DataEntryForm } from "@/components/Reports/DataEntryForm";
import { ExcelUploadZone } from "@/components/Reports/ExcelUploadZone";
import { DataTable } from "@/components/Reports/DataTable";
import { HistoricalTrendChart } from "@/components/Reports/HistoricalTrendChart";
import { KPICard } from "@/components/Dashboard/KPICard";
import { DollarSign, TrendingUp, Target } from "lucide-react";

const YTD = () => {
  const formFields = [
    { name: "month", label: "Month", type: "select" as const, options: ["January", "February", "March"], required: true },
    { name: "revenue", label: "Revenue ($)", type: "number" as const, required: true },
    { name: "costs", label: "Costs ($)", type: "number" as const, required: true },
    { name: "profit", label: "Profit ($)", type: "number" as const, required: true },
  ];

  const tableColumns = [
    { key: "month", label: "Month", sortable: true },
    { key: "revenue", label: "Revenue", sortable: true },
    { key: "costs", label: "Costs", sortable: true },
    { key: "profit", label: "Profit", sortable: true },
    { key: "margin", label: "Margin %", sortable: true },
  ];

  const sampleData = [
    { month: "January", revenue: "$4.2M", costs: "$3.1M", profit: "$1.1M", margin: "26.2%" },
    { month: "February", revenue: "$4.5M", costs: "$3.3M", profit: "$1.2M", margin: "26.7%" },
    { month: "March", revenue: "$3.8M", costs: "$2.8M", profit: "$1.0M", margin: "26.3%" },
  ];

  const trendData = [
    { month: "Jan", revenue: 4.2, target: 4.0 },
    { month: "Feb", revenue: 4.5, target: 4.2 },
    { month: "Mar", revenue: 3.8, target: 4.1 },
  ];

  return (
    <DataEntryLayout
      title="YTD Analysis"
      description="Year-to-date financial performance tracking and analysis"
      breadcrumbs={[
        { label: "Dashboard", href: "/" },
        { label: "Rig Financials", href: "/rig-financials" },
        { label: "YTD" }
      ]}
      viewContent={
        <div className="space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            <KPICard title="YTD Revenue" value="$12.5M" change={15.2} trend="up" icon={DollarSign} />
            <KPICard title="YTD Profit" value="$3.3M" change={18.5} trend="up" icon={TrendingUp} />
            <KPICard title="Profit Margin" value="26.4%" change={2.1} trend="up" icon={Target} />
          </div>

          <HistoricalTrendChart
            title="Revenue vs Target"
            description="Monthly revenue performance against targets"
            data={trendData}
            dataKeys={[
              { key: "revenue", label: "Actual Revenue ($M)", color: "hsl(var(--primary))" },
              { key: "target", label: "Target ($M)", color: "hsl(var(--chart-2))" }
            ]}
            xAxisKey="month"
          />

          <DataTable columns={tableColumns} data={sampleData} />
        </div>
      }
      entryContent={
        <DataEntryForm
          title="Enter YTD Data"
          fields={formFields}
          frequency="monthly"
        />
      }
      uploadContent={
        <ExcelUploadZone
          title="Upload YTD Report"
          templateName="ytd_template.xlsx"
        />
      }
    />
  );
};

export default YTD;

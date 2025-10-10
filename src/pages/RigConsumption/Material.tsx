import { DataEntryLayout } from "@/components/Reports/DataEntryLayout";
import { DataEntryForm } from "@/components/Reports/DataEntryForm";
import { ExcelUploadZone } from "@/components/Reports/ExcelUploadZone";
import { DataTable } from "@/components/Reports/DataTable";
import { HistoricalTrendChart } from "@/components/Reports/HistoricalTrendChart";
import { KPICard } from "@/components/Dashboard/KPICard";
import { Package, DollarSign, TrendingUp } from "lucide-react";

const Material = () => {
  const formFields = [
    { name: "date", label: "Date", type: "date" as const, required: true },
    { name: "rigNumber", label: "Rig Number", type: "text" as const, required: true },
    { name: "materialType", label: "Material Type", type: "select" as const, options: ["Drilling Mud", "Cement", "Pipes", "Other"], required: true },
    { name: "quantity", label: "Quantity", type: "number" as const, required: true },
    { name: "cost", label: "Cost ($)", type: "number" as const, required: true },
  ];

  const tableColumns = [
    { key: "date", label: "Date", sortable: true },
    { key: "rigNumber", label: "Rig", sortable: true },
    { key: "materialType", label: "Material", sortable: true },
    { key: "quantity", label: "Quantity", sortable: true },
    { key: "cost", label: "Cost", sortable: true },
  ];

  const sampleData = [
    { date: "2024-03-15", rigNumber: "Rig-101", materialType: "Drilling Mud", quantity: "250 bbls", cost: "$15,000" },
    { date: "2024-03-15", rigNumber: "Rig-102", materialType: "Cement", quantity: "180 sacks", cost: "$8,500" },
    { date: "2024-03-14", rigNumber: "Rig-103", materialType: "Pipes", quantity: "12 units", cost: "$42,000" },
  ];

  const trendData = [
    { month: "Oct", cost: 265 },
    { month: "Nov", cost: 278 },
    { month: "Dec", cost: 272 },
    { month: "Jan", cost: 289 },
    { month: "Feb", cost: 271 },
    { month: "Mar", cost: 285 },
  ];

  return (
    <DataEntryLayout
      title="Material Tracking"
      description="Track material usage and costs across operations"
      breadcrumbs={[
        { label: "Dashboard", href: "/" },
        { label: "Rig Consumption", href: "/rig-consumption" },
        { label: "Material" }
      ]}
      viewContent={
        <div className="space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            <KPICard title="Total Cost" value="$285K" change={5.1} trend="down" icon={DollarSign} />
            <KPICard title="Material Orders" value="147" change={12.3} trend="up" icon={Package} />
            <KPICard title="Avg Cost/Rig" value="$11.4K" change={3.8} trend="down" icon={TrendingUp} />
          </div>

          <HistoricalTrendChart
            title="Monthly Material Costs"
            description="Material expenditure over the past 6 months"
            data={trendData}
            dataKeys={[{ key: "cost", label: "Cost ($000)", color: "hsl(var(--chart-4))" }]}
            xAxisKey="month"
          />

          <DataTable columns={tableColumns} data={sampleData} />
        </div>
      }
      entryContent={
        <DataEntryForm
          title="Enter Material Data"
          fields={formFields}
          frequency="daily"
        />
      }
      uploadContent={
        <ExcelUploadZone
          title="Upload Material Report"
          templateName="material_template.xlsx"
          reportType="material"
        />
      }
    />
  );
};

export default Material;

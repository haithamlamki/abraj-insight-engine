import { DataEntryLayout } from "@/components/Reports/DataEntryLayout";
import { DataEntryForm } from "@/components/Reports/DataEntryForm";
import { ExcelUploadZone } from "@/components/Reports/ExcelUploadZone";
import { DataTable } from "@/components/Reports/DataTable";
import { HistoricalTrendChart } from "@/components/Reports/HistoricalTrendChart";
import { KPICard } from "@/components/Dashboard/KPICard";
import { Package2, AlertTriangle, TrendingUp } from "lucide-react";

const Stock = () => {
  const formFields = [
    { name: "date", label: "Date", type: "date" as const, required: true },
    { name: "itemName", label: "Item Name", type: "text" as const, required: true },
    { name: "category", label: "Category", type: "select" as const, options: ["Drilling", "Safety", "Maintenance", "Other"], required: true },
    { name: "currentStock", label: "Current Stock", type: "number" as const, required: true },
    { name: "minStock", label: "Min Stock Level", type: "number" as const, required: true },
  ];

  const tableColumns = [
    { key: "itemName", label: "Item", sortable: true },
    { key: "category", label: "Category", sortable: true },
    { key: "currentStock", label: "Current", sortable: true },
    { key: "minStock", label: "Min Level", sortable: true },
    { key: "status", label: "Status", sortable: true },
  ];

  const sampleData = [
    { itemName: "Drill Bits", category: "Drilling", currentStock: "45", minStock: "20", status: "OK" },
    { itemName: "Safety Harnesses", category: "Safety", currentStock: "12", minStock: "15", status: "Low" },
    { itemName: "Hydraulic Oil", category: "Maintenance", currentStock: "850 L", minStock: "500 L", status: "OK" },
  ];

  const trendData = [
    { month: "Oct", level: 88 },
    { month: "Nov", level: 90 },
    { month: "Dec", level: 85 },
    { month: "Jan", level: 91 },
    { month: "Feb", level: 87 },
    { month: "Mar", level: 92 },
  ];

  return (
    <DataEntryLayout
      title="Stock Levels"
      description="Monitor inventory and manage stock across all locations"
      breadcrumbs={[
        { label: "Dashboard", href: "/" },
        { label: "Rig Status", href: "/rig-status" },
        { label: "Stock" }
      ]}
      viewContent={
        <div className="space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            <KPICard title="Stock Level" value="92%" change={5} trend="up" icon={Package2} />
            <KPICard title="Low Stock Items" value="8" change={-20} trend="up" icon={AlertTriangle} />
            <KPICard title="Total Items" value="156" change={3.3} trend="up" icon={TrendingUp} />
          </div>

          <HistoricalTrendChart
            title="Stock Level Trend"
            description="Overall inventory levels over time"
            data={trendData}
            dataKeys={[{ key: "level", label: "Stock Level %", color: "hsl(var(--chart-3))" }]}
            xAxisKey="month"
          />

          <DataTable columns={tableColumns} data={sampleData} />
        </div>
      }
      entryContent={
        <DataEntryForm
          title="Enter Stock Data"
          fields={formFields}
          frequency="daily"
        />
      }
      uploadContent={
        <ExcelUploadZone
          title="Upload Stock Report"
          templateName="stock_template.xlsx"
        />
      }
    />
  );
};

export default Stock;

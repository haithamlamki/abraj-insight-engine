import { DataEntryLayout } from "@/components/Reports/DataEntryLayout";
import { DataEntryForm } from "@/components/Reports/DataEntryForm";
import { ExcelUploadZone } from "@/components/Reports/ExcelUploadZone";
import { DataTable } from "@/components/Reports/DataTable";
import { HistoricalTrendChart } from "@/components/Reports/HistoricalTrendChart";
import { KPICard } from "@/components/Dashboard/KPICard";
import { Fuel as FuelIcon, TrendingDown, Gauge } from "lucide-react";

const Fuel = () => {
  const formFields = [
    { name: "date", label: "Date", type: "date" as const, required: true },
    { name: "rigNumber", label: "Rig Number", type: "text" as const, required: true },
    { name: "fuelConsumed", label: "Fuel Consumed (L)", type: "number" as const, required: true },
    { name: "operatingHours", label: "Operating Hours", type: "number" as const, required: true },
    { name: "efficiency", label: "L/Hour", type: "number" as const, required: true },
  ];

  const tableColumns = [
    { key: "date", label: "Date", sortable: true },
    { key: "rigNumber", label: "Rig", sortable: true },
    { key: "fuelConsumed", label: "Fuel (L)", sortable: true },
    { key: "operatingHours", label: "Hours", sortable: true },
    { key: "efficiency", label: "Efficiency", sortable: true },
  ];

  const sampleData = [
    { date: "2024-03-15", rigNumber: "Rig-101", fuelConsumed: "1,850 L", operatingHours: 22, efficiency: "84 L/hr" },
    { date: "2024-03-15", rigNumber: "Rig-102", fuelConsumed: "1,920 L", operatingHours: 24, efficiency: "80 L/hr" },
    { date: "2024-03-15", rigNumber: "Rig-103", fuelConsumed: "1,680 L", operatingHours: 20, efficiency: "84 L/hr" },
  ];

  const trendData = [
    { month: "Oct", consumption: 46.8 },
    { month: "Nov", consumption: 45.2 },
    { month: "Dec", consumption: 47.1 },
    { month: "Jan", consumption: 44.9 },
    { month: "Feb", consumption: 46.3 },
    { month: "Mar", consumption: 45.2 },
  ];

  return (
    <DataEntryLayout
      title="Fuel Consumption"
      description="Monitor and optimize fuel usage across all rigs"
      breadcrumbs={[
        { label: "Dashboard", href: "/" },
        { label: "Rig Consumption", href: "/rig-consumption" },
        { label: "Fuel" }
      ]}
      viewContent={
        <div className="space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            <KPICard title="Total Consumption" value="45,230 L" change={-3.2} trend="up" icon={FuelIcon} />
            <KPICard title="Avg Efficiency" value="82 L/hr" change={-2.1} trend="up" icon={Gauge} />
            <KPICard title="Cost Savings" value="$8,500" change={15.2} trend="up" icon={TrendingDown} />
          </div>

          <HistoricalTrendChart
            title="Monthly Fuel Consumption"
            description="Fuel usage trends over the past 6 months"
            data={trendData}
            dataKeys={[{ key: "consumption", label: "Consumption (000L)", color: "hsl(var(--chart-3))" }]}
            xAxisKey="month"
          />

          <DataTable columns={tableColumns} data={sampleData} />
        </div>
      }
      entryContent={
        <DataEntryForm
          title="Enter Fuel Data"
          fields={formFields}
          frequency="daily"
        />
      }
      uploadContent={
        <ExcelUploadZone
          title="Upload Fuel Report"
          templateName="fuel_template.xlsx"
        />
      }
    />
  );
};

export default Fuel;

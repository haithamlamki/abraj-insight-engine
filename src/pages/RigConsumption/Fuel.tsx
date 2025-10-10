import { DataEntryLayout } from "@/components/Reports/DataEntryLayout";
import { DataEntryForm } from "@/components/Reports/DataEntryForm";
import { ExcelUploadZone } from "@/components/Reports/ExcelUploadZone";
import { DataTableWithDB } from "@/components/Reports/DataTableWithDB";
import { HistoricalTrendChart } from "@/components/Reports/HistoricalTrendChart";
import { KPICard } from "@/components/Dashboard/KPICard";
import { Fuel as FuelIcon, TrendingDown, Gauge } from "lucide-react";
import { useKPIData } from "@/hooks/useKPIData";
import { useChartData } from "@/hooks/useChartData";

const Fuel = () => {
  const { kpis, isLoading: kpisLoading } = useKPIData("fuel_consumption");
  const { chartData, isLoading: chartLoading } = useChartData("fuel_consumption");

  const formFields = [
    { name: "rig", label: "Rig", type: "text" as const, required: true },
    { name: "date", label: "Date", type: "date" as const, required: true },
    { name: "fuelType", label: "Fuel Type", type: "select" as const, options: ["Diesel", "Gas", "Biodiesel"], required: true },
    { name: "quantity", label: "Quantity (L)", type: "number" as const, required: true },
    { name: "cost", label: "Cost ($)", type: "number" as const, required: true },
    { name: "supplier", label: "Supplier", type: "text" as const },
    { name: "hoursOperated", label: "Hours Operated", type: "number" as const },
    { name: "efficiency", label: "Efficiency (L/hr)", type: "number" as const },
  ];

  const tableColumns = [
    { key: "rig", label: "Rig", sortable: true },
    { key: "date", label: "Date", sortable: true },
    { key: "fuelType", label: "Type", sortable: true },
    { key: "quantity", label: "Quantity (L)", sortable: true },
    { key: "cost", label: "Cost", sortable: true },
    { key: "efficiency", label: "Efficiency", sortable: true },
  ];

  const sampleData = [
    { rig: "ADC-225", date: "2024-01-15", fuelType: "Diesel", quantity: "12,500", cost: "$15,000", efficiency: "520 L/hr" },
    { rig: "ADC-226", date: "2024-01-16", fuelType: "Diesel", quantity: "11,800", cost: "$14,160", efficiency: "492 L/hr" },
    { rig: "ADC-227", date: "2024-01-17", fuelType: "Diesel", quantity: "13,200", cost: "$15,840", efficiency: "550 L/hr" },
  ];

  const trendData = [
    { month: "Oct", consumption: 375, cost: 450, efficiency: 505 },
    { month: "Nov", consumption: 385, cost: 462, efficiency: 520 },
    { month: "Dec", consumption: 352, cost: 422, efficiency: 492 },
    { month: "Jan", consumption: 398, cost: 478, efficiency: 550 },
    { month: "Feb", consumption: 380, cost: 456, efficiency: 515 },
    { month: "Mar", consumption: 365, cost: 438, efficiency: 495 },
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
            <KPICard 
              title="Total Consumption" 
              value={kpisLoading ? "..." : `${Number(kpis?.totalFuel || 0).toLocaleString()} L`}
              icon={FuelIcon} 
            />
            <KPICard 
              title="Total Cost" 
              value={kpisLoading ? "..." : `$${Number(kpis?.totalCost || 0).toLocaleString()}`}
              icon={TrendingDown} 
            />
            <KPICard 
              title="Avg Price/L" 
              value={kpisLoading ? "..." : `$${kpis?.avgPrice || 0}`}
              icon={Gauge} 
            />
          </div>

          <HistoricalTrendChart
            title="Fuel Consumption Analysis"
            description="Consumption and cost metrics over time"
            data={chartLoading ? [] : chartData}
            dataKeys={[
              { key: "consumed", label: "Fuel Consumed (L)", color: "hsl(var(--chart-1))" },
              { key: "cost", label: "Cost ($)", color: "hsl(var(--chart-2))" }
            ]}
            xAxisKey="month"
          />

          <DataTableWithDB 
            columns={tableColumns} 
            reportType="fuel"
            formatRow={(row) => ({
              ...row,
              date: new Date(row.date).toLocaleDateString(),
              fuelType: row.fuel_type,
              quantity: row.fuel_consumed?.toLocaleString(),
              cost: `$${row.total_cost?.toLocaleString()}`,
              efficiency: '-'
            })}
          />
        </div>
      }
      entryContent={
        <DataEntryForm
          title="Enter Fuel Data"
          fields={formFields}
          frequency="daily"
          reportType="fuel"
        />
      }
      uploadContent={
        <ExcelUploadZone
          title="Upload Fuel Report"
          templateName="fuel_template.xlsx"
          reportType="fuel"
        />
      }
    />
  );
};

export default Fuel;

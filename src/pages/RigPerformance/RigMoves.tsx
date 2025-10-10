import { DataEntryLayout } from "@/components/Reports/DataEntryLayout";
import { DataEntryForm } from "@/components/Reports/DataEntryForm";
import { ExcelUploadZone } from "@/components/Reports/ExcelUploadZone";
import { DataTableWithDB } from "@/components/Reports/DataTableWithDB";
import { HistoricalTrendChart } from "@/components/Reports/HistoricalTrendChart";
import { KPICard } from "@/components/Dashboard/KPICard";
import { Truck, DollarSign, MapPin } from "lucide-react";
import { useKPIData } from "@/hooks/useKPIData";
import { useChartData } from "@/hooks/useChartData";

const RigMoves = () => {
  const { kpis, isLoading: kpisLoading } = useKPIData("rig_moves");
  const { chartData, isLoading: chartLoading } = useChartData("rig_moves");

  const formFields = [
    { name: "rig", label: "Rig", type: "text" as const, required: true },
    { name: "date", label: "Date", type: "date" as const, required: true },
    { name: "fromLocation", label: "From Location", type: "text" as const, required: true },
    { name: "toLocation", label: "To Location", type: "text" as const, required: true },
    { name: "distance", label: "Distance (km)", type: "number" as const, required: true },
    { name: "budgetedTime", label: "Budgeted Time (hrs)", type: "number" as const, required: true },
    { name: "actualTime", label: "Actual Time (hrs)", type: "number" as const, required: true },
    { name: "budgetedCost", label: "Budgeted Cost ($)", type: "number" as const, required: true },
    { name: "actualCost", label: "Actual Cost ($)", type: "number" as const, required: true },
    { name: "profitLoss", label: "Profit/Loss ($)", type: "number" as const },
  ];

  const tableColumns = [
    { key: "rig", label: "Rig", sortable: true },
    { key: "date", label: "Date", sortable: true },
    { key: "fromLocation", label: "From", sortable: true },
    { key: "toLocation", label: "To", sortable: true },
    { key: "distance", label: "Distance", sortable: true },
    { key: "actualTime", label: "Time (hrs)", sortable: true },
    { key: "profitLoss", label: "Profit/Loss", sortable: true },
  ];

  const sampleData = [
    { rig: "ADC-225", date: "2024-01-10", fromLocation: "Al Dhafra", toLocation: "Ruwais", distance: "45", actualTime: "12.5", profitLoss: "+$15,000" },
    { rig: "ADC-226", date: "2024-01-25", fromLocation: "Habshan", toLocation: "Bu Hasa", distance: "68", actualTime: "18.2", profitLoss: "-$8,500" },
    { rig: "ADC-227", date: "2024-02-08", fromLocation: "Asab", toLocation: "Shah", distance: "32", actualTime: "10.8", profitLoss: "+$22,000" },
  ];

  const trendData = [
    { month: "Oct", moves: 3, budgetedCost: 420, actualCost: 435, profit: 25 },
    { month: "Nov", moves: 3, budgetedCost: 450, actualCost: 465, profit: 28 },
    { month: "Dec", moves: 2, budgetedCost: 320, actualCost: 305, profit: 45 },
    { month: "Jan", moves: 4, budgetedCost: 560, actualCost: 575, profit: 18 },
    { month: "Feb", moves: 4, budgetedCost: 580, actualCost: 595, profit: 15 },
    { month: "Mar", moves: 3, budgetedCost: 470, actualCost: 455, profit: 35 },
  ];

  return (
    <DataEntryLayout
      title="Rig Moves"
      description="Track rig relocations and associated logistics"
      breadcrumbs={[
        { label: "Dashboard", href: "/" },
        { label: "Rig Performance", href: "/rig-performance" },
        { label: "Rig Moves" }
      ]}
      viewContent={
        <div className="space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            <KPICard 
              title="Total Moves" 
              value={kpisLoading ? "..." : kpis?.totalMoves || 0}
              icon={Truck} 
            />
            <KPICard 
              title="Total Distance" 
              value={kpisLoading ? "..." : `${Number(kpis?.totalDistance || 0).toLocaleString()} km`}
              icon={MapPin} 
            />
            <KPICard 
              title="Total Cost" 
              value={kpisLoading ? "..." : `$${Number(kpis?.totalCost || 0).toLocaleString()}`}
              icon={DollarSign} 
            />
          </div>

          <HistoricalTrendChart
            title="Rig Move Cost Analysis"
            description="Monthly moves, distance, and costs"
            data={chartLoading ? [] : chartData}
            dataKeys={[
              { key: "moves", label: "Number of Moves", color: "hsl(var(--chart-1))" },
              { key: "distance", label: "Total Distance (km)", color: "hsl(var(--chart-2))" },
              { key: "cost", label: "Total Cost ($)", color: "hsl(var(--chart-3))" }
            ]}
            xAxisKey="month"
          />

          <DataTableWithDB 
            columns={tableColumns} 
            reportType="rig_moves"
            formatRow={(row) => ({
              ...row,
              date: new Date(row.move_date).toLocaleDateString(),
              fromLocation: row.from_location,
              toLocation: row.to_location,
              distance: `${row.distance_km} km`,
              actualTime: row.actual_time_hours,
              profitLoss: row.profit_loss > 0 ? `+$${row.profit_loss.toLocaleString()}` : `-$${Math.abs(row.profit_loss).toLocaleString()}`
            })}
          />
        </div>
      }
      entryContent={
        <DataEntryForm
          title="Enter Rig Move Data"
          fields={formFields}
          frequency="daily"
          reportType="rig_moves"
        />
      }
      uploadContent={
        <ExcelUploadZone
          title="Upload Rig Move Report"
          templateName="rig_moves_template.xlsx"
          reportType="rig_moves"
        />
      }
    />
  );
};

export default RigMoves;

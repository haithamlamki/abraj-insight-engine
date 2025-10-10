import { DataEntryLayout } from "@/components/Reports/DataEntryLayout";
import { DataEntryForm } from "@/components/Reports/DataEntryForm";
import { ExcelUploadZone } from "@/components/Reports/ExcelUploadZone";
import { DataTable } from "@/components/Reports/DataTable";
import { HistoricalTrendChart } from "@/components/Reports/HistoricalTrendChart";
import { KPICard } from "@/components/Dashboard/KPICard";
import { Truck, DollarSign, MapPin } from "lucide-react";

const RigMoves = () => {
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
            <KPICard title="Total Moves" value="20" change={15} trend="up" icon={Truck} />
            <KPICard title="Total Cost" value="$813K" change={138} trend="up" icon={DollarSign} />
            <KPICard title="Avg Distance" value="135 km" change={8.2} trend="neutral" icon={MapPin} />
          </div>

          <HistoricalTrendChart
            title="Rig Move Cost Analysis"
            description="Budgeted vs actual costs and profitability"
            data={trendData}
            dataKeys={[
              { key: "budgetedCost", label: "Budgeted Cost ($K)", color: "hsl(var(--chart-2))" },
              { key: "actualCost", label: "Actual Cost ($K)", color: "hsl(var(--primary))" },
              { key: "profit", label: "Profit Margin ($K)", color: "hsl(var(--chart-3))" }
            ]}
            xAxisKey="month"
          />

          <DataTable columns={tableColumns} data={sampleData} />
        </div>
      }
      entryContent={
        <DataEntryForm
          title="Enter Rig Move Data"
          fields={formFields}
          frequency="daily"
        />
      }
      uploadContent={
        <ExcelUploadZone
          title="Upload Rig Move Report"
          templateName="rig_moves_template.xlsx"
        />
      }
    />
  );
};

export default RigMoves;

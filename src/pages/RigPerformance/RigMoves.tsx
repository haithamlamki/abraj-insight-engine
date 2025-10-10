import { DataEntryLayout } from "@/components/Reports/DataEntryLayout";
import { DataEntryForm } from "@/components/Reports/DataEntryForm";
import { ExcelUploadZone } from "@/components/Reports/ExcelUploadZone";
import { DataTable } from "@/components/Reports/DataTable";
import { HistoricalTrendChart } from "@/components/Reports/HistoricalTrendChart";
import { KPICard } from "@/components/Dashboard/KPICard";
import { Truck, DollarSign, MapPin } from "lucide-react";

const RigMoves = () => {
  const formFields = [
    { name: "date", label: "Move Date", type: "date" as const, required: true },
    { name: "rigNumber", label: "Rig Number", type: "text" as const, required: true },
    { name: "fromLocation", label: "From Location", type: "text" as const, required: true },
    { name: "toLocation", label: "To Location", type: "text" as const, required: true },
    { name: "distance", label: "Distance (km)", type: "number" as const, required: true },
    { name: "cost", label: "Cost ($)", type: "number" as const, required: true },
  ];

  const tableColumns = [
    { key: "date", label: "Date", sortable: true },
    { key: "rigNumber", label: "Rig", sortable: true },
    { key: "route", label: "Route", sortable: false },
    { key: "distance", label: "Distance", sortable: true },
    { key: "cost", label: "Cost", sortable: true },
  ];

  const sampleData = [
    { date: "2024-03-15", rigNumber: "Rig-204", route: "Site A → Site B", distance: "176 km", cost: "$52,000" },
    { date: "2024-03-12", rigNumber: "Rig-101", route: "Site C → Site D", distance: "142 km", cost: "$45,000" },
    { date: "2024-03-10", rigNumber: "Rig-305", route: "Site E → Site F", distance: "98 km", cost: "$32,000" },
  ];

  const trendData = [
    { month: "Oct", moves: 18, cost: 38 },
    { month: "Nov", moves: 22, cost: 42 },
    { month: "Dec", moves: 16, cost: 35 },
    { month: "Jan", moves: 19, cost: 39 },
    { month: "Feb", moves: 20, cost: 41 },
    { month: "Mar", moves: 23, cost: 45 },
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
            title="Rig Moves & Cost Trend"
            description="Number of moves and associated costs over time"
            data={trendData}
            dataKeys={[
              { key: "moves", label: "Number of Moves", color: "hsl(var(--primary))" },
              { key: "cost", label: "Cost ($000)", color: "hsl(var(--chart-2))" }
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

import { DataEntryLayout } from "@/components/Reports/DataEntryLayout";
import { DataEntryForm } from "@/components/Reports/DataEntryForm";
import { ExcelUploadZone } from "@/components/Reports/ExcelUploadZone";
import { DataTable } from "@/components/Reports/DataTable";
import { HistoricalTrendChart } from "@/components/Reports/HistoricalTrendChart";
import { KPICard } from "@/components/Dashboard/KPICard";
import { Wrench, DollarSign, Clock } from "lucide-react";

const Maintenance = () => {
  const formFields = [
    { name: "date", label: "Date", type: "date" as const, required: true },
    { name: "rigNumber", label: "Rig Number", type: "text" as const, required: true },
    { name: "maintenanceType", label: "Type", type: "select" as const, options: ["Preventive", "Corrective", "Emergency"], required: true },
    { name: "downtime", label: "Downtime (hrs)", type: "number" as const, required: true },
    { name: "cost", label: "Cost ($)", type: "number" as const, required: true },
  ];

  const tableColumns = [
    { key: "date", label: "Date", sortable: true },
    { key: "rigNumber", label: "Rig", sortable: true },
    { key: "maintenanceType", label: "Type", sortable: true },
    { key: "downtime", label: "Downtime", sortable: true },
    { key: "cost", label: "Cost", sortable: true },
  ];

  const sampleData = [
    { date: "2024-03-15", rigNumber: "Rig-101", maintenanceType: "Preventive", downtime: "4 hrs", cost: "$8,500" },
    { date: "2024-03-14", rigNumber: "Rig-205", maintenanceType: "Emergency", downtime: "12 hrs", cost: "$28,000" },
    { date: "2024-03-13", rigNumber: "Rig-102", maintenanceType: "Corrective", downtime: "6 hrs", cost: "$12,500" },
  ];

  const trendData = [
    { month: "Oct", cost: 115 },
    { month: "Nov", cost: 108 },
    { month: "Dec", cost: 122 },
    { month: "Jan", cost: 118 },
    { month: "Feb", cost: 113 },
    { month: "Mar", cost: 127 },
  ];

  return (
    <DataEntryLayout
      title="Repair & Maintenance"
      description="Track maintenance activities and associated costs"
      breadcrumbs={[
        { label: "Dashboard", href: "/" },
        { label: "Rig Consumption", href: "/rig-consumption" },
        { label: "Maintenance" }
      ]}
      viewContent={
        <div className="space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            <KPICard title="Total Cost" value="$127K" change={12.3} trend="down" icon={DollarSign} />
            <KPICard title="Maintenance Events" value="38" change={8.5} trend="neutral" icon={Wrench} />
            <KPICard title="Avg Downtime" value="5.2 hrs" change={-15.2} trend="up" icon={Clock} />
          </div>

          <HistoricalTrendChart
            title="Monthly Maintenance Costs"
            description="Repair and maintenance expenditure trends"
            data={trendData}
            dataKeys={[{ key: "cost", label: "Cost ($000)", color: "hsl(var(--chart-5))" }]}
            xAxisKey="month"
          />

          <DataTable columns={tableColumns} data={sampleData} />
        </div>
      }
      entryContent={
        <DataEntryForm
          title="Enter Maintenance Data"
          fields={formFields}
          frequency="daily"
        />
      }
      uploadContent={
        <ExcelUploadZone
          title="Upload Maintenance Report"
          templateName="maintenance_template.xlsx"
          reportType="maintenance"
        />
      }
    />
  );
};

export default Maintenance;

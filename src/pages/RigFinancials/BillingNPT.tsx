import { DataEntryLayout } from "@/components/Reports/DataEntryLayout";
import { DataEntryForm } from "@/components/Reports/DataEntryForm";
import { ExcelUploadZone } from "@/components/Reports/ExcelUploadZone";
import { DataTable } from "@/components/Reports/DataTable";
import { HistoricalTrendChart } from "@/components/Reports/HistoricalTrendChart";
import { KPICard } from "@/components/Dashboard/KPICard";
import { Clock, AlertTriangle, TrendingDown } from "lucide-react";

const BillingNPT = () => {
  const formFields = [
    { name: "rig", label: "Rig", type: "text" as const, required: true },
    { name: "date", label: "Date", type: "date" as const, required: true },
    { name: "system", label: "System", type: "select" as const, options: ["Draw Works", "Top Drive", "Mud Pumps", "BOP", "Power Generation", "Hydraulics"], required: true },
    { name: "subSystem", label: "Sub System", type: "text" as const, required: true },
    { name: "equipmentFailure", label: "Equipment Failure", type: "text" as const, required: true },
    { name: "rootCause", label: "Root Cause", type: "text" as const, required: true },
    { name: "correctiveAction", label: "Corrective Action", type: "text" as const, required: true },
    { name: "hours", label: "NPT Hours", type: "number" as const, required: true },
    { name: "notificationNo", label: "Notification Number", type: "text" as const },
    { name: "workOrderNo", label: "Work Order Number", type: "text" as const },
  ];

  const tableColumns = [
    { key: "rig", label: "Rig", sortable: true },
    { key: "date", label: "Date", sortable: true },
    { key: "system", label: "System", sortable: true },
    { key: "equipmentFailure", label: "Equipment", sortable: true },
    { key: "rootCause", label: "Root Cause", sortable: true },
    { key: "hours", label: "NPT Hours", sortable: true },
  ];

  const sampleData = [
    { rig: "ADC-225", date: "2024-01-15", system: "Draw Works", equipmentFailure: "Main Brake", rootCause: "Bearing Failure", hours: "12.5" },
    { rig: "ADC-226", date: "2024-01-18", system: "Top Drive", equipmentFailure: "Motor Assembly", rootCause: "Overheating", hours: "8.0" },
    { rig: "ADC-227", date: "2024-01-22", system: "Mud Pumps", equipmentFailure: "Liner Failure", rootCause: "Wear & Tear", hours: "16.5" },
  ];

  const trendData = [
    { month: "Oct", drawWorks: 42, topDrive: 35, mudPumps: 48, bop: 22, power: 28, hydraulics: 16 },
    { month: "Nov", drawWorks: 45, topDrive: 38, mudPumps: 52, bop: 25, power: 30, hydraulics: 18 },
    { month: "Dec", drawWorks: 38, topDrive: 42, mudPumps: 45, bop: 20, power: 28, hydraulics: 22 },
    { month: "Jan", drawWorks: 48, topDrive: 40, mudPumps: 55, bop: 28, power: 32, hydraulics: 20 },
    { month: "Feb", drawWorks: 52, topDrive: 35, mudPumps: 58, bop: 30, power: 35, hydraulics: 25 },
    { month: "Mar", drawWorks: 45, topDrive: 38, mudPumps: 50, bop: 24, power: 30, hydraulics: 19 },
  ];

  return (
    <DataEntryLayout
      title="Billing NPT"
      description="Non-productive time tracking and billing analysis"
      breadcrumbs={[
        { label: "Dashboard", href: "/" },
        { label: "Rig Financials", href: "/rig-financials" },
        { label: "Billing NPT" }
      ]}
      viewContent={
        <div className="space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            <KPICard title="Total NPT" value="344 hrs" change={25.4} trend="down" icon={Clock} />
            <KPICard title="Allowable NPT" value="274 hrs" change={0} trend="neutral" icon={AlertTriangle} />
            <KPICard title="NPT Cost Impact" value="$1.2M" change={-15.3} trend="up" icon={TrendingDown} />
          </div>

          <HistoricalTrendChart
            title="NPT by System"
            description="Non-productive time breakdown by major system"
            data={trendData}
            dataKeys={[
              { key: "drawWorks", label: "Draw Works", color: "hsl(var(--destructive))" },
              { key: "topDrive", label: "Top Drive", color: "hsl(var(--chart-2))" },
              { key: "mudPumps", label: "Mud Pumps", color: "hsl(var(--chart-3))" },
              { key: "bop", label: "BOP", color: "hsl(var(--chart-4))" }
            ]}
            xAxisKey="month"
          />

          <DataTable columns={tableColumns} data={sampleData} />
        </div>
      }
      entryContent={
        <DataEntryForm
          title="Enter NPT Data"
          fields={formFields}
          frequency="daily"
        />
      }
      uploadContent={
        <ExcelUploadZone
          title="Upload NPT Report"
          templateName="npt_template.xlsx"
        />
      }
    />
  );
};

export default BillingNPT;

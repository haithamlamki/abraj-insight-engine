import { DataEntryLayout } from "@/components/Reports/DataEntryLayout";
import { DataEntryForm } from "@/components/Reports/DataEntryForm";
import { ExcelUploadZone } from "@/components/Reports/ExcelUploadZone";
import { DataTableWithDB } from "@/components/Reports/DataTableWithDB";
import { HistoricalTrendChart } from "@/components/Reports/HistoricalTrendChart";
import { KPICard } from "@/components/Dashboard/KPICard";
import { Clock, AlertTriangle, TrendingDown } from "lucide-react";
import { useKPIData } from "@/hooks/useKPIData";
import { useChartData } from "@/hooks/useChartData";

const BillingNPT = () => {
  const { kpis, isLoading: kpisLoading } = useKPIData("billing_npt");
  const { chartData, isLoading: chartLoading } = useChartData("billing_npt");

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
            <KPICard 
              title="Total NPT Hours" 
              value={kpisLoading ? "..." : `${kpis?.totalNPT || 0} hrs`}
              icon={Clock} 
            />
            <KPICard 
              title="Total Incidents" 
              value={kpisLoading ? "..." : kpis?.recordCount || 0}
              icon={AlertTriangle} 
            />
            <KPICard 
              title="Billable Rate" 
              value={kpisLoading ? "..." : `${kpis?.billableRate || 0}%`}
              icon={TrendingDown} 
            />
          </div>

          <HistoricalTrendChart
            title="NPT Trend"
            description="Monthly NPT hours and incidents"
            data={chartLoading ? [] : chartData}
            dataKeys={[
              { key: "nptHours", label: "NPT Hours", color: "hsl(var(--destructive))" },
              { key: "incidents", label: "Incidents", color: "hsl(var(--chart-2))" }
            ]}
            xAxisKey="month"
          />

          <DataTableWithDB 
            columns={tableColumns} 
            reportType="billing_npt"
            formatRow={(row) => ({
              ...row,
              date: new Date(row.date).toLocaleDateString(),
              equipmentFailure: row.equipment_failure,
              rootCause: row.root_cause,
              hours: row.npt_hours
            })}
          />
        </div>
      }
      entryContent={
        <DataEntryForm
          title="Enter NPT Data"
          fields={formFields}
          frequency="daily"
          reportType="billing_npt"
        />
      }
      uploadContent={
        <ExcelUploadZone
          title="Upload NPT Report"
          templateName="npt_template.xlsx"
          reportType="billing_npt"
        />
      }
    />
  );
};

export default BillingNPT;

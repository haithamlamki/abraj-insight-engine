import { DataEntryLayout } from "@/components/Reports/DataEntryLayout";
import { DataEntryForm } from "@/components/Reports/DataEntryForm";
import { ExcelUploadZone } from "@/components/Reports/ExcelUploadZone";
import { DataTable } from "@/components/Reports/DataTable";
import { HistoricalTrendChart } from "@/components/Reports/HistoricalTrendChart";
import { KPICard } from "@/components/Dashboard/KPICard";
import { Percent, TrendingUp, Calendar } from "lucide-react";

const Utilization = () => {
  const formFields = [
    { name: "rig", label: "Rig", type: "text" as const, required: true },
    { name: "month", label: "Month", type: "select" as const, options: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"], required: true },
    { name: "client", label: "Client", type: "text" as const, required: true },
    { name: "calendarDays", label: "Calendar Days", type: "number" as const, required: true },
    { name: "workingDays", label: "Working Days", type: "number" as const, required: true },
    { name: "allowableNPT", label: "Allowable NPT (hrs)", type: "number" as const, required: true },
    { name: "actualNPT", label: "Actual NPT (hrs)", type: "number" as const, required: true },
    { name: "utilization", label: "Utilization (%)", type: "number" as const, required: true },
  ];

  const tableColumns = [
    { key: "rig", label: "Rig", sortable: true },
    { key: "month", label: "Month", sortable: true },
    { key: "client", label: "Client", sortable: true },
    { key: "workingDays", label: "Working Days", sortable: true },
    { key: "allowableNPT", label: "Allowable NPT", sortable: true },
    { key: "actualNPT", label: "Actual NPT", sortable: true },
    { key: "utilization", label: "Utilization", sortable: true },
  ];

  const sampleData = [
    { rig: "ADC-225", month: "January", client: "ADNOC", workingDays: "31", allowableNPT: "74.4", actualNPT: "58.2", utilization: "92.2%" },
    { rig: "ADC-226", month: "January", client: "ADNOC", workingDays: "31", allowableNPT: "74.4", actualNPT: "52.1", utilization: "93.8%" },
    { rig: "ADC-227", month: "January", client: "ADNOC", workingDays: "31", allowableNPT: "74.4", actualNPT: "65.5", utilization: "90.5%" },
  ];

  const trendData = [
    { month: "Oct", utilization: 82 },
    { month: "Nov", utilization: 85 },
    { month: "Dec", utilization: 83 },
    { month: "Jan", utilization: 86 },
    { month: "Feb", utilization: 84 },
    { month: "Mar", utilization: 87.5 },
  ];

  return (
    <DataEntryLayout
      title="Rig Utilization"
      description="Track and analyze rig utilization rates across all operations"
      breadcrumbs={[
        { label: "Dashboard", href: "/" },
        { label: "Rig Financials", href: "/rig-financials" },
        { label: "Utilization" }
      ]}
      viewContent={
        <div className="space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            <KPICard title="Current Utilization" value="87.5%" change={2.3} trend="up" icon={Percent} />
            <KPICard title="Monthly Average" value="85.2%" change={1.5} trend="up" icon={TrendingUp} />
            <KPICard title="Active Days" value="28/31" change={0} trend="neutral" icon={Calendar} />
          </div>

          <HistoricalTrendChart
            title="6-Month Utilization Trend"
            description="Historical utilization rates over the past 6 months"
            data={trendData}
            dataKeys={[{ key: "utilization", label: "Utilization %", color: "hsl(var(--primary))" }]}
            xAxisKey="month"
          />

          <DataTable columns={tableColumns} data={sampleData} />
        </div>
      }
      entryContent={
        <DataEntryForm
          title="Enter Utilization Data"
          fields={formFields}
          frequency="daily"
        />
      }
      uploadContent={
        <ExcelUploadZone
          title="Upload Utilization Report"
          templateName="utilization_template.xlsx"
        />
      }
    />
  );
};

export default Utilization;

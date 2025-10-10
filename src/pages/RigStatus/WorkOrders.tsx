import { DataEntryLayout } from "@/components/Reports/DataEntryLayout";
import { DataEntryForm } from "@/components/Reports/DataEntryForm";
import { ExcelUploadZone } from "@/components/Reports/ExcelUploadZone";
import { DataTable } from "@/components/Reports/DataTable";
import { HistoricalTrendChart } from "@/components/Reports/HistoricalTrendChart";
import { KPICard } from "@/components/Dashboard/KPICard";
import { ClipboardList, CheckCircle2, Clock } from "lucide-react";

const WorkOrders = () => {
  const formFields = [
    { name: "rig", label: "Rig", type: "text" as const, required: true },
    { name: "month", label: "Month", type: "select" as const, options: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"], required: true },
    { name: "elecOpen", label: "ELEC Open", type: "number" as const, required: true },
    { name: "elecClosed", label: "ELEC Closed", type: "number" as const, required: true },
    { name: "mechOpen", label: "MECH Open", type: "number" as const, required: true },
    { name: "mechClosed", label: "MECH Closed", type: "number" as const, required: true },
    { name: "operOpen", label: "OPER Open", type: "number" as const, required: true },
    { name: "operClosed", label: "OPER Closed", type: "number" as const, required: true },
    { name: "complianceRate", label: "Compliance Rate (%)", type: "number" as const },
  ];

  const tableColumns = [
    { key: "rig", label: "Rig", sortable: true },
    { key: "month", label: "Month", sortable: true },
    { key: "elecTotal", label: "ELEC Total", sortable: true },
    { key: "mechTotal", label: "MECH Total", sortable: true },
    { key: "operTotal", label: "OPER Total", sortable: true },
    { key: "complianceRate", label: "Compliance", sortable: true },
  ];

  const sampleData = [
    { rig: "ADC-225", month: "January", elecTotal: "45", mechTotal: "62", operTotal: "28", complianceRate: "94.2%" },
    { rig: "ADC-226", month: "January", elecTotal: "38", mechTotal: "58", operTotal: "32", complianceRate: "96.1%" },
    { rig: "ADC-227", month: "January", elecTotal: "52", mechTotal: "71", operTotal: "25", complianceRate: "92.8%" },
  ];

  const trendData = [
    { month: "Oct", elec: 42, mech: 58, oper: 26, compliance: 93 },
    { month: "Nov", elec: 45, mech: 62, oper: 28, compliance: 94 },
    { month: "Dec", elec: 38, mech: 58, oper: 32, compliance: 96 },
    { month: "Jan", elec: 48, mech: 65, oper: 25, compliance: 92 },
    { month: "Feb", elec: 52, mech: 71, oper: 25, compliance: 93 },
    { month: "Mar", elec: 45, mech: 62, oper: 30, compliance: 95 },
  ];

  return (
    <DataEntryLayout
      title="Work Orders"
      description="Manage and track work orders across all rigs"
      breadcrumbs={[
        { label: "Dashboard", href: "/" },
        { label: "Rig Status", href: "/rig-status" },
        { label: "Work Orders" }
      ]}
      viewContent={
        <div className="space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            <KPICard title="Active WOs" value="38" change={31.6} trend="up" icon={ClipboardList} />
            <KPICard title="Completed (Month)" value="50" change={8.7} trend="up" icon={CheckCircle2} />
            <KPICard title="Avg Completion" value="3.2 days" change={-12.5} trend="up" icon={Clock} />
          </div>

          <HistoricalTrendChart
            title="Work Order Distribution by Category"
            description="ELEC, MECH, and OPER work orders over time"
            data={trendData}
            dataKeys={[
              { key: "elec", label: "Electrical", color: "hsl(var(--chart-1))" },
              { key: "mech", label: "Mechanical", color: "hsl(var(--chart-2))" },
              { key: "oper", label: "Operational", color: "hsl(var(--chart-3))" },
              { key: "compliance", label: "Compliance %", color: "hsl(var(--primary))" }
            ]}
            xAxisKey="month"
          />

          <DataTable columns={tableColumns} data={sampleData} />
        </div>
      }
      entryContent={
        <DataEntryForm
          title="Create Work Order"
          fields={formFields}
          frequency="daily"
        />
      }
      uploadContent={
        <ExcelUploadZone
          title="Upload Work Order Report"
          templateName="work_orders_template.xlsx"
        />
      }
    />
  );
};

export default WorkOrders;

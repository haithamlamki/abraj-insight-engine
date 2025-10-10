import { DataEntryLayout } from "@/components/Reports/DataEntryLayout";
import { DataEntryForm } from "@/components/Reports/DataEntryForm";
import { ExcelUploadZone } from "@/components/Reports/ExcelUploadZone";
import { DataTableWithDB } from "@/components/Reports/DataTableWithDB";
import { HistoricalTrendChart } from "@/components/Reports/HistoricalTrendChart";
import { KPICard } from "@/components/Dashboard/KPICard";
import { ClipboardList, CheckCircle2, Clock } from "lucide-react";
import { useKPIData } from "@/hooks/useKPIData";
import { useChartData } from "@/hooks/useChartData";

const WorkOrders = () => {
  const { kpis, isLoading: kpisLoading } = useKPIData("work_orders");
  const { chartData, isLoading: chartLoading } = useChartData("work_orders");

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
            <KPICard 
              title="Open WOs" 
              value={kpisLoading ? "..." : kpis?.totalOpen || 0}
              trend="neutral" 
              icon={Clock} 
            />
            <KPICard 
              title="Closed WOs" 
              value={kpisLoading ? "..." : kpis?.totalClosed || 0}
              trend="up" 
              icon={CheckCircle2} 
            />
            <KPICard 
              title="Avg Compliance" 
              value={kpisLoading ? "..." : `${kpis?.avgCompliance || 0}%`}
              trend="up" 
              icon={ClipboardList} 
            />
          </div>

          <HistoricalTrendChart
            title="Work Order Trends"
            description="Open vs closed work orders over time"
            data={chartLoading ? [] : chartData}
            dataKeys={[
              { key: "open", label: "Open", color: "hsl(var(--warning))" },
              { key: "closed", label: "Closed", color: "hsl(var(--success))" }
            ]}
            xAxisKey="month"
          />

          <DataTableWithDB 
            columns={tableColumns} 
            reportType="work_orders"
            formatRow={(row) => ({
              ...row,
              elecTotal: (row.elec_open || 0) + (row.elec_closed || 0),
              mechTotal: (row.mech_open || 0) + (row.mech_closed || 0),
              operTotal: (row.oper_open || 0) + (row.oper_closed || 0),
              complianceRate: row.compliance_rate ? `${row.compliance_rate}%` : '-'
            })}
          />
        </div>
      }
      entryContent={
        <DataEntryForm
          title="Create Work Order"
          fields={formFields}
          frequency="daily"
          reportType="work_orders"
        />
      }
      uploadContent={
        <ExcelUploadZone
          title="Upload Work Order Report"
          templateName="work_orders_template.xlsx"
          reportType="work_orders"
        />
      }
    />
  );
};

export default WorkOrders;

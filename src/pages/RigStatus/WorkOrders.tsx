import { DataEntryLayout } from "@/components/Reports/DataEntryLayout";
import { DataTableWithDB } from "@/components/Reports/DataTableWithDB";
import { HistoricalTrendChart } from "@/components/Reports/HistoricalTrendChart";
import { KPICard } from "@/components/Dashboard/KPICard";
import { ClipboardList, CheckCircle2, Clock } from "lucide-react";
import { useKPIData } from "@/hooks/useKPIData";
import { useChartData } from "@/hooks/useChartData";

const WorkOrders = () => {
  const { kpis, isLoading: kpisLoading } = useKPIData("work_orders");
  const { chartData, isLoading: chartLoading } = useChartData("work_orders");

  const tableColumns = [
    { key: "rig", label: "Rig", sortable: true },
    { key: "month", label: "Month", sortable: true },
    { key: "elecTotal", label: "ELEC Total", sortable: true },
    { key: "mechTotal", label: "MECH Total", sortable: true },
    { key: "operTotal", label: "OPER Total", sortable: true },
    { key: "complianceRate", label: "Compliance", sortable: true },
  ];

  return (
    <DataEntryLayout
      title="Work Orders"
      description="Manage and track work orders across all rigs"
      reportType="work_orders"
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
    />
  );
};

export default WorkOrders;

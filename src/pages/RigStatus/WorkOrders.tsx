import { DataEntryLayout } from "@/components/Reports/DataEntryLayout";
import { DataEntryForm } from "@/components/Reports/DataEntryForm";
import { ExcelUploadZone } from "@/components/Reports/ExcelUploadZone";
import { DataTable } from "@/components/Reports/DataTable";
import { HistoricalTrendChart } from "@/components/Reports/HistoricalTrendChart";
import { KPICard } from "@/components/Dashboard/KPICard";
import { ClipboardList, CheckCircle2, Clock } from "lucide-react";

const WorkOrders = () => {
  const formFields = [
    { name: "date", label: "Date", type: "date" as const, required: true },
    { name: "woNumber", label: "WO Number", type: "text" as const, required: true },
    { name: "rigNumber", label: "Rig Number", type: "text" as const, required: true },
    { name: "priority", label: "Priority", type: "select" as const, options: ["High", "Medium", "Low"], required: true },
    { name: "status", label: "Status", type: "select" as const, options: ["Open", "In Progress", "Completed"], required: true },
  ];

  const tableColumns = [
    { key: "woNumber", label: "WO #", sortable: true },
    { key: "rigNumber", label: "Rig", sortable: true },
    { key: "description", label: "Description", sortable: false },
    { key: "priority", label: "Priority", sortable: true },
    { key: "status", label: "Status", sortable: true },
  ];

  const sampleData = [
    { woNumber: "WO-2024-157", rigNumber: "Rig-101", description: "Hydraulic system repair", priority: "High", status: "In Progress" },
    { woNumber: "WO-2024-158", rigNumber: "Rig-205", description: "Routine inspection", priority: "Medium", status: "Open" },
    { woNumber: "WO-2024-159", rigNumber: "Rig-102", description: "Electrical maintenance", priority: "High", status: "Completed" },
  ];

  const trendData = [
    { month: "Oct", active: 32, completed: 45 },
    { month: "Nov", active: 35, completed: 42 },
    { month: "Dec", active: 30, completed: 48 },
    { month: "Jan", active: 36, completed: 44 },
    { month: "Feb", active: 34, completed: 46 },
    { month: "Mar", active: 38, completed: 50 },
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
            title="Work Orders Trend"
            description="Active vs completed work orders over time"
            data={trendData}
            dataKeys={[
              { key: "active", label: "Active WOs", color: "hsl(var(--chart-1))" },
              { key: "completed", label: "Completed WOs", color: "hsl(var(--success))" }
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

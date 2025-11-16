import { DataEntryLayout } from "@/components/Reports/DataEntryLayout";
import { DataTableWithDB } from "@/components/Reports/DataTableWithDB";
import { HistoricalTrendChart } from "@/components/Reports/HistoricalTrendChart";
import { KPICard } from "@/components/Dashboard/KPICard";
import { Wrench, DollarSign, Clock } from "lucide-react";

const Maintenance = () => {
  const tableColumns = [
    { key: "date", label: "Date", sortable: true },
    { key: "rigNumber", label: "Rig", sortable: true },
    { key: "maintenanceType", label: "Type", sortable: true },
    { key: "downtime", label: "Downtime", sortable: true },
    { key: "cost", label: "Cost", sortable: true },
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
      reportType="maintenance"
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

          <DataTableWithDB 
            columns={tableColumns} 
            reportType="fuel"
            formatRow={(row) => ({
              ...row,
              date: new Date(row.date).toLocaleDateString(),
              rigNumber: row.rig,
              maintenanceType: row.fuel_type || '-',
              downtime: '-',
              cost: `$${row.total_cost?.toLocaleString()}`
            })}
          />
        </div>
      }
    />
  );
};

export default Maintenance;

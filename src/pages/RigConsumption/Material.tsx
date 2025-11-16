import { DataEntryLayout } from "@/components/Reports/DataEntryLayout";
import { DataTableWithDB } from "@/components/Reports/DataTableWithDB";
import { HistoricalTrendChart } from "@/components/Reports/HistoricalTrendChart";
import { KPICard } from "@/components/Dashboard/KPICard";
import { Package, DollarSign, TrendingUp } from "lucide-react";

const Material = () => {
  const tableColumns = [
    { key: "date", label: "Date", sortable: true },
    { key: "rigNumber", label: "Rig", sortable: true },
    { key: "materialType", label: "Material", sortable: true },
    { key: "quantity", label: "Quantity", sortable: true },
    { key: "cost", label: "Cost", sortable: true },
  ];

  const trendData = [
    { month: "Oct", cost: 265 },
    { month: "Nov", cost: 278 },
    { month: "Dec", cost: 272 },
    { month: "Jan", cost: 289 },
    { month: "Feb", cost: 271 },
    { month: "Mar", cost: 285 },
  ];

  return (
    <DataEntryLayout
      title="Material Tracking"
      description="Track material usage and costs across operations"
      reportType="material"
      breadcrumbs={[
        { label: "Dashboard", href: "/" },
        { label: "Rig Consumption", href: "/rig-consumption" },
        { label: "Material" }
      ]}
      viewContent={
        <div className="space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            <KPICard title="Total Cost" value="$285K" change={5.1} trend="down" icon={DollarSign} />
            <KPICard title="Material Orders" value="147" change={12.3} trend="up" icon={Package} />
            <KPICard title="Avg Cost/Rig" value="$11.4K" change={3.8} trend="down" icon={TrendingUp} />
          </div>

          <HistoricalTrendChart
            title="Monthly Material Costs"
            description="Material expenditure over the past 6 months"
            data={trendData}
            dataKeys={[{ key: "cost", label: "Cost ($000)", color: "hsl(var(--chart-4))" }]}
            xAxisKey="month"
          />

          <DataTableWithDB 
            columns={tableColumns} 
            reportType="fuel"
            formatRow={(row) => ({
              ...row,
              date: new Date(row.date).toLocaleDateString(),
              rigNumber: row.rig,
              materialType: row.fuel_type || '-',
              quantity: row.fuel_consumed?.toLocaleString() || '-',
              cost: `$${row.total_cost?.toLocaleString()}`
            })}
          />
        </div>
      }
    />
  );
};

export default Material;

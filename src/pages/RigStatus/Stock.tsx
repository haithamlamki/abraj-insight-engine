import { DataEntryLayout } from "@/components/Reports/DataEntryLayout";
import { DataTableWithDB } from "@/components/Reports/DataTableWithDB";
import { HistoricalTrendChart } from "@/components/Reports/HistoricalTrendChart";
import { KPICard } from "@/components/Dashboard/KPICard";
import { Package2, AlertTriangle, TrendingUp } from "lucide-react";
import { useKPIData } from "@/hooks/useKPIData";
import { useChartData } from "@/hooks/useChartData";

const Stock = () => {
  const { kpis, isLoading: kpisLoading } = useKPIData("stock");
  const { chartData, isLoading: chartLoading } = useChartData("stock");

  const tableColumns = [
    { key: "itemName", label: "Item", sortable: true },
    { key: "category", label: "Category", sortable: true },
    { key: "currentStock", label: "Current", sortable: true },
    { key: "minStock", label: "Min Level", sortable: true },
    { key: "status", label: "Status", sortable: true },
  ];

  const trendData = [
    { month: "Oct", level: 88 },
    { month: "Nov", level: 90 },
    { month: "Dec", level: 85 },
    { month: "Jan", level: 91 },
    { month: "Feb", level: 87 },
    { month: "Mar", level: 92 },
  ];

  return (
    <DataEntryLayout
      title="Stock Levels"
      description="Monitor inventory and manage stock across all locations"
      reportType="stock_levels"
      breadcrumbs={[
        { label: "Dashboard", href: "/" },
        { label: "Rig Status", href: "/rig-status" },
        { label: "Stock" }
      ]}
      viewContent={
        <div className="space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            <KPICard 
              title="Stock Health" 
              value={kpisLoading ? "..." : `${kpis?.stockHealth || 0}%`}
              icon={Package2} 
            />
            <KPICard 
              title="Low Stock Items" 
              value={kpisLoading ? "..." : kpis?.lowStock || 0}
              icon={AlertTriangle} 
            />
            <KPICard 
              title="Total Items" 
              value={kpisLoading ? "..." : kpis?.totalItems || 0}
              icon={TrendingUp} 
            />
          </div>

          <HistoricalTrendChart
            title="Stock Level Trend"
            description="Overall inventory levels over time"
            data={trendData}
            dataKeys={[{ key: "level", label: "Stock Level %", color: "hsl(var(--chart-3))" }]}
            xAxisKey="month"
          />

          <DataTableWithDB 
            columns={tableColumns} 
            reportType="stock"
            formatRow={(row) => ({
              ...row,
              itemName: row.item_name,
              currentStock: row.current_qty,
              minStock: row.target_qty,
              status: row.status || 'OK'
            })}
          />
        </div>
      }
    />
  );
};

export default Stock;

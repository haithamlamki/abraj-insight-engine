import { DataEntryLayout } from "@/components/Reports/DataEntryLayout";
import { DataTableWithDB } from "@/components/Reports/DataTableWithDB";
import { HistoricalTrendChart } from "@/components/Reports/HistoricalTrendChart";
import { KPICard } from "@/components/Dashboard/KPICard";
import { Fuel as FuelIcon, TrendingDown, Gauge, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useFuelAnalytics } from "@/hooks/useFuelAnalytics";

const Fuel = () => {
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();
  const { data: analytics, isLoading } = useFuelAnalytics({ year: currentYear });


  const tableColumns = [
    { key: "rig", label: "Rig", sortable: true },
    { key: "year", label: "Year", sortable: true },
    { key: "month", label: "Month", sortable: true },
    { key: "totalConsumed", label: "Total Consumed (L)", sortable: true },
    { key: "fuelCost", label: "Fuel Cost ($)", sortable: true },
    { key: "closingBalance", label: "Closing Balance (L)", sortable: true },
  ];

  return (
    <DataEntryLayout
      title="Fuel Consumption"
      description="Monitor and optimize fuel usage across all rigs"
      breadcrumbs={[
        { label: "Dashboard", href: "/" },
        { label: "Rig Consumption", href: "/rig-consumption" },
        { label: "Fuel" }
      ]}
      viewContent={
        <div className="space-y-6">
          <div className="flex justify-end">
            <Button 
              onClick={() => navigate('/rig-consumption/fuel-analytics')}
              variant="default"
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              View Analytics Dashboard
            </Button>
          </div>
          
          <div className="grid gap-6 md:grid-cols-3">
            <KPICard 
              title="Total Consumption" 
              value={isLoading ? "..." : `${(analytics?.totalConsumed || 0).toLocaleString()} L`}
              icon={FuelIcon} 
            />
            <KPICard 
              title="Total Cost" 
              value={isLoading ? "..." : `$${(analytics?.totalCost || 0).toLocaleString()}`}
              icon={TrendingDown} 
            />
            <KPICard 
              title="Active Rigs" 
              value={isLoading ? "..." : (analytics?.uniqueRigsCount || 0)}
              icon={Gauge} 
            />
          </div>

          <HistoricalTrendChart
            title="Fuel Consumption Analysis"
            description="Consumption and cost metrics over time"
            data={isLoading ? [] : analytics?.monthlyTrend || []}
            dataKeys={[
              { key: "consumed", label: "Fuel Consumed (L)", color: "hsl(var(--chart-1))" },
              { key: "cost", label: "Cost ($)", color: "hsl(var(--chart-2))" }
            ]}
            xAxisKey="month"
          />

          <DataTableWithDB 
            columns={tableColumns} 
            reportType="fuel"
            formatRow={(row) => ({
              ...row,
              totalConsumed: row.total_consumed?.toLocaleString() || '0',
              fuelCost: `$${row.fuel_cost?.toLocaleString() || '0'}`,
              closingBalance: row.closing_balance?.toLocaleString() || '0'
            })}
          />
        </div>
      }
    />
  );
};

export default Fuel;

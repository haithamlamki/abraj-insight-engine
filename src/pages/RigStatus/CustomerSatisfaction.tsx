import { DataEntryLayout } from "@/components/Reports/DataEntryLayout";
import { DataTableWithDB } from "@/components/Reports/DataTableWithDB";
import { HistoricalTrendChart } from "@/components/Reports/HistoricalTrendChart";
import { KPICard } from "@/components/Dashboard/KPICard";
import { SmilePlus, Star, TrendingUp } from "lucide-react";
import { useKPIData } from "@/hooks/useKPIData";
import { useChartData } from "@/hooks/useChartData";

const CustomerSatisfaction = () => {
  const { kpis, isLoading: kpisLoading } = useKPIData("customer_satisfaction");
  const { chartData, isLoading: chartLoading } = useChartData("customer_satisfaction");

  const tableColumns = [
    { key: "rig", label: "Rig", sortable: true },
    { key: "month", label: "Month", sortable: true },
    { key: "satisfactionRate", label: "Satisfaction", sortable: true },
    { key: "responseTime", label: "Response Time", sortable: true },
    { key: "issuesResolved", label: "Issues Resolved", sortable: true },
  ];

  return (
    <DataEntryLayout
      title="Customer Satisfaction"
      description="Track client feedback and satisfaction scores"
      reportType="customer_satisfaction"
      breadcrumbs={[
        { label: "Dashboard", href: "/" },
        { label: "Rig Status", href: "/rig-status" },
        { label: "Customer Satisfaction" }
      ]}
      viewContent={
        <div className="space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            <KPICard 
              title="Avg Score" 
              value={kpisLoading ? "..." : `${kpis?.avgScore || 0}/5.0`}
              icon={Star} 
            />
            <KPICard 
              title="Total Surveys" 
              value={kpisLoading ? "..." : kpis?.recordCount || 0}
              icon={SmilePlus} 
            />
            <KPICard 
              title="Satisfaction Rate" 
              value={kpisLoading ? "..." : `${kpis?.satisfactionRate || 0}%`}
              icon={TrendingUp} 
            />
          </div>

          <HistoricalTrendChart
            title="Customer Satisfaction Metrics"
            description="Satisfaction scores over time"
            data={chartLoading ? [] : chartData}
            dataKeys={[
              { key: "score", label: "Satisfaction Score", color: "hsl(var(--primary))" }
            ]}
            xAxisKey="month"
          />

          <DataTableWithDB 
            columns={tableColumns} 
            reportType="customer_satisfaction"
            formatRow={(row) => ({
              ...row,
              satisfactionRate: `${row.satisfaction_score}%`,
              responseTime: '-',
              issuesResolved: '-'
            })}
          />
        </div>
      }
    />
  );
};

export default CustomerSatisfaction;

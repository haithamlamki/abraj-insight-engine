import { DashboardLayout } from "@/components/Layout/DashboardLayout";
import { KPICard } from "@/components/Dashboard/KPICard";
import { KPICardWithBudget } from "@/components/Dashboard/KPICardWithBudget";
import { ChartCard } from "@/components/Dashboard/ChartCard";
import { NPTChart } from "@/components/Dashboard/NPTChart";
import { RigPerformanceChart } from "@/components/Dashboard/RigPerformanceChart";
import { AlertCircle, TrendingUp, Activity, Clock, DollarSign } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useDashboardData } from "@/hooks/useDashboardData";
import { ErrorBoundary } from "@/components/ErrorBoundary";

const Index = () => {
  const { data: dashboardData, isLoading } = useDashboardData();

  return (
    <ErrorBoundary>
      <DashboardLayout>
        <div className="space-y-6 animate-fade-in">
          {/* Alert Section */}
          {dashboardData && dashboardData.totalNPT > 250 && (
            <Alert className="border-warning bg-warning/10">
              <AlertCircle className="h-4 w-4 text-warning" />
              <AlertTitle className="text-warning">NPT Tracking Alert</AlertTitle>
              <AlertDescription className="text-warning/90">
                Total NPT hours: {dashboardData.totalNPT.toFixed(1)} hours. Monitor rig performance closely.
              </AlertDescription>
            </Alert>
          )}

          {/* KPI Cards Grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <KPICard
              title="Active Rigs"
              value={isLoading ? "..." : dashboardData?.activeRigs || 0}
              subtitle="Operational rigs"
              trend="up"
              status="success"
              icon={Activity}
            />
            <KPICard
              title="Fleet Utilization"
              value={isLoading ? "..." : `${dashboardData?.avgUtilization.toFixed(1) || 0}%`}
              subtitle="Average across fleet"
              trend={dashboardData && dashboardData.avgUtilization >= 85 ? "up" : "down"}
              status={dashboardData && dashboardData.avgUtilization >= 85 ? "success" : "warning"}
              icon={TrendingUp}
            />
            <KPICardWithBudget
              title="Total Revenue"
              value={isLoading ? "..." : `$${(dashboardData?.totalRevenue || 0).toLocaleString()}`}
              icon={DollarSign}
              reportKey="revenue"
              year={new Date().getFullYear()}
              month={new Date().getMonth() + 1}
              metricKey="revenue_omr"
            />
            <KPICard
              title="Open Work Orders"
              value={isLoading ? "..." : dashboardData?.totalOpenWOs || 0}
              subtitle="Pending completion"
              trend="neutral"
              status="neutral"
              icon={Clock}
            />
          </div>

        {/* Charts Grid */}
        <div className="grid gap-6 lg:grid-cols-2">
          <ChartCard
            title="Non-Productive Time by Rig"
            description="Comparing actual vs allowable NPT hours"
          >
            <NPTChart />
          </ChartCard>

          <ChartCard
            title="Rig Performance Trend"
            description="12-month comprehensive performance analysis"
          >
            <RigPerformanceChart />
          </ChartCard>
        </div>

          {/* Summary Statistics */}
          <div className="grid gap-6 md:grid-cols-3">
            <div className="bg-gradient-primary p-6 rounded-lg text-primary-foreground hover-scale transition-all duration-300">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium opacity-90">Fleet Efficiency</h3>
                <TrendingUp className="w-5 h-5 opacity-80" />
              </div>
              <p className="text-3xl font-bold">
                {isLoading ? "..." : `${dashboardData?.avgUtilization.toFixed(1) || 0}%`}
              </p>
              <p className="text-sm opacity-80 mt-1">Current utilization rate</p>
            </div>

            <div className="bg-card border border-border p-6 rounded-lg hover-scale transition-all duration-300">
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Total Revenue</h3>
              <p className="text-3xl font-bold text-foreground">
                {isLoading ? "..." : `$${((dashboardData?.totalRevenue || 0) / 1000).toFixed(0)}K`}
              </p>
              <p className="text-sm text-muted-foreground mt-1">Recent period revenue</p>
            </div>

            <div className="bg-card border border-border p-6 rounded-lg hover-scale transition-all duration-300">
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Stock Status</h3>
              <p className="text-3xl font-bold text-foreground">
                {isLoading ? "..." : dashboardData?.lowStockItems || 0}
              </p>
              <p className="text-sm text-muted-foreground mt-1">Low stock items</p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ErrorBoundary>
  );
};

export default Index;

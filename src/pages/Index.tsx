import { DashboardLayout } from "@/components/Layout/DashboardLayout";
import { KPICard } from "@/components/Dashboard/KPICard";
import { ChartCard } from "@/components/Dashboard/ChartCard";
import { NPTChart } from "@/components/Dashboard/NPTChart";
import { RigPerformanceChart } from "@/components/Dashboard/RigPerformanceChart";
import { AlertCircle, TrendingUp } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const Index = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Alert Section */}
        <Alert className="border-warning bg-warning/10">
          <AlertCircle className="h-4 w-4 text-warning" />
          <AlertTitle className="text-warning">NPT Exceeded Allowable Limit</AlertTitle>
          <AlertDescription className="text-warning/90">
            February total NPT: 344 hours exceeded allowable 274.32 hours. Rig 301 contributed 177.75 hours due to major failure.
          </AlertDescription>
        </Alert>

        {/* KPI Cards Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <KPICard
            title="Active Rigs"
            value="25"
            subtitle="Out of 28 total rigs"
            trend="up"
            trendValue="+2"
            status="success"
          />
          <KPICard
            title="Total NPT (Feb)"
            value="344 hrs"
            subtitle="Allowable: 274.32 hrs"
            trend="down"
            trendValue="25% over"
            status="error"
          />
          <KPICard
            title="Rig Move Profit"
            value="$813K"
            subtitle="Budget: $341K"
            trend="up"
            trendValue="+138%"
            status="success"
          />
          <KPICard
            title="Rig Moves (Feb)"
            value="20"
            subtitle="15 invoiced"
            trend="up"
            trendValue="+5"
            status="neutral"
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
            description="6-month efficiency trend vs target"
          >
            <RigPerformanceChart />
          </ChartCard>
        </div>

        {/* Summary Statistics */}
        <div className="grid gap-6 md:grid-cols-3">
          <div className="bg-gradient-primary p-6 rounded-lg text-primary-foreground">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium opacity-90">Monthly Efficiency</h3>
              <TrendingUp className="w-5 h-5 opacity-80" />
            </div>
            <p className="text-3xl font-bold">96%</p>
            <p className="text-sm opacity-80 mt-1">+4% from last month</p>
          </div>

          <div className="bg-card border border-border p-6 rounded-lg">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Avg Rig Move Distance</h3>
            <p className="text-3xl font-bold text-foreground">88 km</p>
            <p className="text-sm text-muted-foreground mt-1">Longest: 176 km (Rig 204)</p>
          </div>

          <div className="bg-card border border-border p-6 rounded-lg">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Data Freshness</h3>
            <p className="text-3xl font-bold text-foreground">Live</p>
            <p className="text-sm text-muted-foreground mt-1">Last update: 2 mins ago</p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Index;

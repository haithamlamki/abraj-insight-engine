import { DashboardLayout } from "@/components/Layout/DashboardLayout";
import { KPICard } from "@/components/Dashboard/KPICard";
import { ChartCard } from "@/components/Dashboard/ChartCard";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from "recharts";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";

const utilizationData = [
  { rig: "Rig 101", utilization: 95 },
  { rig: "Rig 102", utilization: 88 },
  { rig: "Rig 103", utilization: 92 },
  { rig: "Rig 104", utilization: 78 },
  { rig: "Rig 105", utilization: 85 },
];

const revenueData = [
  { month: "Jan", revenue: 2400, billingNPT: 180 },
  { month: "Feb", revenue: 2210, billingNPT: 210 },
  { month: "Mar", revenue: 2290, billingNPT: 195 },
  { month: "Apr", revenue: 2580, billingNPT: 160 },
  { month: "May", revenue: 2390, billingNPT: 175 },
  { month: "Jun", revenue: 2490, billingNPT: 185 },
];

const RigFinancials = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Rig Financials</h1>
          <p className="text-muted-foreground mt-2">Financial metrics and billing analysis</p>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <KPICard
            title="Avg Utilization"
            value="87.6%"
            subtitle="Across all rigs"
            trend="up"
            trendValue="+3.2%"
            status="success"
          />
          <KPICard
            title="YTD Revenue"
            value="$14.36M"
            subtitle="Target: $12.5M"
            trend="up"
            trendValue="+15%"
            status="success"
          />
          <KPICard
            title="Billing NPT"
            value="1,105 hrs"
            subtitle="YTD Total"
            trend="down"
            trendValue="-8%"
            status="success"
          />
          <KPICard
            title="Revenue/Rig"
            value="$574K"
            subtitle="Monthly avg"
            trend="up"
            trendValue="+12%"
            status="neutral"
          />
        </div>

        {/* Charts Grid */}
        <div className="grid gap-6 lg:grid-cols-2">
          <ChartCard
            title="Rig Utilization"
            description="Current utilization rate by rig"
          >
            <ChartContainer
              config={{
                utilization: {
                  label: "Utilization %",
                  color: "hsl(var(--chart-1))",
                },
              }}
            >
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={utilizationData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="rig" />
                  <YAxis />
                  <Tooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="utilization" fill="hsl(var(--chart-1))" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </ChartCard>

          <ChartCard
            title="Revenue & Billing NPT Trend"
            description="6-month revenue and billing NPT comparison"
          >
            <ChartContainer
              config={{
                revenue: {
                  label: "Revenue ($K)",
                  color: "hsl(var(--chart-2))",
                },
                billingNPT: {
                  label: "Billing NPT (hrs)",
                  color: "hsl(var(--chart-3))",
                },
              }}
            >
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip content={<ChartTooltipContent />} />
                  <Legend />
                  <Line type="monotone" dataKey="revenue" stroke="hsl(var(--chart-2))" strokeWidth={2} />
                  <Line type="monotone" dataKey="billingNPT" stroke="hsl(var(--chart-3))" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </ChartCard>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default RigFinancials;

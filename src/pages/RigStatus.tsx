import { DashboardLayout } from "@/components/Layout/DashboardLayout";
import { KPICard } from "@/components/Dashboard/KPICard";
import { ChartCard } from "@/components/Dashboard/ChartCard";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from "recharts";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";

const satisfactionData = [
  { category: "Response Time", score: 85 },
  { category: "Service Quality", score: 92 },
  { category: "Communication", score: 88 },
  { category: "Technical Support", score: 90 },
  { category: "Safety", score: 95 },
];

const stockData = [
  { item: "Drill Bits", level: 75, status: "good" },
  { item: "Mud Chemicals", level: 45, status: "warning" },
  { item: "Casing Pipes", level: 88, status: "good" },
  { item: "Spare Parts", level: 28, status: "critical" },
  { item: "Safety Equipment", level: 92, status: "good" },
];

const RigStatus = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Rig Status</h1>
          <p className="text-muted-foreground mt-2">Customer satisfaction, inventory, and operations</p>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <KPICard
            title="Satisfaction Score"
            value="90%"
            subtitle="Avg across categories"
            trend="up"
            trendValue="+5%"
            status="success"
          />
          <KPICard
            title="Stock Level"
            value="65.6%"
            subtitle="Avg inventory"
            trend="down"
            trendValue="-8%"
            status="warning"
          />
          <KPICard
            title="Open WO"
            value="42"
            subtitle="15 overdue"
            trend="up"
            trendValue="+7"
            status="warning"
          />
          <KPICard
            title="DR Line Issues"
            value="8"
            subtitle="3 critical"
            trend="neutral"
            status="neutral"
          />
        </div>

        {/* Charts Grid */}
        <div className="grid gap-6 lg:grid-cols-2">
          <ChartCard
            title="Customer Satisfaction"
            description="Performance by category (%)"
          >
            <ChartContainer
              config={{
                score: {
                  label: "Score",
                  color: "hsl(var(--chart-2))",
                },
              }}
            >
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={satisfactionData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="category" />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} />
                  <Radar name="Score" dataKey="score" stroke="hsl(var(--chart-2))" fill="hsl(var(--chart-2))" fillOpacity={0.6} />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </ChartCard>

          <Card className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Stock Levels</h3>
            <div className="space-y-4">
              {stockData.map((stock) => (
                <div key={stock.item} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">{stock.item}</span>
                    <span className="text-sm text-muted-foreground">{stock.level}%</span>
                  </div>
                  <Progress 
                    value={stock.level} 
                    className={
                      stock.status === "critical" 
                        ? "[&>div]:bg-destructive" 
                        : stock.status === "warning" 
                        ? "[&>div]:bg-warning" 
                        : "[&>div]:bg-success"
                    }
                  />
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Additional Status Cards */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Work Orders (WO)</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                <span className="text-sm text-foreground">Pending</span>
                <span className="font-bold text-foreground">27</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-warning/10 rounded-lg">
                <span className="text-sm text-warning">Overdue</span>
                <span className="font-bold text-warning">15</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-success/10 rounded-lg">
                <span className="text-sm text-success">Completed (This Week)</span>
                <span className="font-bold text-success">38</span>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">DR Line Status</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-destructive/10 rounded-lg">
                <span className="text-sm text-destructive">Critical Issues</span>
                <span className="font-bold text-destructive">3</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-warning/10 rounded-lg">
                <span className="text-sm text-warning">Minor Issues</span>
                <span className="font-bold text-warning">5</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-success/10 rounded-lg">
                <span className="text-sm text-success">Operational</span>
                <span className="font-bold text-success">22</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default RigStatus;

import { DashboardLayout } from "@/components/Layout/DashboardLayout";
import { KPICard } from "@/components/Dashboard/KPICard";
import { ChartCard } from "@/components/Dashboard/ChartCard";
import { Card } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";

const rigMoveData = [
  { rig: "Rig 204", distance: 176, duration: 8 },
  { rig: "Rig 301", distance: 142, duration: 6 },
  { rig: "Rig 105", distance: 98, duration: 5 },
  { rig: "Rig 202", distance: 88, duration: 4 },
  { rig: "Rig 103", distance: 65, duration: 3 },
];

const wellTrackerData = [
  { well: "Well-A", status: "Completed", days: 45, depth: 3500 },
  { well: "Well-B", status: "In Progress", days: 28, depth: 2800 },
  { well: "Well-C", status: "Completed", days: 52, depth: 4200 },
  { well: "Well-D", status: "In Progress", days: 15, depth: 1500 },
  { well: "Well-E", status: "Planned", days: 0, depth: 0 },
];

const RigPerformance = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Rig Performance</h1>
          <p className="text-muted-foreground mt-2">Rig moves and well tracking</p>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <KPICard
            title="Total Rig Moves"
            value="20"
            subtitle="This month"
            trend="up"
            trendValue="+5"
            status="neutral"
          />
          <KPICard
            title="Avg Distance"
            value="88 km"
            subtitle="Per move"
            trend="neutral"
            status="neutral"
          />
          <KPICard
            title="Active Wells"
            value="12"
            subtitle="5 completed"
            trend="up"
            trendValue="+2"
            status="success"
          />
          <KPICard
            title="Avg Well Time"
            value="42 days"
            subtitle="Target: 45 days"
            trend="up"
            trendValue="7% faster"
            status="success"
          />
        </div>

        {/* Charts Grid */}
        <div className="grid gap-6 lg:grid-cols-2">
          <ChartCard
            title="Recent Rig Moves"
            description="Distance and duration by rig"
          >
            <ChartContainer
              config={{
                distance: {
                  label: "Distance (km)",
                  color: "hsl(var(--chart-1))",
                },
                duration: {
                  label: "Duration (hrs)",
                  color: "hsl(var(--chart-2))",
                },
              }}
            >
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={rigMoveData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="rig" />
                  <YAxis />
                  <Tooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="distance" fill="hsl(var(--chart-1))" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </ChartCard>

          <Card className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Well Tracker</h3>
            <div className="space-y-4">
              {wellTrackerData.map((well) => (
                <div key={well.well} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <p className="font-medium text-foreground">{well.well}</p>
                    <p className="text-sm text-muted-foreground">
                      {well.status} • {well.depth > 0 ? `${well.depth}m depth` : 'Not started'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-foreground">{well.days} days</p>
                    <span
                      className={`inline-block px-2 py-1 text-xs rounded ${
                        well.status === "Completed"
                          ? "bg-success/20 text-success"
                          : well.status === "In Progress"
                          ? "bg-warning/20 text-warning"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {well.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default RigPerformance;

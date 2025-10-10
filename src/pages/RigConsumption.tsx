import { DashboardLayout } from "@/components/Layout/DashboardLayout";
import { KPICard } from "@/components/Dashboard/KPICard";
import { ChartCard } from "@/components/Dashboard/ChartCard";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";

const fuelData = [
  { rig: "Rig 101", fuel: 4200 },
  { rig: "Rig 102", fuel: 3800 },
  { rig: "Rig 103", fuel: 4100 },
  { rig: "Rig 104", fuel: 3500 },
  { rig: "Rig 105", fuel: 4400 },
];

const costBreakdown = [
  { name: "Fuel", value: 42 },
  { name: "Material", value: 28 },
  { name: "Repair & Maintenance", value: 30 },
];

const COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))"];

const RigConsumption = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Rig Consumption</h1>
          <p className="text-muted-foreground mt-2">Fuel, material, and maintenance tracking</p>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <KPICard
            title="Total Fuel"
            value="20,000 L"
            subtitle="This month"
            trend="down"
            trendValue="-5%"
            status="success"
          />
          <KPICard
            title="Material Cost"
            value="$285K"
            subtitle="Budget: $300K"
            trend="neutral"
            trendValue="95% of budget"
            status="success"
          />
          <KPICard
            title="R&M Cost"
            value="$312K"
            subtitle="Budget: $280K"
            trend="up"
            trendValue="+11%"
            status="warning"
          />
          <KPICard
            title="Cost/Rig"
            value="$24.8K"
            subtitle="Monthly avg"
            trend="up"
            trendValue="+3%"
            status="neutral"
          />
        </div>

        {/* Charts Grid */}
        <div className="grid gap-6 lg:grid-cols-2">
          <ChartCard
            title="Fuel Consumption by Rig"
            description="Monthly fuel usage (Liters)"
          >
            <ChartContainer
              config={{
                fuel: {
                  label: "Fuel (L)",
                  color: "hsl(var(--chart-1))",
                },
              }}
            >
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={fuelData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="rig" />
                  <YAxis />
                  <Tooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="fuel" fill="hsl(var(--chart-1))" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </ChartCard>

          <ChartCard
            title="Cost Distribution"
            description="Breakdown by category (%)"
          >
            <ChartContainer
              config={{
                fuel: { label: "Fuel", color: "hsl(var(--chart-1))" },
                material: { label: "Material", color: "hsl(var(--chart-2))" },
                maintenance: { label: "R&M", color: "hsl(var(--chart-3))" },
              }}
            >
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={costBreakdown}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {costBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          </ChartCard>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default RigConsumption;

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { ClientDistribution } from "@/hooks/useUtilizationAnalytics";

interface ClientDistributionChartProps {
  data: ClientDistribution[];
  onClientClick?: (client: string) => void;
}

const COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
  '#8b5cf6',
  '#ec4899',
  '#f59e0b',
];

export const ClientDistributionChart = ({ data, onClientClick }: ClientDistributionChartProps) => {
  const chartData = data.map((item, index) => ({
    name: item.client,
    value: item.rigCount,
    avgUtilization: item.avgUtilization,
    color: COLORS[index % COLORS.length],
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Client Distribution</CardTitle>
        <CardDescription>Rig count by client</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name}: ${Math.round(Number(percent ?? 0) * 100)}%`}
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
              onClick={(entry) => onClientClick?.(entry.name)}
              className="cursor-pointer"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const item = payload[0].payload as any;
                  return (
                    <div className="bg-background border rounded-lg p-3 shadow-lg">
                      <p className="font-semibold">{item.name}</p>
                      <p className="text-sm">Rigs: {item.value}</p>
                      <p className="text-sm">Avg Utilization: {item.avgUtilization}%</p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

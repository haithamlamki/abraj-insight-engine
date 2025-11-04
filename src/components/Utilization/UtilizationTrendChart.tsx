import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Brush } from "recharts";
import { TimeSeriesData } from "@/hooks/useUtilizationAnalytics";

interface UtilizationTrendChartProps {
  data: TimeSeriesData[];
  onPeriodClick?: (period: string) => void;
}

export const UtilizationTrendChart = ({ data, onPeriodClick }: UtilizationTrendChartProps) => {
  const chartData = data.map(item => ({
    period: item.period,
    utilization: item.avgUtilization,
    activeRigs: item.activeRigs,
    stackedRigs: item.stackedRigs,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Utilization Trend</CardTitle>
        <CardDescription>Fleet average utilization over time</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="period"
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `${value}%`}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-background border rounded-lg p-3 shadow-lg">
                      <p className="font-semibold mb-2">{data.period}</p>
                      <p className="text-sm">Avg Utilization: <span className="font-semibold">{data.utilization}%</span></p>
                      <p className="text-sm">Active Rigs: <span className="font-semibold">{data.activeRigs}</span></p>
                      <p className="text-sm">Stacked Rigs: <span className="font-semibold">{data.stackedRigs}</span></p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="utilization"
              stroke="hsl(var(--chart-1))"
              strokeWidth={3}
              dot={{ fill: 'hsl(var(--chart-1))', r: 4 }}
              activeDot={{ r: 6, onClick: (_, payload: any) => onPeriodClick?.(payload.payload.period) }}
              name="Utilization %"
            />
            <Brush
              dataKey="period"
              height={30}
              stroke="hsl(var(--primary))"
              fill="hsl(var(--muted))"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

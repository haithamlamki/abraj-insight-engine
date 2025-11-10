import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend } from "recharts";

interface RootCauseParetoChartProps {
  data: Array<{
    cause: string;
    hours: number;
    cumulativePercentage: number;
  }>;
  onCauseClick?: (cause: string) => void;
}

export function RootCauseParetoChart({ data, onCauseClick }: RootCauseParetoChartProps) {
  const topCauses = data.slice(0, 10);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Root Cause Pareto Analysis</CardTitle>
        <CardDescription>80/20 rule - identify the vital few causes</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={{}} className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={topCauses}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="cause" 
                angle={-45} 
                textAnchor="end" 
                height={150}
                className="text-xs"
              />
              <YAxis yAxisId="left" className="text-xs" />
              <YAxis yAxisId="right" orientation="right" className="text-xs" />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Legend />
              <Bar 
                yAxisId="left"
                dataKey="hours" 
                name="NPT Hours"
                fill="hsl(var(--chart-1))"
                radius={[4, 4, 0, 0]}
                onClick={(data: any) => data.payload && onCauseClick?.(data.payload.cause)}
                className="cursor-pointer"
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="cumulativePercentage"
                name="Cumulative %"
                stroke="hsl(var(--destructive))"
                strokeWidth={2}
                dot={{ r: 4 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

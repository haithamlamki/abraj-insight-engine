import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";

interface SystemBreakdownChartProps {
  data: Array<{
    system: string;
    hours: number;
    percentage: number;
  }>;
  onSystemClick?: (system: string) => void;
}

export function SystemBreakdownChart({ data, onSystemClick }: SystemBreakdownChartProps) {
  const topSystems = data.slice(0, 10);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Systems by NPT Hours</CardTitle>
        <CardDescription>Click a bar to filter by system</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={{}} className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={topSystems}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="system" 
                angle={-45} 
                textAnchor="end" 
                height={120}
                className="text-xs"
              />
              <YAxis className="text-xs" />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar 
                dataKey="hours" 
                fill="hsl(var(--chart-1))"
                radius={[4, 4, 0, 0]}
                onClick={(data: any) => data.payload && onSystemClick?.(data.payload.system)}
                className="cursor-pointer"
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

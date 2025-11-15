import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";
import { ChartFilterIndicator } from "@/components/Reports/ChartFilterIndicator";

interface SystemBreakdownChartProps {
  data: Array<{
    system: string;
    hours: number;
    percentage: number;
  }>;
  onSystemClick?: (system: string) => void;
  activeFilterCount?: number;
  totalRecords?: number;
}

export function SystemBreakdownChart({ data, onSystemClick, activeFilterCount = 0, totalRecords }: SystemBreakdownChartProps) {
  const topSystems = data.slice(0, 10);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>Top Systems by NPT Hours</CardTitle>
            <CardDescription>Click a bar to filter by system</CardDescription>
          </div>
          <ChartFilterIndicator 
            activeFilterCount={activeFilterCount}
            displayedRecords={data.length}
            totalRecords={totalRecords}
          />
        </div>
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

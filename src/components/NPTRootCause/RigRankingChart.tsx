import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Cell } from "recharts";
import { ChartFilterIndicator } from "@/components/Reports/ChartFilterIndicator";

interface RigRankingChartProps {
  data: Array<{
    rig: string;
    hours: number;
    events: number;
    avgHours: number;
  }>;
  onRigClick?: (rig: string) => void;
  activeFilterCount?: number;
  totalRecords?: number;
}

export function RigRankingChart({ data, onRigClick, activeFilterCount = 0, totalRecords }: RigRankingChartProps) {
  const topRigs = data.slice(0, 10);
  
  const getColor = (index: number) => {
    const colors = [
      'hsl(var(--destructive))',
      'hsl(var(--chart-1))',
      'hsl(var(--chart-2))',
      'hsl(var(--chart-3))',
      'hsl(var(--chart-4))'
    ];
    if (index === 0) return colors[0]; // Worst performer in red
    return colors[(index % 4) + 1];
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>Top 10 Rigs by NPT Hours</CardTitle>
            <CardDescription>Click a bar to filter by rig</CardDescription>
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
            <BarChart data={topRigs} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis type="number" className="text-xs" />
              <YAxis dataKey="rig" type="category" width={60} className="text-xs" />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar 
                dataKey="hours" 
                radius={[0, 4, 4, 0]}
                onClick={(data: any) => data.payload && onRigClick?.(data.payload.rig)}
                className="cursor-pointer"
              >
                {topRigs.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getColor(index)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

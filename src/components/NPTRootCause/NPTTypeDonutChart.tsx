import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from "recharts";
import { ChartFilterIndicator } from "@/components/Reports/ChartFilterIndicator";

interface NPTTypeDonutChartProps {
  data: Array<{
    type: string;
    hours: number;
    percentage: number;
  }>;
  onTypeClick?: (type: string) => void;
  activeFilterCount?: number;
  totalRecords?: number;
}

export function NPTTypeDonutChart({ data, onTypeClick, activeFilterCount = 0, totalRecords }: NPTTypeDonutChartProps) {
  const COLORS = [
    'hsl(var(--chart-1))',
    'hsl(var(--chart-2))',
    'hsl(var(--chart-3))',
    'hsl(var(--chart-4))',
    'hsl(var(--chart-5))'
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>NPT by Type</CardTitle>
            <CardDescription>Click a segment to filter</CardDescription>
          </div>
          <ChartFilterIndicator 
            activeFilterCount={activeFilterCount}
            displayedRecords={data.length}
            totalRecords={totalRecords}
          />
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer config={{}} className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="hours"
                nameKey="type"
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                onClick={(entry) => onTypeClick?.(entry.type)}
                className="cursor-pointer"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <ChartTooltip content={<ChartTooltipContent />} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

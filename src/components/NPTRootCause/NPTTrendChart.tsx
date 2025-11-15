import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend } from "recharts";
import { ChartFilterIndicator } from "@/components/Reports/ChartFilterIndicator";

interface NPTTrendChartProps {
  data: any[];
  onMonthClick?: (month: string) => void;
  activeFilterCount?: number;
  totalRecords?: number;
}

export function NPTTrendChart({ data, onMonthClick, activeFilterCount = 0, totalRecords }: NPTTrendChartProps) {
  const years = data.length > 0 
    ? Object.keys(data[0]).filter(key => key.startsWith('year')).map(key => key.replace('year', ''))
    : [];

  const colors = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))'];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>NPT Trend Over Time</CardTitle>
            <CardDescription>Monthly NPT hours by year - click to filter</CardDescription>
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
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="month" 
                className="text-xs"
                onClick={(e) => onMonthClick?.(e.value)}
              />
              <YAxis className="text-xs" />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Legend />
              {years.map((year, index) => (
                <Line
                  key={year}
                  type="monotone"
                  dataKey={`year${year}`}
                  name={year}
                  stroke={colors[index % colors.length]}
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

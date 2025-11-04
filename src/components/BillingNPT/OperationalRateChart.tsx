import { Card } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Brush } from "recharts";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface OperationalRateChartProps {
  data: Array<{
    yearMonth: string;
    operationalRate: number;
    totalNPT: number;
  }>;
  onMonthClick?: (yearMonth: string) => void;
}

export const OperationalRateChart = ({ data, onMonthClick }: OperationalRateChartProps) => {
  const [chartType, setChartType] = useState<'line' | 'bar'>('line');

  const chartConfig = {
    operationalRate: {
      label: "Operational Rate %",
      color: "hsl(var(--chart-1))",
    },
    totalNPT: {
      label: "Total NPT Hours",
      color: "hsl(var(--chart-2))",
    },
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold">Operational Rate & NPT Trends</h3>
          <p className="text-sm text-muted-foreground">Monthly operational efficiency and non-productive time</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={chartType === 'line' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setChartType('line')}
          >
            Line
          </Button>
          <Button
            variant={chartType === 'bar' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setChartType('bar')}
          >
            Bar
          </Button>
        </div>
      </div>

      <ChartContainer config={chartConfig} className="h-[400px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'line' ? (
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="yearMonth" 
                className="text-xs"
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis 
                yAxisId="left"
                className="text-xs"
                label={{ value: 'Operational Rate %', angle: -90, position: 'insideLeft' }}
              />
              <YAxis 
                yAxisId="right"
                orientation="right"
                className="text-xs"
                label={{ value: 'NPT Hours', angle: 90, position: 'insideRight' }}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Legend />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="operationalRate"
                stroke="hsl(var(--chart-1))"
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6, onClick: (e: any) => onMonthClick?.(e.payload.yearMonth) }}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="totalNPT"
                stroke="hsl(var(--chart-2))"
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6, onClick: (e: any) => onMonthClick?.(e.payload.yearMonth) }}
              />
              <Brush dataKey="yearMonth" height={30} stroke="hsl(var(--primary))" />
            </LineChart>
          ) : (
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="yearMonth" 
                className="text-xs"
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis 
                yAxisId="left"
                className="text-xs"
                label={{ value: 'Operational Rate %', angle: -90, position: 'insideLeft' }}
              />
              <YAxis 
                yAxisId="right"
                orientation="right"
                className="text-xs"
                label={{ value: 'NPT Hours', angle: 90, position: 'insideRight' }}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Legend />
              <Bar
                yAxisId="left"
                dataKey="operationalRate"
                fill="hsl(var(--chart-1))"
                onClick={(data: any) => onMonthClick?.(data.yearMonth)}
              />
              <Bar
                yAxisId="right"
                dataKey="totalNPT"
                fill="hsl(var(--chart-2))"
                onClick={(data: any) => onMonthClick?.(data.yearMonth)}
              />
              <Brush dataKey="yearMonth" height={30} stroke="hsl(var(--primary))" />
            </BarChart>
          )}
        </ResponsiveContainer>
      </ChartContainer>
    </Card>
  );
};

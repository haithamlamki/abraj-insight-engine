import { Card } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell, ResponsiveContainer } from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";

interface RigEfficiencyChartProps {
  data: Array<{
    rig: string;
    operationalRate: number;
    totalNPT: number;
    recordCount: number;
  }>;
  onRigClick?: (rig: string) => void;
}

export const RigEfficiencyChart = ({ data, onRigClick }: RigEfficiencyChartProps) => {
  const [sortBy, setSortBy] = useState<'operationalRate' | 'totalNPT' | 'recordCount'>('operationalRate');

  const sortedData = [...data].sort((a, b) => {
    if (sortBy === 'operationalRate') {
      return b.operationalRate - a.operationalRate;
    } else if (sortBy === 'totalNPT') {
      return b.totalNPT - a.totalNPT;
    } else {
      return b.recordCount - a.recordCount;
    }
  });

  const getColor = (rate: number) => {
    if (rate >= 80) return 'hsl(var(--chart-1))'; // Green
    if (rate >= 70) return 'hsl(var(--warning))'; // Orange
    return 'hsl(var(--destructive))'; // Red
  };

  const chartConfig = {
    operationalRate: {
      label: "Operational Rate %",
      color: "hsl(var(--chart-1))",
    },
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold">Rig Performance Comparison</h3>
          <p className="text-sm text-muted-foreground">Operational efficiency by rig</p>
        </div>
        <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Sort by..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="operationalRate">Operational Rate</SelectItem>
            <SelectItem value="totalNPT">Total NPT</SelectItem>
            <SelectItem value="recordCount">Record Count</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <ChartContainer config={chartConfig} className="h-[400px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={sortedData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              type="number"
              className="text-xs"
              label={{ value: 'Operational Rate %', position: 'insideBottom', offset: -5 }}
            />
            <YAxis 
              type="category"
              dataKey="rig"
              className="text-xs"
              width={60}
            />
            <ChartTooltip 
              content={<ChartTooltipContent />}
              formatter={(value: any, name: string, props: any) => {
                if (name === 'operationalRate') {
                  return [
                    <>
                      <div>Operational Rate: {value}%</div>
                      <div>Total NPT: {props.payload.totalNPT} hrs</div>
                      <div>Records: {props.payload.recordCount}</div>
                    </>,
                    ''
                  ];
                }
                return [value, name];
              }}
            />
            <Bar
              dataKey="operationalRate"
              onClick={(data: any) => onRigClick?.(data.rig)}
              radius={[0, 8, 8, 0]}
            >
              {sortedData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={getColor(entry.operationalRate)}
                  className="cursor-pointer hover:opacity-80 transition-opacity"
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartContainer>
    </Card>
  );
};

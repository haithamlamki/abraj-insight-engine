import { Card } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer } from "recharts";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface NPTCategoryChartProps {
  data: Array<{
    category: string;
    value: number;
    percentage: number;
  }>;
  onCategoryClick?: (category: string) => void;
}

export const NPTCategoryChart = ({ data, onCategoryClick }: NPTCategoryChartProps) => {
  const [viewMode, setViewMode] = useState<'absolute' | 'percentage'>('absolute');

  const chartConfig = {
    value: {
      label: "NPT Hours",
      color: "hsl(var(--chart-3))",
    },
    percentage: {
      label: "Percentage",
      color: "hsl(var(--chart-4))",
    },
  };

  const categoryColors: Record<string, string> = {
    'Repair': 'hsl(var(--destructive))',
    'Zero': 'hsl(var(--warning))',
    'Reduce': 'hsl(var(--chart-3))',
    'Special': 'hsl(var(--chart-4))',
    'Rig Move': 'hsl(var(--chart-5))',
    'A.Maint': 'hsl(var(--muted))'
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold">NPT Category Breakdown</h3>
          <p className="text-sm text-muted-foreground">Distribution by non-productive time type</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={viewMode === 'absolute' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('absolute')}
          >
            Hours
          </Button>
          <Button
            variant={viewMode === 'percentage' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('percentage')}
          >
            %
          </Button>
        </div>
      </div>

      <ChartContainer config={chartConfig} className="h-[350px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              type="number"
              className="text-xs"
              label={{ value: viewMode === 'absolute' ? 'Hours' : 'Percentage %', position: 'insideBottom', offset: -5 }}
            />
            <YAxis 
              type="category"
              dataKey="category"
              className="text-xs"
              width={80}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Legend />
            <Bar
              dataKey={viewMode === 'absolute' ? 'value' : 'percentage'}
              fill="hsl(var(--chart-3))"
              onClick={(data: any) => onCategoryClick?.(data.category)}
              radius={[0, 8, 8, 0]}
            >
              {data.map((entry, index) => (
                <rect 
                  key={`bar-${index}`}
                  fill={categoryColors[entry.category] || 'hsl(var(--chart-3))'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartContainer>
    </Card>
  );
};

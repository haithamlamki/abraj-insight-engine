import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine } from "recharts";

interface VarianceTrendChartProps {
  data: Array<{
    month: string;
    year: number;
    variance_pct: number | null;
    actual: number;
    budget: number;
  }>;
  title?: string;
  description?: string;
}

export const VarianceTrendChart = ({ 
  data, 
  title = "Variance Trend", 
  description = "Budget variance over time" 
}: VarianceTrendChartProps) => {
  const chartData = useMemo(() => {
    return data
      .filter(d => d.variance_pct !== null)
      .map(d => ({
        period: `${d.month.substring(0, 3)} ${d.year}`,
        variance: d.variance_pct,
        actual: d.actual,
        budget: d.budget,
      }));
  }, [data]);

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold">{title}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>

        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="period" 
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
            />
            <YAxis 
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
              label={{ 
                value: 'Variance %', 
                angle: -90, 
                position: 'insideLeft',
                style: { fill: 'hsl(var(--muted-foreground))' }
              }}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
              }}
              formatter={(value: any) => [`${value.toFixed(2)}%`, 'Variance']}
            />
            <Legend />
            <ReferenceLine 
              y={0} 
              stroke="hsl(var(--muted-foreground))" 
              strokeDasharray="3 3" 
            />
            <ReferenceLine 
              y={5} 
              stroke="hsl(var(--success))" 
              strokeDasharray="3 3"
              label={{ value: '+5%', fill: 'hsl(var(--success))' }}
            />
            <ReferenceLine 
              y={-5} 
              stroke="hsl(var(--success))" 
              strokeDasharray="3 3"
              label={{ value: '-5%', fill: 'hsl(var(--success))' }}
            />
            <ReferenceLine 
              y={10} 
              stroke="hsl(var(--warning))" 
              strokeDasharray="3 3"
              label={{ value: '+10%', fill: 'hsl(var(--warning))' }}
            />
            <ReferenceLine 
              y={-10} 
              stroke="hsl(var(--warning))" 
              strokeDasharray="3 3"
              label={{ value: '-10%', fill: 'hsl(var(--warning))' }}
            />
            <Line 
              type="monotone" 
              dataKey="variance" 
              stroke="hsl(var(--primary))" 
              strokeWidth={2}
              dot={{ fill: 'hsl(var(--primary))', r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};

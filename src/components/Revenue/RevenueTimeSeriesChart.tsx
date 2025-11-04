import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Brush, ReferenceLine } from "recharts";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { MonthlyTrend } from "@/hooks/useRevenueAnalytics";

interface RevenueTimeSeriesChartProps {
  data: MonthlyTrend[];
  title?: string;
  description?: string;
}

export const RevenueTimeSeriesChart = ({
  data,
  title = "Revenue Trend Analysis",
  description = "Actual vs Budget over time"
}: RevenueTimeSeriesChartProps) => {
  const [chartType, setChartType] = useState<'line' | 'bar'>('line');
  const [visibleSeries, setVisibleSeries] = useState({
    actual: true,
    budget: true,
    variance: true,
  });

  const toggleSeries = (series: keyof typeof visibleSeries) => {
    setVisibleSeries(prev => ({ ...prev, [series]: !prev[series] }));
  };

  const formatValue = (value: number) => {
    return `$${(value / 1000000).toFixed(2)}M`;
  };

  const formatPercent = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload) return null;

    const data = payload[0]?.payload;
    if (!data) return null;

    const variance = data.variance;
    const variancePct = data.variancePct;

    return (
      <div className="bg-background border border-border rounded-lg shadow-lg p-4">
        <p className="font-semibold mb-2">{`${data.month} ${data.year}`}</p>
        <div className="space-y-1 text-sm">
          {visibleSeries.actual && (
            <div className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'hsl(var(--chart-1))' }} />
                Actual:
              </span>
              <span className="font-medium">{formatValue(data.actual)}</span>
            </div>
          )}
          {visibleSeries.budget && (
            <div className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'hsl(var(--chart-2))' }} />
                Budget:
              </span>
              <span className="font-medium">{formatValue(data.budget)}</span>
            </div>
          )}
          {visibleSeries.variance && (
            <div className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'hsl(var(--chart-3))' }} />
                Variance:
              </span>
              <span className={`font-medium ${variance >= 0 ? 'text-success' : 'text-destructive'}`}>
                {formatValue(variance)} ({formatPercent(variancePct)})
              </span>
            </div>
          )}
        </div>
        {variance !== 0 && (
          <div className={`mt-2 pt-2 border-t flex items-center gap-2 text-xs ${variance >= 0 ? 'text-success' : 'text-destructive'}`}>
            {variance > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {variance > 0 ? 'Over' : 'Under'} budget by {Math.abs(variancePct).toFixed(1)}%
          </div>
        )}
      </div>
    );
  };

  const chartData = data.map(item => ({
    ...item,
    label: `${item.month.slice(0, 3)} ${item.year}`,
  }));

  const ChartComponent = chartType === 'line' ? LineChart : BarChart;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>{title}</CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
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
        <div className="flex gap-4 mt-4 flex-wrap">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => toggleSeries('actual')}
            className={visibleSeries.actual ? '' : 'opacity-50'}
          >
            <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: 'hsl(var(--chart-1))' }} />
            Actual Revenue
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => toggleSeries('budget')}
            className={visibleSeries.budget ? '' : 'opacity-50'}
          >
            <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: 'hsl(var(--chart-2))' }} />
            Budget Revenue
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => toggleSeries('variance')}
            className={visibleSeries.variance ? '' : 'opacity-50'}
          >
            <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: 'hsl(var(--chart-3))' }} />
            Variance
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <ChartComponent data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="label"
              className="text-xs"
              tick={{ fill: "hsl(var(--muted-foreground))" }}
            />
            <YAxis
              className="text-xs"
              tick={{ fill: "hsl(var(--muted-foreground))" }}
              tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <ReferenceLine y={0} stroke="hsl(var(--border))" strokeDasharray="3 3" />
            
            {chartType === 'line' ? (
              <>
                {visibleSeries.actual && (
                  <Line
                    type="monotone"
                    dataKey="actual"
                    stroke="hsl(var(--chart-1))"
                    strokeWidth={2}
                    name="Actual Revenue"
                    dot={{ fill: "hsl(var(--chart-1))", r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                )}
                {visibleSeries.budget && (
                  <Line
                    type="monotone"
                    dataKey="budget"
                    stroke="hsl(var(--chart-2))"
                    strokeWidth={2}
                    name="Budget Revenue"
                    dot={{ fill: "hsl(var(--chart-2))", r: 4 }}
                    activeDot={{ r: 6 }}
                    strokeDasharray="5 5"
                  />
                )}
                {visibleSeries.variance && (
                  <Line
                    type="monotone"
                    dataKey="variance"
                    stroke="hsl(var(--chart-3))"
                    strokeWidth={2}
                    name="Variance"
                    dot={{ fill: "hsl(var(--chart-3))", r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                )}
              </>
            ) : (
              <>
                {visibleSeries.actual && (
                  <Bar dataKey="actual" fill="hsl(var(--chart-1))" name="Actual Revenue" />
                )}
                {visibleSeries.budget && (
                  <Bar dataKey="budget" fill="hsl(var(--chart-2))" name="Budget Revenue" />
                )}
                {visibleSeries.variance && (
                  <Bar dataKey="variance" fill="hsl(var(--chart-3))" name="Variance" />
                )}
              </>
            )}
            
            <Brush
              dataKey="label"
              height={30}
              stroke="hsl(var(--primary))"
              fill="hsl(var(--muted))"
            />
          </ChartComponent>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

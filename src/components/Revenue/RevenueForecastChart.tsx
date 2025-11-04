import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  ComposedChart,
  ReferenceLine,
} from "recharts";
import { TrendingUp, TrendingDown, Minus, Calendar } from "lucide-react";
import { generateForecast, calculateForecastMetrics } from "@/utils/forecastingAlgorithms";

interface RevenueForecastChartProps {
  historicalData: { date: Date; value: number; month: string; year: number }[];
  title?: string;
  description?: string;
}

export const RevenueForecastChart = ({
  historicalData,
  title = "Revenue Forecast",
  description = "Projected revenue based on historical trends",
}: RevenueForecastChartProps) => {
  const [forecastPeriods, setForecastPeriods] = useState<3 | 6 | 12>(6);
  const [showConfidenceInterval, setShowConfidenceInterval] = useState(true);

  const { chartData, metrics } = useMemo(() => {
    // Extract historical values
    const values = historicalData.map(d => d.value);
    
    // Generate forecasts
    const forecasts = generateForecast(values, forecastPeriods);
    
    // Calculate metrics
    const metrics = calculateForecastMetrics(forecasts);

    // Prepare chart data
    const lastDate = historicalData[historicalData.length - 1]?.date || new Date();
    
    const historicalChartData = historicalData.slice(-12).map(d => ({
      label: `${d.month.slice(0, 3)} ${d.year}`,
      actual: d.value,
      forecast: null,
      upper: null,
      lower: null,
      type: 'historical' as const,
    }));

    const forecastChartData = forecasts.map((f, index) => {
      const futureDate = new Date(lastDate);
      futureDate.setMonth(futureDate.getMonth() + index + 1);
      
      const month = futureDate.toLocaleString('default', { month: 'long' });
      const year = futureDate.getFullYear();

      return {
        label: `${month.slice(0, 3)} ${year}`,
        actual: null,
        forecast: f.forecast,
        upper: showConfidenceInterval ? f.upper : null,
        lower: showConfidenceInterval ? f.lower : null,
        type: 'forecast' as const,
      };
    });

    return {
      chartData: [...historicalChartData, ...forecastChartData],
      metrics,
    };
  }, [historicalData, forecastPeriods, showConfidenceInterval]);

  const formatValue = (value: number) => {
    return `$${(value / 1000000).toFixed(2)}M`;
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload) return null;

    const data = payload[0]?.payload;
    if (!data) return null;

    return (
      <div className="bg-background border border-border rounded-lg shadow-lg p-4">
        <p className="font-semibold mb-2">{label}</p>
        <div className="space-y-1 text-sm">
          {data.actual !== null && (
            <div className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'hsl(var(--chart-1))' }} />
                Actual:
              </span>
              <span className="font-medium">{formatValue(data.actual)}</span>
            </div>
          )}
          {data.forecast !== null && (
            <>
              <div className="flex items-center justify-between gap-4">
                <span className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'hsl(var(--chart-2))' }} />
                  Forecast:
                </span>
                <span className="font-medium">{formatValue(data.forecast)}</span>
              </div>
              {showConfidenceInterval && data.upper !== null && (
                <div className="flex items-center justify-between gap-4 text-xs text-muted-foreground">
                  <span>95% CI:</span>
                  <span>{formatValue(data.lower)} - {formatValue(data.upper)}</span>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    );
  };

  const TrendIcon = metrics.trend === 'up' ? TrendingUp : metrics.trend === 'down' ? TrendingDown : Minus;
  const trendColor = metrics.trend === 'up' ? 'text-success' : metrics.trend === 'down' ? 'text-destructive' : 'text-muted-foreground';

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              {title}
            </CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </div>
          <div className="flex gap-2">
            <Button
              variant={forecastPeriods === 3 ? 'default' : 'outline'}
              size="sm"
              onClick={() => setForecastPeriods(3)}
            >
              3M
            </Button>
            <Button
              variant={forecastPeriods === 6 ? 'default' : 'outline'}
              size="sm"
              onClick={() => setForecastPeriods(6)}
            >
              6M
            </Button>
            <Button
              variant={forecastPeriods === 12 ? 'default' : 'outline'}
              size="sm"
              onClick={() => setForecastPeriods(12)}
            >
              12M
            </Button>
          </div>
        </div>

        {/* Forecast Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Projected Total</p>
            <p className="text-lg font-semibold">{formatValue(metrics.projectedTotal)}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Avg Monthly</p>
            <p className="text-lg font-semibold">{formatValue(metrics.avgMonthly)}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Confidence</p>
            <div className="flex items-center gap-2">
              <p className="text-lg font-semibold">{metrics.confidenceLevel.toFixed(0)}%</p>
              <Badge variant={metrics.confidenceLevel > 70 ? 'default' : 'secondary'} className="text-xs">
                {metrics.confidenceLevel > 70 ? 'High' : metrics.confidenceLevel > 40 ? 'Medium' : 'Low'}
              </Badge>
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Trend</p>
            <div className={`flex items-center gap-2 ${trendColor}`}>
              <TrendIcon className="w-5 h-5" />
              <p className="text-lg font-semibold capitalize">{metrics.trend}</p>
            </div>
          </div>
        </div>

        <div className="flex gap-2 mt-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowConfidenceInterval(!showConfidenceInterval)}
          >
            {showConfidenceInterval ? 'Hide' : 'Show'} Confidence Interval
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <ComposedChart data={chartData}>
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

            {/* Confidence Interval Area */}
            {showConfidenceInterval && (
              <Area
                type="monotone"
                dataKey="upper"
                stroke="none"
                fill="hsl(var(--chart-2))"
                fillOpacity={0.1}
                name="Upper CI"
                legendType="none"
              />
            )}
            {showConfidenceInterval && (
              <Area
                type="monotone"
                dataKey="lower"
                stroke="none"
                fill="hsl(var(--chart-2))"
                fillOpacity={0.1}
                name="Lower CI"
                legendType="none"
              />
            )}

            {/* Actual Revenue Line */}
            <Line
              type="monotone"
              dataKey="actual"
              stroke="hsl(var(--chart-1))"
              strokeWidth={2}
              name="Actual Revenue"
              dot={{ fill: "hsl(var(--chart-1))", r: 4 }}
              connectNulls={false}
            />

            {/* Forecast Line */}
            <Line
              type="monotone"
              dataKey="forecast"
              stroke="hsl(var(--chart-2))"
              strokeWidth={2}
              strokeDasharray="5 5"
              name="Forecast"
              dot={{ fill: "hsl(var(--chart-2))", r: 4 }}
              connectNulls={false}
            />

            {/* Separator between historical and forecast */}
            <ReferenceLine
              x={chartData.findIndex(d => d.type === 'forecast') - 0.5}
              stroke="hsl(var(--border))"
              strokeDasharray="3 3"
            />
          </ComposedChart>
        </ResponsiveContainer>

        <div className="mt-4 p-4 bg-muted rounded-lg space-y-2">
          <p className="text-sm font-semibold">Forecast Methodology</p>
          <p className="text-xs text-muted-foreground">
            This forecast uses a hybrid approach combining Simple Moving Average (30%), 
            Exponential Smoothing (40%), and Linear Regression (30%) to predict future revenue. 
            The confidence interval represents a 95% probability range based on historical variance.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

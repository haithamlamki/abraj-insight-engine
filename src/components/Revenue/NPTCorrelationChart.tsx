import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Label } from "recharts";
import { Activity, TrendingDown, TrendingUp, Minus } from "lucide-react";
import { NPTCorrelation } from "@/hooks/useRevenueAnalytics";

interface NPTCorrelationChartProps {
  data: NPTCorrelation[];
  correlationCoefficient: number;
  title?: string;
  description?: string;
  onRigClick?: (rig: string) => void;
}

export const NPTCorrelationChart = ({
  data,
  correlationCoefficient,
  title = "NPT Impact Analysis",
  description = "Correlation between NPT and revenue variance",
  onRigClick
}: NPTCorrelationChartProps) => {
  const formatValue = (value: number) => {
    return `$${(value / 1000000).toFixed(2)}M`;
  };

  const formatNPT = (value: number) => {
    return `$${value.toLocaleString()}`;
  };

  const getCorrelationStrength = () => {
    const abs = Math.abs(correlationCoefficient);
    if (abs > 0.7) return { label: "Strong", color: "text-destructive" };
    if (abs > 0.4) return { label: "Moderate", color: "text-warning" };
    if (abs > 0.2) return { label: "Weak", color: "text-muted-foreground" };
    return { label: "Very Weak", color: "text-muted-foreground" };
  };

  const getCorrelationDirection = () => {
    if (correlationCoefficient > 0.1) return { icon: TrendingDown, label: "Negative impact on variance" };
    if (correlationCoefficient < -0.1) return { icon: TrendingUp, label: "Positive correlation" };
    return { icon: Minus, label: "No significant correlation" };
  };

  const strength = getCorrelationStrength();
  const direction = getCorrelationDirection();
  const DirectionIcon = direction.icon;

  // Calculate linear regression line
  const calculateTrendLine = () => {
    if (data.length === 0) return [];

    const n = data.length;
    const sumX = data.reduce((sum, point) => sum + point.nptTotal, 0);
    const sumY = data.reduce((sum, point) => sum + point.variance, 0);
    const sumXY = data.reduce((sum, point) => sum + point.nptTotal * point.variance, 0);
    const sumX2 = data.reduce((sum, point) => sum + point.nptTotal * point.nptTotal, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    const minX = Math.min(...data.map(d => d.nptTotal));
    const maxX = Math.max(...data.map(d => d.nptTotal));

    return [
      { nptTotal: minX, variance: slope * minX + intercept },
      { nptTotal: maxX, variance: slope * maxX + intercept }
    ];
  };

  const trendLine = calculateTrendLine();

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload[0]) return null;

    const point = payload[0].payload;

    return (
      <div className="bg-background border border-border rounded-lg shadow-lg p-4">
        <p className="font-semibold mb-2">Rig {point.rig}</p>
        <div className="space-y-1 text-sm">
          <div className="flex items-center justify-between gap-4">
            <span>Total NPT:</span>
            <span className="font-medium">{formatNPT(point.nptTotal)}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span>Revenue Variance:</span>
            <span className={`font-medium ${point.variance >= 0 ? 'text-success' : 'text-destructive'}`}>
              {formatValue(point.variance)}
            </span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span>Actual Revenue:</span>
            <span className="font-medium">{formatValue(point.revenueActual)}</span>
          </div>
        </div>
        {onRigClick && (
          <p className="text-xs text-muted-foreground mt-2 pt-2 border-t">
            Click to filter by this rig
          </p>
        )}
      </div>
    );
  };

  const CustomShape = (props: any) => {
    const { cx, cy, payload } = props;
    
    return (
      <circle
        cx={cx}
        cy={cy}
        r={6}
        fill={payload.variance >= 0 ? 'hsl(var(--success))' : 'hsl(var(--destructive))'}
        fillOpacity={0.7}
        stroke={payload.variance >= 0 ? 'hsl(var(--success))' : 'hsl(var(--destructive))'}
        strokeWidth={2}
        className={onRigClick ? "cursor-pointer hover:opacity-100" : ""}
      />
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              {title}
            </CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </div>
          <div className="text-right">
            <div className="flex items-center gap-2">
              <DirectionIcon className={`w-4 h-4 ${strength.color}`} />
              <span className={`text-sm font-medium ${strength.color}`}>
                R² = {correlationCoefficient.toFixed(3)}
              </span>
            </div>
            <p className={`text-xs ${strength.color}`}>
              {strength.label} {direction.label.toLowerCase()}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <ScatterChart margin={{ top: 20, right: 30, bottom: 40, left: 60 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              type="number"
              dataKey="nptTotal"
              name="Total NPT"
              className="text-xs"
              tick={{ fill: "hsl(var(--muted-foreground))" }}
              tickFormatter={formatNPT}
            >
              <Label value="Total NPT ($)" offset={-20} position="insideBottom" className="fill-muted-foreground" />
            </XAxis>
            <YAxis
              type="number"
              dataKey="variance"
              name="Variance"
              className="text-xs"
              tick={{ fill: "hsl(var(--muted-foreground))" }}
              tickFormatter={formatValue}
            >
              <Label value="Revenue Variance" angle={-90} position="insideLeft" className="fill-muted-foreground" />
            </YAxis>
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine y={0} stroke="hsl(var(--border))" strokeDasharray="3 3" />
            
            {/* Trend line */}
            {trendLine.length > 0 && (
              <Scatter
                data={trendLine}
                line
                lineType="fitting"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                strokeDasharray="5 5"
                fill="none"
                legendType="none"
              />
            )}
            
            {/* Data points */}
            <Scatter
              data={data}
              shape={<CustomShape />}
              onClick={(data) => onRigClick && onRigClick(data.rig)}
            />
          </ScatterChart>
        </ResponsiveContainer>
        
        <div className="mt-4 p-4 bg-muted rounded-lg">
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold">Interpretation:</span> {correlationCoefficient < -0.2 
              ? "Higher NPT tends to correlate with lower revenue variance (negative impact)."
              : correlationCoefficient > 0.2
              ? "Higher NPT shows positive correlation with variance."
              : "NPT shows minimal correlation with revenue variance."
            }
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

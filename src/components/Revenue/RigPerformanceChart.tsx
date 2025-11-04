import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { ArrowUpDown } from "lucide-react";
import { RigPerformance } from "@/hooks/useRevenueAnalytics";

interface RigPerformanceChartProps {
  data: RigPerformance[];
  title?: string;
  description?: string;
  onRigClick?: (rig: string) => void;
}

export const RigPerformanceChart = ({
  data,
  title = "Rig Performance Analysis",
  description = "Variance by rig",
  onRigClick
}: RigPerformanceChartProps) => {
  const [showAll, setShowAll] = useState(false);
  const [sortBy, setSortBy] = useState<'variance' | 'percentage'>('variance');

  const sortedData = [...data].sort((a, b) => {
    if (sortBy === 'variance') {
      return b.variance - a.variance;
    }
    return b.variancePct - a.variancePct;
  });

  const displayData = showAll ? sortedData : sortedData.slice(0, 10);

  const formatValue = (value: number) => {
    return `$${(value / 1000000).toFixed(2)}M`;
  };

  const getBarColor = (variance: number) => {
    if (variance > 0) return 'hsl(var(--success))';
    if (variance < 0) return 'hsl(var(--destructive))';
    return 'hsl(var(--muted-foreground))';
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload[0]) return null;

    const data = payload[0].payload;

    return (
      <div className="bg-background border border-border rounded-lg shadow-lg p-4">
        <p className="font-semibold mb-2">Rig {data.rig}</p>
        <div className="space-y-1 text-sm">
          <div className="flex items-center justify-between gap-4">
            <span>Total Actual:</span>
            <span className="font-medium">{formatValue(data.totalActual)}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span>Total Budget:</span>
            <span className="font-medium">{formatValue(data.totalBudget)}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span>Variance:</span>
            <span className={`font-medium ${data.variance >= 0 ? 'text-success' : 'text-destructive'}`}>
              {formatValue(data.variance)} ({data.variancePct.toFixed(1)}%)
            </span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span>Avg Dayrate:</span>
            <span className="font-medium">${data.avgDayrate.toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span>Records:</span>
            <span className="font-medium">{data.count}</span>
          </div>
        </div>
        {onRigClick && (
          <p className="text-xs text-muted-foreground mt-2 pt-2 border-t">
            Click to drill down
          </p>
        )}
      </div>
    );
  };

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
              variant="outline"
              size="sm"
              onClick={() => setSortBy(sortBy === 'variance' ? 'percentage' : 'variance')}
            >
              <ArrowUpDown className="w-4 h-4 mr-2" />
              {sortBy === 'variance' ? 'Amount' : 'Percent'}
            </Button>
            {data.length > 10 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAll(!showAll)}
              >
                {showAll ? 'Top 10' : `All ${data.length}`}
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={Math.max(300, displayData.length * 40)}>
          <BarChart
            data={displayData}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 60, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={false} />
            <XAxis
              type="number"
              className="text-xs"
              tick={{ fill: "hsl(var(--muted-foreground))" }}
              tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`}
            />
            <YAxis
              type="category"
              dataKey="rig"
              className="text-xs"
              tick={{ fill: "hsl(var(--muted-foreground))" }}
              width={50}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar
              dataKey="variance"
              name="Variance"
              radius={[0, 4, 4, 0]}
              onClick={(data: any) => {
                if (onRigClick && data && data.rig) {
                  onRigClick(data.rig);
                }
              }}
              className={onRigClick ? "cursor-pointer" : ""}
            >
              {displayData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={getBarColor(entry.variance)}
                  onClick={() => onRigClick && onRigClick(entry.rig)}
                  className={onRigClick ? "cursor-pointer" : ""}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

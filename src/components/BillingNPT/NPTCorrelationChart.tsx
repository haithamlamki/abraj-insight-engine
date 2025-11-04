import { Card } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, ResponsiveContainer, ReferenceLine } from "recharts";

interface NPTCorrelationChartProps {
  data: Array<{
    rig: string;
    yearMonth: string;
    operationalRate: number;
    totalNPT: number;
    totalHours: number;
  }>;
}

export const NPTCorrelationChart = ({ data }: NPTCorrelationChartProps) => {
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

  // Calculate average lines
  const avgOprRate = data.length > 0 
    ? data.reduce((sum, d) => sum + d.operationalRate, 0) / data.length 
    : 0;
  const avgNPT = data.length > 0 
    ? data.reduce((sum, d) => sum + d.totalNPT, 0) / data.length 
    : 0;

  return (
    <Card className="p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold">NPT vs Operational Rate Correlation</h3>
        <p className="text-sm text-muted-foreground">Relationship between efficiency and downtime</p>
      </div>

      <ChartContainer config={chartConfig} className="h-[350px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              type="number"
              dataKey="operationalRate"
              name="Operational Rate %"
              className="text-xs"
              label={{ value: 'Operational Rate %', position: 'insideBottom', offset: -5 }}
            />
            <YAxis 
              type="number"
              dataKey="totalNPT"
              name="Total NPT Hours"
              className="text-xs"
              label={{ value: 'Total NPT Hours', angle: -90, position: 'insideLeft' }}
            />
            <ChartTooltip 
              content={<ChartTooltipContent />}
              formatter={(value: any, name: string, props: any) => {
                return [
                  <>
                    <div>Rig: {props.payload.rig}</div>
                    <div>Period: {props.payload.yearMonth}</div>
                    <div>Operational Rate: {props.payload.operationalRate}%</div>
                    <div>Total NPT: {props.payload.totalNPT} hrs</div>
                  </>,
                  ''
                ];
              }}
            />
            <ReferenceLine 
              x={avgOprRate} 
              stroke="hsl(var(--muted-foreground))" 
              strokeDasharray="3 3"
              label={{ value: 'Avg', position: 'top' }}
            />
            <ReferenceLine 
              y={avgNPT} 
              stroke="hsl(var(--muted-foreground))" 
              strokeDasharray="3 3"
              label={{ value: 'Avg', position: 'right' }}
            />
            <Scatter
              data={data}
              fill="hsl(var(--chart-1))"
              fillOpacity={0.6}
            />
          </ScatterChart>
        </ResponsiveContainer>
      </ChartContainer>

      <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
        <div className="p-3 rounded-lg bg-muted">
          <div className="font-semibold">High Efficiency / Low NPT</div>
          <div className="text-muted-foreground">Optimal performance</div>
        </div>
        <div className="p-3 rounded-lg bg-muted">
          <div className="font-semibold">Low Efficiency / High NPT</div>
          <div className="text-muted-foreground">Requires attention</div>
        </div>
      </div>
    </Card>
  );
};

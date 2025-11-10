import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface HourBreakdownChartProps {
  data: any[];
  title: string;
  description?: string;
  xAxisKey: string;
  onBarClick?: (key: string) => void;
}

export const HourBreakdownChart = ({
  data,
  title,
  description,
  xAxisKey,
  onBarClick
}: HourBreakdownChartProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey={xAxisKey}
              className="text-xs"
              tick={{ fill: "hsl(var(--muted-foreground))" }}
            />
            <YAxis
              className="text-xs"
              tick={{ fill: "hsl(var(--muted-foreground))" }}
              label={{ value: 'Hours', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--background))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "var(--radius)",
              }}
            />
            <Legend />
            <Bar 
              dataKey="oprRate" 
              stackId="a" 
              fill="hsl(142, 76%, 36%)" 
              name="Operational"
              onClick={(data) => onBarClick && onBarClick(data[xAxisKey])}
              className="cursor-pointer"
            />
            <Bar 
              dataKey="reduceRate" 
              stackId="a" 
              fill="hsl(47, 96%, 53%)" 
              name="Reduced"
              onClick={(data) => onBarClick && onBarClick(data[xAxisKey])}
              className="cursor-pointer"
            />
            <Bar 
              dataKey="repairRate" 
              stackId="a" 
              fill="hsl(0, 84%, 60%)" 
              name="Repair NPT"
              onClick={(data) => onBarClick && onBarClick(data[xAxisKey])}
              className="cursor-pointer"
            />
            <Bar 
              dataKey="zeroRate" 
              stackId="a" 
              fill="hsl(221, 83%, 53%)" 
              name="Zero NPT"
              onClick={(data) => onBarClick && onBarClick(data[xAxisKey])}
              className="cursor-pointer"
            />
            <Bar 
              dataKey="specialRate" 
              stackId="a" 
              fill="hsl(280, 65%, 60%)" 
              name="Special"
              onClick={(data) => onBarClick && onBarClick(data[xAxisKey])}
              className="cursor-pointer"
            />
            <Bar 
              dataKey="rigMove" 
              stackId="a" 
              fill="hsl(33, 100%, 50%)" 
              name="Rig Move"
              onClick={(data) => onBarClick && onBarClick(data[xAxisKey])}
              className="cursor-pointer"
            />
            <Bar 
              dataKey="aMaint" 
              stackId="a" 
              fill="hsl(210, 40%, 70%)" 
              name="A.Maint"
              onClick={(data) => onBarClick && onBarClick(data[xAxisKey])}
              className="cursor-pointer"
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

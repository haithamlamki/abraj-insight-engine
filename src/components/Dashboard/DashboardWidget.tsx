import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { KPICard } from "./KPICard";
import { ChartCard } from "./ChartCard";
import { useReportData } from "@/hooks/useReportData";
import { useKPIData } from "@/hooks/useKPIData";
import { useChartData } from "@/hooks/useChartData";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Loader2 } from "lucide-react";
import { DashboardWidget as WidgetConfig } from "@/hooks/useDashboards";

interface DashboardWidgetProps {
  widget: WidgetConfig;
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))'];

export const DashboardWidget = ({ widget }: DashboardWidgetProps) => {
  const { widgetType, config } = widget;
  const { data, isLoading } = useReportData(config.reportType || "");
  const { kpis } = useKPIData(config.reportType || "");
  const { chartData } = useChartData(config.reportType || "");

  if (isLoading) {
    return (
      <Card className="h-full flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </Card>
    );
  }

  // KPI Widget
  if (widgetType === "kpi") {
    const metric = config.metric;
    const value = kpis?.[metric as keyof typeof kpis];
    
    return (
      <KPICard
        title={config.label || metric}
        value={typeof value === 'number' ? value.toLocaleString() : String(value || 0)}
        trend="neutral"
      />
    );
  }

  // Line Chart Widget
  if (widgetType === "line-chart") {
    return (
      <ChartCard title={config.title || "Trend"}>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="month" 
              className="text-xs"
              tick={{ fill: "hsl(var(--muted-foreground))" }}
            />
            <YAxis 
              className="text-xs"
              tick={{ fill: "hsl(var(--muted-foreground))" }}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: "hsl(var(--background))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "var(--radius)",
              }}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey={config.metric} 
              stroke="hsl(var(--primary))" 
              strokeWidth={2}
              dot={{ fill: "hsl(var(--primary))" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>
    );
  }

  // Bar Chart Widget
  if (widgetType === "bar-chart") {
    return (
      <ChartCard title={config.title || "Comparison"}>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="month" 
              className="text-xs"
              tick={{ fill: "hsl(var(--muted-foreground))" }}
            />
            <YAxis 
              className="text-xs"
              tick={{ fill: "hsl(var(--muted-foreground))" }}
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
              dataKey={config.metric} 
              fill="hsl(var(--primary))"
            />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    );
  }

  // Pie Chart Widget
  if (widgetType === "pie-chart") {
    const pieData = chartData.slice(0, 4).map((item: any, index: number) => ({
      name: item.month || `Item ${index + 1}`,
      value: Number(item[config.metric]) || 0
    }));

    return (
      <ChartCard title={config.title || "Distribution"}>
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }: any) => `${name}: ${(Number(percent) * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="hsl(var(--primary))"
              dataKey="value"
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </ChartCard>
    );
  }

  // Table Widget
  if (widgetType === "table") {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="text-lg">{config.title || "Data Table"}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-auto max-h-[200px]">
            <table className="w-full text-sm">
              <thead className="bg-muted">
                <tr>
                  {Object.keys(data?.[0] || {}).slice(0, 3).map((key) => (
                    <th key={key} className="p-2 text-left">{key}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data?.slice(0, 5).map((row: any, i: number) => (
                  <tr key={i} className="border-b border-border">
                    {Object.values(row).slice(0, 3).map((val: any, j: number) => (
                      <td key={j} className="p-2">{String(val)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
};

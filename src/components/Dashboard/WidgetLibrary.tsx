import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart3, LineChart as LineChartIcon, PieChart as PieChartIcon, Table2, TrendingUp, Filter } from "lucide-react";
import { DashboardWidget } from "@/hooks/useDashboards";

interface WidgetLibraryProps {
  onAddWidget: (widget: Partial<DashboardWidget>) => void;
}

const WIDGET_TEMPLATES = [
  {
    icon: TrendingUp,
    type: "kpi",
    title: "KPI Card",
    description: "Display a single metric value",
    config: { metric: "revenue_actual", label: "Revenue", reportType: "revenue" }
  },
  {
    icon: LineChartIcon,
    type: "line-chart",
    title: "Line Chart",
    description: "Show trends over time",
    config: { metric: "revenue_actual", title: "Revenue Trend", reportType: "revenue" }
  },
  {
    icon: BarChart3,
    type: "bar-chart",
    title: "Bar Chart",
    description: "Compare values across categories",
    config: { metric: "npt_hours", title: "NPT by Month", reportType: "billing_npt" }
  },
  {
    icon: PieChartIcon,
    type: "pie-chart",
    title: "Pie Chart",
    description: "Show distribution breakdown",
    config: { metric: "fuel_cost", title: "Cost Distribution", reportType: "fuel_consumption" }
  },
  {
    icon: Table2,
    type: "table",
    title: "Data Table",
    description: "Display detailed records",
    config: { title: "Recent Data", reportType: "revenue" }
  },
];

export const WidgetLibrary = ({ onAddWidget }: WidgetLibraryProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Widget Library</CardTitle>
        <CardDescription>Drag or click to add widgets to your dashboard</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          {WIDGET_TEMPLATES.map((template) => (
            <Button
              key={template.type}
              variant="outline"
              className="h-auto flex flex-col items-start p-4 hover:bg-accent"
              onClick={() => onAddWidget({
                i: `widget-${Date.now()}`,
                x: 0,
                y: 0,
                w: 3,
                h: 2,
                widgetType: template.type as any,
                config: template.config,
              })}
            >
              <template.icon className="w-8 h-8 mb-2 text-primary" />
              <div className="text-left">
                <div className="font-semibold">{template.title}</div>
                <div className="text-xs text-muted-foreground">{template.description}</div>
              </div>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

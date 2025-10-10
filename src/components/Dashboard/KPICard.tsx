import { Card } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus, LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  status?: "success" | "warning" | "error" | "neutral";
  change?: number;
  icon?: LucideIcon;
}

export const KPICard = ({ 
  title, 
  value, 
  subtitle, 
  trend, 
  trendValue,
  status = "neutral",
  icon: Icon
}: KPICardProps) => {
  const getTrendIcon = () => {
    switch (trend) {
      case "up":
        return <TrendingUp className="w-4 h-4" />;
      case "down":
        return <TrendingDown className="w-4 h-4" />;
      default:
        return <Minus className="w-4 h-4" />;
    }
  };

  const getTrendColor = () => {
    if (status === "success") return "text-success";
    if (status === "warning") return "text-warning";
    if (status === "error") return "text-destructive";
    return "text-muted-foreground";
  };

  return (
    <Card className="p-6 hover:shadow-lg transition-all duration-300 border-border bg-card hover-scale">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          {Icon && <Icon className="w-5 h-5 text-muted-foreground" />}
        </div>
        <div className="flex items-baseline justify-between">
          <h3 className="text-3xl font-bold text-foreground">{value}</h3>
          {trend && (
            <div className={cn("flex items-center gap-1 text-sm font-medium", getTrendColor())}>
              {getTrendIcon()}
              {trendValue && <span>{trendValue}</span>}
            </div>
          )}
        </div>
        {subtitle && (
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        )}
      </div>
    </Card>
  );
};

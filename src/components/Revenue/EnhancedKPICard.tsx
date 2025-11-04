import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface EnhancedKPICardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: 'up' | 'down' | 'neutral';
  change?: number;
  subtitle?: string;
  sparklineData?: number[];
  onClick?: () => void;
  className?: string;
}

export const EnhancedKPICard = ({
  title,
  value,
  icon: Icon,
  trend = 'neutral',
  change,
  subtitle,
  sparklineData,
  onClick,
  className,
}: EnhancedKPICardProps) => {
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColor = trend === 'up' ? 'text-success' : trend === 'down' ? 'text-destructive' : 'text-muted-foreground';

  return (
    <Card
      className={cn(
        "transition-all hover:shadow-md",
        onClick && "cursor-pointer hover:border-primary",
        className
      )}
      onClick={onClick}
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground mb-1">
              {title}
            </p>
            <h3 className="text-2xl font-bold mb-2 transition-all">
              {value}
            </h3>
            
            {(change !== undefined || subtitle) && (
              <div className="flex items-center gap-2 text-sm">
                {change !== undefined && (
                  <div className={cn("flex items-center gap-1", trendColor)}>
                    <TrendIcon className="w-4 h-4" />
                    <span className="font-medium">
                      {change > 0 ? '+' : ''}{change.toFixed(1)}%
                    </span>
                  </div>
                )}
                {subtitle && (
                  <span className="text-muted-foreground">{subtitle}</span>
                )}
              </div>
            )}
          </div>
          
          <div className={cn(
            "p-3 rounded-full bg-primary/10",
            onClick && "group-hover:bg-primary/20 transition-colors"
          )}>
            <Icon className="w-5 h-5 text-primary" />
          </div>
        </div>

        {/* Simple Sparkline */}
        {sparklineData && sparklineData.length > 0 && (
          <div className="mt-4 h-8 flex items-end gap-1">
            {sparklineData.slice(-12).map((value, index) => {
              const maxValue = Math.max(...sparklineData);
              const height = (value / maxValue) * 100;
              return (
                <div
                  key={index}
                  className="flex-1 bg-primary/20 rounded-t"
                  style={{ height: `${height}%` }}
                />
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

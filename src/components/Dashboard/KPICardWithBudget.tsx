import { ReactNode } from 'react';
import { Card } from '@/components/ui/card';
import { useBudgetVariance } from '@/hooks/useBudgetVariance';
import { VarianceChip } from '@/components/Budget/VarianceChip';
import { useAuth } from '@/contexts/AuthContext';
import { LucideIcon } from 'lucide-react';

interface KPICardWithBudgetProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  reportKey: string;
  rigCode?: string;
  year: number;
  month?: number;
  metricKey?: string;
  className?: string;
}

export function KPICardWithBudget({
  title,
  value,
  icon: Icon,
  trend,
  reportKey,
  rigCode,
  year,
  month,
  metricKey,
  className = '',
}: KPICardWithBudgetProps) {
  const { isAdmin } = useAuth();
  
  const { data: variance, isLoading: varianceLoading } = useBudgetVariance({
    report_key: reportKey,
    rig_code: rigCode,
    year,
    month,
    metric_key: metricKey,
  });

  return (
    <Card className={`p-6 ${className}`}>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>

        <div className="space-y-2">
          <div className="flex items-baseline justify-between">
            <h3 className="text-3xl font-bold text-foreground">{value}</h3>
            {trend && (
              <span
                className={`text-sm font-medium ${
                  trend.isPositive ? 'text-success' : 'text-destructive'
                }`}
              >
                {trend.isPositive ? '+' : ''}
                {trend.value}%
              </span>
            )}
          </div>

          {variance && !varianceLoading && (
            <div className="space-y-1">
              <VarianceChip
                status={variance.status}
                message={variance.message}
                direction={variance.direction || undefined}
                className="text-xs"
              />
              
              {isAdmin && variance.budget_value !== undefined && (
                <p className="text-xs text-muted-foreground">
                  Target: {variance.currency} {variance.budget_value.toLocaleString()}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

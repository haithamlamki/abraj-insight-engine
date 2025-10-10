import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface VarianceChipProps {
  status: 'good' | 'warning' | 'critical' | 'unknown';
  message: string;
  direction?: 'above' | 'below' | 'on_target';
  showIcon?: boolean;
  className?: string;
}

export const VarianceChip = ({ 
  status, 
  message, 
  direction, 
  showIcon = true,
  className = ''
}: VarianceChipProps) => {
  const colorMap = {
    good: 'bg-success/10 text-success border-success',
    warning: 'bg-warning/10 text-warning border-warning',
    critical: 'bg-destructive/10 text-destructive border-destructive',
    unknown: 'bg-muted text-muted-foreground border-muted'
  };

  const iconMap = {
    above: TrendingUp,
    below: TrendingDown,
    on_target: Minus
  };

  const Icon = direction ? iconMap[direction] : null;

  return (
    <Badge variant="outline" className={`${colorMap[status]} border ${className}`}>
      {showIcon && Icon && <Icon className="w-3 h-3 mr-1" />}
      {message}
    </Badge>
  );
};

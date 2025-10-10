import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle,
  CheckCircle2,
  XCircle
} from "lucide-react";

interface BudgetHealthScoreProps {
  variances: Array<{
    variance_pct: number | null;
    status: string;
    report_key: string;
    metric_key: string;
  }>;
}

export const BudgetHealthScore = ({ variances }: BudgetHealthScoreProps) => {
  const healthMetrics = useMemo(() => {
    if (!variances || variances.length === 0) {
      return {
        score: 0,
        grade: 'F',
        good: 0,
        warning: 0,
        critical: 0,
        avgVariance: 0,
      };
    }

    const good = variances.filter(v => v.status === 'good').length;
    const warning = variances.filter(v => v.status === 'warning').length;
    const critical = variances.filter(v => v.status === 'critical').length;

    // Calculate weighted score (good=100, warning=50, critical=0)
    const score = ((good * 100 + warning * 50) / variances.length);
    
    // Calculate average variance
    const validVariances = variances.filter(v => v.variance_pct !== null);
    const avgVariance = validVariances.length > 0
      ? validVariances.reduce((sum, v) => sum + Math.abs(v.variance_pct!), 0) / validVariances.length
      : 0;

    // Determine grade
    let grade = 'F';
    if (score >= 90) grade = 'A';
    else if (score >= 80) grade = 'B';
    else if (score >= 70) grade = 'C';
    else if (score >= 60) grade = 'D';

    return {
      score: Math.round(score),
      grade,
      good,
      warning,
      critical,
      avgVariance: avgVariance.toFixed(1),
    };
  }, [variances]);

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A': return 'text-success';
      case 'B': return 'text-primary';
      case 'C': return 'text-warning';
      case 'D': return 'text-orange-500';
      case 'F': return 'text-destructive';
      default: return 'text-muted-foreground';
    }
  };

  const getScoreIcon = () => {
    if (healthMetrics.score >= 80) return <CheckCircle2 className="h-8 w-8 text-success" />;
    if (healthMetrics.score >= 60) return <AlertTriangle className="h-8 w-8 text-warning" />;
    return <XCircle className="h-8 w-8 text-destructive" />;
  };

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Budget Health Score</h3>
          {getScoreIcon()}
        </div>

        <div className="space-y-2">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-4xl font-bold">{healthMetrics.score}</p>
              <p className="text-sm text-muted-foreground">out of 100</p>
            </div>
            <div className="text-right">
              <p className={`text-5xl font-bold ${getGradeColor(healthMetrics.grade)}`}>
                {healthMetrics.grade}
              </p>
              <p className="text-sm text-muted-foreground">Grade</p>
            </div>
          </div>
          
          <Progress value={healthMetrics.score} className="h-2" />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-success" />
              <p className="text-sm font-medium">Good</p>
            </div>
            <p className="text-2xl font-bold">{healthMetrics.good}</p>
            <p className="text-xs text-muted-foreground">
              {variances.length > 0 ? ((healthMetrics.good / variances.length) * 100).toFixed(0) : 0}%
            </p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-warning" />
              <p className="text-sm font-medium">Warning</p>
            </div>
            <p className="text-2xl font-bold">{healthMetrics.warning}</p>
            <p className="text-xs text-muted-foreground">
              {variances.length > 0 ? ((healthMetrics.warning / variances.length) * 100).toFixed(0) : 0}%
            </p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-destructive" />
              <p className="text-sm font-medium">Critical</p>
            </div>
            <p className="text-2xl font-bold">{healthMetrics.critical}</p>
            <p className="text-xs text-muted-foreground">
              {variances.length > 0 ? ((healthMetrics.critical / variances.length) * 100).toFixed(0) : 0}%
            </p>
          </div>
        </div>

        <div className="pt-4 border-t">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Avg. Variance</span>
            <span className="font-medium">{healthMetrics.avgVariance}%</span>
          </div>
        </div>
      </div>
    </Card>
  );
};

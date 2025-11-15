import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import {
  ArrowRight,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle2,
  Info,
  Copy
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface BudgetComparisonViewProps {
  reportType: string;
  rigCode?: string;
  recommendedValues: Record<string, number>;
  varianceThreshold: number;
}

export function BudgetComparisonView({ 
  reportType, 
  rigCode, 
  recommendedValues,
  varianceThreshold 
}: BudgetComparisonViewProps) {
  
  // Fetch current budget values
  const { data: currentBudget, isLoading } = useQuery({
    queryKey: ['current-budget', reportType, rigCode],
    queryFn: async () => {
      // Get the latest budget version
      const { data: latestVersion } = await supabase
        .from('budget_version')
        .select('id')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (!latestVersion) return null;

      // Get report ID
      const { data: report } = await supabase
        .from('dim_report')
        .select('id')
        .eq('report_key', reportType)
        .single();

      if (!report) return null;

      // Get rig ID if specified
      let rigId = null;
      if (rigCode) {
        const { data: rig } = await supabase
          .from('dim_rig')
          .select('id')
          .eq('rig_code', rigCode)
          .single();
        rigId = rig?.id;
      }

      // Fetch budget data with metric details
      const query = supabase
        .from('fact_budget')
        .select(`
          budget_value,
          year,
          month,
          dim_metric (
            metric_key,
            display_name,
            unit,
            format
          )
        `)
        .eq('version_id', latestVersion.id)
        .eq('report_id', report.id)
        .eq('year', new Date().getFullYear());

      if (rigId) {
        query.eq('rig_id', rigId);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Aggregate by metric
      const aggregated: Record<string, { total: number; count: number; unit?: string; format?: string; displayName?: string }> = {};
      
      data?.forEach((item: any) => {
        const key = item.dim_metric.metric_key;
        if (!aggregated[key]) {
          aggregated[key] = { 
            total: 0, 
            count: 0,
            unit: item.dim_metric.unit,
            format: item.dim_metric.format,
            displayName: item.dim_metric.display_name
          };
        }
        aggregated[key].total += item.budget_value;
        aggregated[key].count += 1;
      });

      // Calculate averages
      const result: Record<string, { value: number; unit?: string; format?: string; displayName?: string }> = {};
      Object.entries(aggregated).forEach(([key, data]) => {
        result[key] = {
          value: data.total / data.count,
          unit: data.unit,
          format: data.format,
          displayName: data.displayName
        };
      });

      return result;
    },
  });

  const calculateVariance = (current: number, recommended: number) => {
    if (current === 0) return recommended > 0 ? 100 : 0;
    return ((recommended - current) / current) * 100;
  };

  const getVarianceColor = (variance: number) => {
    const absVariance = Math.abs(variance);
    if (absVariance > varianceThreshold * 2) return 'text-red-600';
    if (absVariance > varianceThreshold) return 'text-orange-600';
    if (absVariance > varianceThreshold / 2) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getVarianceBadgeVariant = (variance: number) => {
    const absVariance = Math.abs(variance);
    if (absVariance > varianceThreshold * 2) return 'destructive';
    if (absVariance > varianceThreshold) return 'default';
    return 'secondary';
  };

  const formatValue = (value: number, format?: string) => {
    if (format === 'currency') return `OMR ${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    if (format === 'percentage') return `${value.toFixed(1)}%`;
    return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
  };

  const calculateImpact = () => {
    if (!currentBudget) return null;

    let totalIncrease = 0;
    let totalDecrease = 0;
    let significantChanges = 0;

    Object.entries(recommendedValues).forEach(([key, recommended]) => {
      const current = currentBudget[key]?.value || 0;
      const diff = recommended - current;
      
      if (diff > 0) totalIncrease += diff;
      if (diff < 0) totalDecrease += Math.abs(diff);
      
      const variance = calculateVariance(current, recommended);
      if (Math.abs(variance) > varianceThreshold) significantChanges++;
    });

    return {
      totalIncrease,
      totalDecrease,
      netChange: totalIncrease - totalDecrease,
      significantChanges,
      totalMetrics: Object.keys(recommendedValues).length
    };
  };

  const handleCopyRecommendations = () => {
    const text = Object.entries(recommendedValues)
      .map(([key, value]) => {
        const current = currentBudget?.[key]?.value || 0;
        const variance = calculateVariance(current, value);
        return `${key}: Current ${formatValue(current)}, Recommended ${formatValue(value)}, Change ${variance > 0 ? '+' : ''}${variance.toFixed(1)}%`;
      })
      .join('\n');
    
    navigator.clipboard.writeText(text);
    toast.success('Recommendations copied to clipboard');
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-pulse text-muted-foreground">Loading current budget data...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!currentBudget || Object.keys(currentBudget).length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2 text-muted-foreground">
            <AlertCircle className="h-5 w-5" />
            <p>No current budget data available for comparison. Set up budget values first.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const impact = calculateImpact();

  return (
    <div className="space-y-6">
      {/* Impact Summary */}
      {impact && (
        <Card className="border-primary/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Impact Analysis</CardTitle>
              <Button variant="outline" size="sm" onClick={handleCopyRecommendations}>
                <Copy className="h-4 w-4 mr-2" />
                Copy
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Net Change</p>
                <div className="flex items-center gap-2">
                  {impact.netChange > 0 ? (
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  ) : impact.netChange < 0 ? (
                    <TrendingDown className="h-4 w-4 text-red-600" />
                  ) : (
                    <Info className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className={cn(
                    "text-lg font-bold",
                    impact.netChange > 0 ? "text-green-600" : impact.netChange < 0 ? "text-red-600" : ""
                  )}>
                    {impact.netChange > 0 ? '+' : ''}{formatValue(impact.netChange)}
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Total Increase</p>
                <p className="text-lg font-bold text-green-600">
                  +{formatValue(impact.totalIncrease)}
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Total Decrease</p>
                <p className="text-lg font-bold text-red-600">
                  -{formatValue(impact.totalDecrease)}
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Significant Changes</p>
                <p className="text-lg font-bold">
                  {impact.significantChanges} / {impact.totalMetrics}
                </p>
              </div>
            </div>

            {impact.significantChanges > 0 && (
              <div className="flex items-start gap-2 p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg">
                <AlertCircle className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-orange-900 dark:text-orange-200">
                  {impact.significantChanges} metric{impact.significantChanges > 1 ? 's have' : ' has'} variance exceeding the {varianceThreshold}% threshold. Review carefully before applying.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Detailed Comparison */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Detailed Comparison</CardTitle>
          <CardDescription>
            Current budget values vs AI recommendations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries(recommendedValues).map(([metricKey, recommendedValue]) => {
            const currentData = currentBudget[metricKey];
            const currentValue = currentData?.value || 0;
            const variance = calculateVariance(currentValue, recommendedValue);
            const absVariance = Math.abs(variance);
            
            return (
              <div key={metricKey} className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <h4 className="font-semibold capitalize">
                      {currentData?.displayName || metricKey.replace(/_/g, ' ')}
                    </h4>
                    {currentData?.unit && (
                      <p className="text-xs text-muted-foreground">Unit: {currentData.unit}</p>
                    )}
                  </div>
                  <Badge variant={getVarianceBadgeVariant(variance)}>
                    {variance > 0 ? '+' : ''}{variance.toFixed(1)}% change
                  </Badge>
                </div>

                <div className="grid grid-cols-3 gap-4 items-center">
                  {/* Current Value */}
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Current</p>
                    <p className="text-lg font-bold">
                      {formatValue(currentValue, currentData?.format)}
                    </p>
                  </div>

                  {/* Arrow */}
                  <div className="flex justify-center">
                    <ArrowRight className={cn("h-5 w-5", getVarianceColor(variance))} />
                  </div>

                  {/* Recommended Value */}
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Recommended</p>
                    <p className={cn("text-lg font-bold", getVarianceColor(variance))}>
                      {formatValue(recommendedValue, currentData?.format)}
                    </p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Variance Level</span>
                    <span>{absVariance.toFixed(1)}% / {varianceThreshold}% threshold</span>
                  </div>
                  <Progress 
                    value={Math.min((absVariance / (varianceThreshold * 2)) * 100, 100)} 
                    className="h-2"
                  />
                </div>

                {/* Change Impact */}
                <div className="flex items-center gap-2 text-sm">
                  {absVariance > varianceThreshold * 2 ? (
                    <>
                      <AlertCircle className="h-4 w-4 text-red-600" />
                      <span className="text-red-600">Critical change - requires review</span>
                    </>
                  ) : absVariance > varianceThreshold ? (
                    <>
                      <AlertCircle className="h-4 w-4 text-orange-600" />
                      <span className="text-orange-600">Significant change - consider carefully</span>
                    </>
                  ) : absVariance > varianceThreshold / 2 ? (
                    <>
                      <Info className="h-4 w-4 text-yellow-600" />
                      <span className="text-yellow-600">Moderate change - review recommended</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span className="text-green-600">Minor change - within acceptable range</span>
                    </>
                  )}
                </div>

                <Separator />
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}

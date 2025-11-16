import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { FileText, Calendar, DollarSign, TrendingUp } from "lucide-react";
import { format } from "date-fns";

interface AllReportsBudgetViewProps {
  versionId: string;
}

export function AllReportsBudgetView({ versionId }: AllReportsBudgetViewProps) {
  const { data: reportsData, isLoading } = useQuery({
    queryKey: ["all-reports-budget", versionId],
    queryFn: async () => {
      // Fetch all active reports
      const { data: reports, error: reportsError } = await supabase
        .from("dim_report")
        .select("*")
        .eq("active", true)
        .order("sort_order");

      if (reportsError) throw reportsError;
      if (!reports) return [];

      // Fetch budget data for all reports
      const reportsWithBudgets = await Promise.all(
        reports.map(async (report) => {
          // Get latest budget data for this report
          const { data: budgetData, error: budgetError } = await supabase
            .from("fact_budget")
            .select(`
              *,
              rig:dim_rig!inner(rig_code, rig_name),
              metric:dim_metric!inner(metric_key, display_name, unit, format)
            `)
            .eq("version_id", versionId)
            .eq("report_id", report.id)
            .eq("year", 2025)
            .order("updated_at", { ascending: false });

          if (budgetError) throw budgetError;

          // Calculate totals by rig and metric
          const totalBudget = budgetData?.reduce((sum, item: any) => sum + item.budget_value, 0) || 0;
          const lastUpdated = budgetData?.[0]?.updated_at || budgetData?.[0]?.created_at;
          const budgetCount = budgetData?.length || 0;

          // Group by rig for summary
          const rigSummary = budgetData?.reduce((acc: any, item: any) => {
            const rigName = item.rig.rig_name;
            if (!acc[rigName]) {
              acc[rigName] = { total: 0, count: 0 };
            }
            acc[rigName].total += item.budget_value;
            acc[rigName].count += 1;
            return acc;
          }, {});

          return {
            ...report,
            totalBudget,
            lastUpdated,
            budgetCount,
            currency: budgetData?.[0]?.currency || "OMR",
            rigCount: Object.keys(rigSummary || {}).length,
            rigSummary: Object.entries(rigSummary || {})
              .map(([rig, data]: [string, any]) => ({ rig, ...data }))
              .sort((a, b) => b.total - a.total)
              .slice(0, 3), // Top 3 rigs
          };
        })
      );

      return reportsWithBudgets;
    },
    enabled: !!versionId,
  });

  const formatCurrency = (value: number, currency: string = "OMR") => {
    return `${value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })} ${currency}`;
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Skeleton key={i} className="h-64 w-full" />
        ))}
      </div>
    );
  }

  if (!reportsData || reportsData.length === 0) {
    return (
      <Card className="p-12 text-center">
        <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground">لا توجد تقارير متاحة</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reportsData.map((report) => (
          <Card key={report.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg">{report.display_name}</CardTitle>
                  <CardDescription className="flex items-center gap-2">
                    <Badge variant="outline">{report.department}</Badge>
                  </CardDescription>
                </div>
                <FileText className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Total Budget */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <DollarSign className="h-4 w-4" />
                    <span>إجمالي الميزانية</span>
                  </div>
                </div>
                <div className="text-2xl font-bold">
                  {report.totalBudget > 0 
                    ? formatCurrency(report.totalBudget, report.currency)
                    : <span className="text-muted-foreground">لا توجد بيانات</span>
                  }
                </div>
              </div>

              {/* Statistics */}
              {report.budgetCount > 0 && (
                <div className="grid grid-cols-2 gap-4 pt-3 border-t">
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground">عدد السجلات</div>
                    <div className="text-lg font-semibold">{report.budgetCount}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground">عدد الحفارات</div>
                    <div className="text-lg font-semibold">{report.rigCount}</div>
                  </div>
                </div>
              )}

              {/* Top Rigs */}
              {report.rigSummary && report.rigSummary.length > 0 && (
                <div className="space-y-2 pt-3 border-t">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <TrendingUp className="h-3 w-3" />
                    <span>أعلى الحفارات</span>
                  </div>
                  <div className="space-y-1">
                    {report.rigSummary.map((rig: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between text-sm">
                        <span className="truncate">{rig.rig}</span>
                        <span className="font-medium text-xs">
                          {formatCurrency(rig.total, report.currency)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Last Updated */}
              {report.lastUpdated && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground pt-3 border-t">
                  <Calendar className="h-3 w-3" />
                  <span>آخر تحديث:</span>
                  <span>{format(new Date(report.lastUpdated), "dd/MM/yyyy")}</span>
                </div>
              )}

              {/* No Data State */}
              {report.budgetCount === 0 && (
                <div className="text-center py-4 text-sm text-muted-foreground">
                  لا توجد بيانات ميزانية لهذا التقرير
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Summary Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>ملخص عام</CardTitle>
          <CardDescription>إحصائيات شاملة لجميع التقارير</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">إجمالي التقارير</div>
              <div className="text-3xl font-bold">{reportsData.length}</div>
            </div>
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">إجمالي الميزانية</div>
              <div className="text-3xl font-bold">
                {formatCurrency(
                  reportsData.reduce((sum, r) => sum + r.totalBudget, 0),
                  reportsData[0]?.currency
                )}
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">إجمالي السجلات</div>
              <div className="text-3xl font-bold">
                {reportsData.reduce((sum, r) => sum + r.budgetCount, 0).toLocaleString()}
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">التقارير بدون بيانات</div>
              <div className="text-3xl font-bold">
                {reportsData.filter((r) => r.budgetCount === 0).length}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/Layout/DashboardLayout";
import { BudgetHealthScore } from "@/components/Budget/BudgetHealthScore";
import { VarianceTrendChart } from "@/components/Budget/VarianceTrendChart";
import { VersionComparisonView } from "@/components/Budget/VersionComparisonView";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, TrendingUp, GitCompare } from "lucide-react";

const BudgetAnalytics = () => {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [selectedReport, setSelectedReport] = useState<string>('utilization');

  const { data: reports } = useQuery({
    queryKey: ['dim-report'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dim_report')
        .select('*')
        .eq('active', true)
        .order('sort_order');
      if (error) throw error;
      return data;
    },
  });

  // Fetch all variances for health score
  const { data: variances, isLoading: variancesLoading } = useQuery({
    queryKey: ['budget-variances-all', selectedYear, selectedReport],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('get-budget-variance', {
        body: {
          report_key: selectedReport,
          year: selectedYear,
        }
      });
      
      if (error) throw error;
      
      // This would need to be expanded to fetch all rigs/metrics
      // For now, returning sample data structure
      return [data];
    },
  });

  // Fetch trend data (last 6 months)
  const { data: trendData } = useQuery({
    queryKey: ['budget-trend', selectedYear, selectedReport],
    queryFn: async () => {
      const months = ['January', 'February', 'March', 'April', 'May', 'June'];
      const results = [];

      for (let i = 0; i < 6; i++) {
        const month = i + 1;
        const { data, error } = await supabase.functions.invoke('get-budget-variance', {
          body: {
            report_key: selectedReport,
            year: selectedYear,
            month,
          }
        });

        if (!error && data) {
          results.push({
            month: months[i],
            year: selectedYear,
            variance_pct: data.variance_pct,
            actual: data.actual || 0,
            budget: data.budget_value || 0,
          });
        }
      }

      return results;
    },
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Budget Analytics</h1>
            <p className="text-muted-foreground mt-1">
              Advanced budget analysis and performance insights
            </p>
          </div>
          <div className="flex gap-2">
            <Select value={selectedReport} onValueChange={setSelectedReport}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {reports?.map(r => (
                  <SelectItem key={r.id} value={r.report_key}>
                    {r.display_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 5 }, (_, i) => currentYear - 2 + i).map(y => (
                  <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Tabs defaultValue="health" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="health" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Health Score
            </TabsTrigger>
            <TabsTrigger value="trends" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Trends
            </TabsTrigger>
            <TabsTrigger value="comparison" className="flex items-center gap-2">
              <GitCompare className="h-4 w-4" />
              Comparison
            </TabsTrigger>
          </TabsList>

          <TabsContent value="health" className="space-y-6">
            {variancesLoading ? (
              <Card className="p-12 text-center">
                <p className="text-muted-foreground">Loading health score...</p>
              </Card>
            ) : (
              <>
                <BudgetHealthScore variances={variances || []} />
                
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Key Insights</h3>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="h-2 w-2 rounded-full bg-primary mt-2" />
                      <div>
                        <p className="font-medium">Overall Performance</p>
                        <p className="text-sm text-muted-foreground">
                          Budget health is calculated based on variance from targets across all metrics
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="h-2 w-2 rounded-full bg-primary mt-2" />
                      <div>
                        <p className="font-medium">Grading System</p>
                        <p className="text-sm text-muted-foreground">
                          A: 90-100 | B: 80-89 | C: 70-79 | D: 60-69 | F: Below 60
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="h-2 w-2 rounded-full bg-primary mt-2" />
                      <div>
                        <p className="font-medium">Action Items</p>
                        <p className="text-sm text-muted-foreground">
                          Focus on critical variances to improve overall health score
                        </p>
                      </div>
                    </div>
                  </div>
                </Card>
              </>
            )}
          </TabsContent>

          <TabsContent value="trends" className="space-y-6">
            {trendData && trendData.length > 0 ? (
              <VarianceTrendChart data={trendData} />
            ) : (
              <Card className="p-12 text-center">
                <p className="text-muted-foreground">No trend data available</p>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="comparison" className="space-y-6">
            <VersionComparisonView reportKey={selectedReport} year={selectedYear} />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default BudgetAnalytics;

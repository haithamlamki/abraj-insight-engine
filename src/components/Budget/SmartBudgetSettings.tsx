import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import { 
  TrendingUp, 
  Target, 
  AlertCircle, 
  Sparkles, 
  Save,
  Loader2,
  Brain,
  Bell
} from "lucide-react";
import { cn } from "@/lib/utils";
import { BudgetAlertsPanel } from "@/components/Budget/BudgetAlertsPanel";

interface SmartBudgetSettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reportType?: string;
}

interface BudgetSuggestion {
  metric: string;
  currentAvg: number;
  suggestedBudget: number;
  confidence: number;
  reasoning: string;
}

export function SmartBudgetSettings({ 
  open, 
  onOpenChange,
  reportType = "all" 
}: SmartBudgetSettingsProps) {
  const queryClient = useQueryClient();
  const [selectedReport, setSelectedReport] = useState(reportType);
  const [autoApprove, setAutoApprove] = useState(false);
  const [varianceThreshold, setVarianceThreshold] = useState([10]);
  const [budgetGrowth, setBudgetGrowth] = useState([5]);
  const [generatingSuggestions, setGeneratingSuggestions] = useState(false);
  const [alertsOpen, setAlertsOpen] = useState(false);

  // Fetch reports
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

  // Fetch historical data for suggestions
  const { data: suggestions, refetch: refetchSuggestions } = useQuery({
    queryKey: ['budget-suggestions', selectedReport],
    queryFn: async () => {
      if (selectedReport === 'all') return [];

      // Fetch historical data based on report type
      let historicalData: any[] = [];
      const currentYear = new Date().getFullYear();
      const lastYear = currentYear - 1;

      switch (selectedReport) {
        case 'revenue':
          const { data: revenueData } = await supabase
            .from('revenue')
            .select('*')
            .eq('year', lastYear);
          historicalData = revenueData || [];
          break;
        case 'utilization':
          const { data: utilizationData } = await supabase
            .from('utilization')
            .select('*')
            .eq('year', lastYear);
          historicalData = utilizationData || [];
          break;
        case 'billing_npt':
          const { data: nptData } = await supabase
            .from('billing_npt')
            .select('*')
            .gte('date', `${lastYear}-01-01`)
            .lte('date', `${lastYear}-12-31`);
          historicalData = nptData || [];
          break;
      }

      // Generate suggestions based on historical data
      const suggestions: BudgetSuggestion[] = [];
      
      if (selectedReport === 'revenue' && historicalData.length > 0) {
        const avgRevenue = historicalData.reduce((sum, r) => sum + (Number(r.revenue_actual) || 0), 0) / historicalData.length;
        suggestions.push({
          metric: 'Monthly Revenue',
          currentAvg: avgRevenue,
          suggestedBudget: avgRevenue * (1 + budgetGrowth[0] / 100),
          confidence: 0.85,
          reasoning: `Based on ${historicalData.length} months of historical data with ${budgetGrowth[0]}% growth target`
        });
      }

      if (selectedReport === 'utilization' && historicalData.length > 0) {
        const avgUtil = historicalData.reduce((sum, u) => sum + (Number(u.utilization_rate) || 0), 0) / historicalData.length;
        suggestions.push({
          metric: 'Utilization Rate',
          currentAvg: avgUtil,
          suggestedBudget: Math.min(95, avgUtil * (1 + budgetGrowth[0] / 200)),
          confidence: 0.90,
          reasoning: `Target utilization improvement while keeping realistic expectations`
        });
      }

      if (selectedReport === 'billing_npt' && historicalData.length > 0) {
        const totalNPT = historicalData.reduce((sum, n) => sum + (Number(n.npt_hours) || 0), 0);
        const avgNPT = totalNPT / Math.max(historicalData.length / 12, 1); // Monthly average
        suggestions.push({
          metric: 'Monthly NPT Hours',
          currentAvg: avgNPT,
          suggestedBudget: avgNPT * (1 - budgetGrowth[0] / 100), // Reduce NPT
          confidence: 0.80,
          reasoning: `Target ${budgetGrowth[0]}% reduction in NPT hours based on historical performance`
        });
      }

      return suggestions;
    },
    enabled: open && selectedReport !== 'all',
  });

  const applyBudgetsMutation = useMutation({
    mutationFn: async (suggestions: BudgetSuggestion[]) => {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) throw new Error('Not authenticated');

      setGeneratingSuggestions(true);

      // Get or create budget version
      let versionId: string;
      const { data: existingVersion } = await supabase
        .from('budget_version')
        .select('id')
        .eq('fiscal_year', new Date().getFullYear())
        .eq('status', 'draft')
        .single();

      if (existingVersion) {
        versionId = existingVersion.id;
      } else {
        const { data: newVersion, error: versionError } = await supabase
          .from('budget_version')
          .insert({
            version_name: `AI Generated ${new Date().getFullYear()}`,
            version_code: `AI-${Date.now()}`,
            fiscal_year: new Date().getFullYear(),
            effective_start: `${new Date().getFullYear()}-01-01`,
            effective_end: `${new Date().getFullYear()}-12-31`,
            status: 'draft',
            created_by: user.id,
          })
          .select('id')
          .single();

        if (versionError) throw versionError;
        versionId = newVersion.id;
      }

      // Get report and metrics
      const { data: report } = await supabase
        .from('dim_report')
        .select('id')
        .eq('report_key', selectedReport)
        .single();

      if (!report) throw new Error('Report not found');

      const { data: metrics } = await supabase
        .from('dim_metric')
        .select('*')
        .eq('report_id', report.id)
        .eq('active', true);

      const { data: rigs } = await supabase
        .from('dim_rig')
        .select('*')
        .eq('active', true);

      // Create budget records for all rigs and months
      const budgetRecords = [];
      for (const rig of rigs || []) {
        for (const metric of metrics || []) {
          const suggestion = suggestions.find(s => 
            s.metric.toLowerCase().includes(metric.metric_key.toLowerCase())
          );
          
          if (suggestion) {
            for (let month = 1; month <= 12; month++) {
              budgetRecords.push({
                version_id: versionId,
                report_id: report.id,
                rig_id: rig.id,
                metric_id: metric.id,
                year: new Date().getFullYear(),
                month,
                budget_value: suggestion.suggestedBudget,
                created_by: user.id,
              });
            }
          }
        }
      }

      if (budgetRecords.length > 0) {
        const { error: insertError } = await supabase
          .from('fact_budget')
          .upsert(budgetRecords);

        if (insertError) throw insertError;
      }

      return budgetRecords.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ['budget-editor'] });
      queryClient.invalidateQueries({ queryKey: ['budget-variance'] });
      toast.success(`Applied ${count} smart budget targets`);
      setGeneratingSuggestions(false);
    },
    onError: (error: any) => {
      toast.error(`Failed to apply budgets: ${error.message}`);
      setGeneratingSuggestions(false);
    },
  });

  const handleApplySuggestions = () => {
    if (!suggestions || suggestions.length === 0) {
      toast.error("No suggestions available");
      return;
    }
    applyBudgetsMutation.mutate(suggestions);
  };

  const handleRefreshSuggestions = () => {
    refetchSuggestions();
    toast.info("Regenerating budget suggestions...");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            <DialogTitle>Smart Budget Settings</DialogTitle>
          </div>
          <DialogDescription>
            AI-powered budget configuration with automated suggestions based on historical performance
          </DialogDescription>
        </DialogHeader>

        <div className="flex justify-end mb-4">
          <Button variant="outline" size="sm" onClick={() => setAlertsOpen(true)}>
            <Bell className="h-4 w-4 mr-2" />
            Manage Alerts
          </Button>
        </div>

        <Tabs value={selectedReport} onValueChange={setSelectedReport} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">All Reports</TabsTrigger>
            <TabsTrigger value="revenue">Revenue</TabsTrigger>
            <TabsTrigger value="utilization">Utilization</TabsTrigger>
            <TabsTrigger value="billing_npt">NPT</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Global Budget Settings</h3>
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label>Variance Alert Threshold (%)</Label>
                  <div className="flex items-center gap-4">
                    <Slider
                      value={varianceThreshold}
                      onValueChange={setVarianceThreshold}
                      max={50}
                      step={1}
                      className="flex-1"
                    />
                    <span className="text-sm font-medium w-12">{varianceThreshold[0]}%</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Alert when actual values exceed budget by this percentage
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Default Budget Growth Target (%)</Label>
                  <div className="flex items-center gap-4">
                    <Slider
                      value={budgetGrowth}
                      onValueChange={setBudgetGrowth}
                      max={20}
                      min={-10}
                      step={1}
                      className="flex-1"
                    />
                    <span className="text-sm font-medium w-12">{budgetGrowth[0]}%</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Target improvement over previous year's performance
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Auto-approve AI Suggestions</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically apply high-confidence budget suggestions
                    </p>
                  </div>
                  <Switch checked={autoApprove} onCheckedChange={setAutoApprove} />
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-primary/5">
              <div className="flex items-start gap-3">
                <Brain className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <h4 className="font-semibold mb-2">How Smart Budgets Work</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Analyzes historical performance data from the previous year</li>
                    <li>• Applies your growth targets and improvement goals</li>
                    <li>• Considers seasonal variations and trends</li>
                    <li>• Provides confidence scores for each suggestion</li>
                    <li>• Automatically adjusts for outliers and anomalies</li>
                  </ul>
                </div>
              </div>
            </Card>
          </TabsContent>

          {['revenue', 'utilization', 'billing_npt'].map(reportKey => (
            <TabsContent key={reportKey} value={reportKey} className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold capitalize">{reportKey} Budget Suggestions</h3>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleRefreshSuggestions}
                  disabled={generatingSuggestions}
                >
                  {generatingSuggestions ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Sparkles className="h-4 w-4 mr-2" />
                  )}
                  Refresh Suggestions
                </Button>
              </div>

              {suggestions && suggestions.length > 0 ? (
                <div className="space-y-3">
                  {suggestions.map((suggestion, index) => (
                    <Card key={index} className="p-4 hover:border-primary/50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-2">
                            <Target className="h-4 w-4 text-primary" />
                            <h4 className="font-semibold">{suggestion.metric}</h4>
                            <Badge 
                              variant={suggestion.confidence > 0.8 ? "default" : "secondary"}
                              className="ml-auto"
                            >
                              {(suggestion.confidence * 100).toFixed(0)}% Confidence
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <p className="text-muted-foreground">Current Average</p>
                              <p className="font-semibold">
                                {suggestion.currentAvg.toLocaleString(undefined, {
                                  maximumFractionDigits: 2
                                })}
                              </p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Suggested Budget</p>
                              <p className="font-semibold text-primary">
                                {suggestion.suggestedBudget.toLocaleString(undefined, {
                                  maximumFractionDigits: 2
                                })}
                              </p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Change</p>
                              <div className={cn(
                                "font-semibold flex items-center gap-1",
                                suggestion.suggestedBudget > suggestion.currentAvg 
                                  ? "text-primary" 
                                  : "text-destructive"
                              )}>
                                <TrendingUp className="h-3 w-3" />
                                {(((suggestion.suggestedBudget - suggestion.currentAvg) / suggestion.currentAvg) * 100).toFixed(1)}%
                              </div>
                            </div>
                          </div>

                          <p className="text-sm text-muted-foreground">{suggestion.reasoning}</p>
                        </div>
                      </div>
                    </Card>
                  ))}

                  <Button 
                    onClick={handleApplySuggestions}
                    disabled={applyBudgetsMutation.isPending || generatingSuggestions}
                    className="w-full"
                  >
                    {applyBudgetsMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Applying Budget Targets...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Apply All Suggestions
                      </>
                    )}
                  </Button>
                </div>
              ) : (
                <Card className="p-8 text-center">
                  <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">
                    No historical data available to generate suggestions.
                    <br />
                    Ensure you have data from the previous year.
                  </p>
                </Card>
              )}
            </TabsContent>
          ))}
        </Tabs>

        <BudgetAlertsPanel 
          open={alertsOpen}
          onOpenChange={setAlertsOpen}
        />
      </DialogContent>
    </Dialog>
  );
}

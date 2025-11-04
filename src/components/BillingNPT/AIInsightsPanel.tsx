import { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Sparkles, TrendingUp, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { BillingNPTFilters } from "@/hooks/useBillingNPTFilters";

interface AIInsightsPanelProps {
  filters: BillingNPTFilters;
}

interface Insights {
  insights: string[];
  recommendations: string[];
  alerts: string[];
  context?: any;
}

export const AIInsightsPanel = ({ filters }: AIInsightsPanelProps) => {
  const [insights, setInsights] = useState<Insights | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [focusArea, setFocusArea] = useState<string>('operational-efficiency');

  const generateInsights = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('billing-npt-insights', {
        body: { filters, focusArea }
      });

      if (error) throw error;

      setInsights(data);
      toast.success('AI insights generated successfully');
    } catch (error: any) {
      console.error('Error generating insights:', error);
      toast.error(error.message || 'Failed to generate insights');
    } finally {
      setIsLoading(false);
    }
  };

  const focusAreas = [
    { id: 'operational-efficiency', label: 'Operational Efficiency', icon: TrendingUp },
    { id: 'npt-drivers', label: 'NPT Drivers', icon: AlertTriangle },
    { id: 'executive-summary', label: 'Executive Summary', icon: Sparkles }
  ];

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">AI-Powered Insights</h3>
        </div>
        <Button
          onClick={generateInsights}
          disabled={isLoading}
          size="sm"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              {insights ? 'Refresh' : 'Generate'} Insights
            </>
          )}
        </Button>
      </div>

      <div className="mb-4">
        <p className="text-sm text-muted-foreground mb-2">Focus Area:</p>
        <div className="flex flex-wrap gap-2">
          {focusAreas.map(area => {
            const Icon = area.icon;
            return (
              <Badge
                key={area.id}
                variant={focusArea === area.id ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => setFocusArea(area.id)}
              >
                <Icon className="h-3 w-3 mr-1" />
                {area.label}
              </Badge>
            );
          })}
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {!isLoading && !insights && (
        <div className="text-center py-12 text-muted-foreground">
          <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Click "Generate Insights" to analyze NPT data with AI</p>
          <p className="text-sm mt-2">Get intelligent recommendations based on your current filters</p>
        </div>
      )}

      {!isLoading && insights && (
        <div className="space-y-6">
          {insights.alerts && insights.alerts.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                <h4 className="font-semibold">Critical Alerts</h4>
              </div>
              <div className="space-y-2">
                {insights.alerts.map((alert, idx) => (
                  <div key={idx} className="p-3 rounded-lg border border-destructive/50 bg-destructive/5">
                    <p className="text-sm">{alert}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {insights.insights && insights.insights.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="h-5 w-5 text-primary" />
                <h4 className="font-semibold">Key Insights</h4>
              </div>
              <div className="space-y-2">
                {insights.insights.map((insight, idx) => (
                  <div key={idx} className="p-3 rounded-lg border bg-card">
                    <p className="text-sm">{insight}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {insights.recommendations && insights.recommendations.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="h-5 w-5 text-chart-1" />
                <h4 className="font-semibold">Recommendations</h4>
              </div>
              <div className="space-y-2">
                {insights.recommendations.map((rec, idx) => (
                  <div key={idx} className="p-3 rounded-lg border bg-card">
                    <p className="text-sm">{rec}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  );
};

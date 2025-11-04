import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Loader2, RefreshCw, AlertTriangle, Lightbulb, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { RevenueFilters } from "@/hooks/useRevenueFilters";
import { toast } from "sonner";

interface AIInsightsPanelProps {
  filters: RevenueFilters;
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
  const [focusArea, setFocusArea] = useState<'variance_drivers' | 'rig_performance' | 'executive_summary'>('variance_drivers');

  const generateInsights = async () => {
    try {
      setIsLoading(true);
      toast.info("Analyzing revenue data with AI...");

      const { data, error } = await supabase.functions.invoke('revenue-insights', {
        body: { filters, focusArea }
      });

      if (error) {
        throw error;
      }

      if (data.error) {
        if (data.error.includes('Rate limits')) {
          toast.error("AI rate limit reached. Please try again in a moment.");
        } else if (data.error.includes('Payment required')) {
          toast.error("AI credits exhausted. Please add credits to continue.");
        } else {
          toast.error(data.error);
        }
        return;
      }

      setInsights(data);
      toast.success("AI insights generated successfully!");

    } catch (error: any) {
      console.error('AI insights error:', error);
      toast.error(error.message || "Failed to generate insights");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              AI-Powered Insights
            </CardTitle>
            <CardDescription>
              Get intelligent analysis and recommendations for your revenue data
            </CardDescription>
          </div>
          <Button
            onClick={generateInsights}
            disabled={isLoading}
            size="sm"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : insights ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Insights
              </>
            )}
          </Button>
        </div>

        {!insights && !isLoading && (
          <div className="flex gap-2 mt-4">
            <Badge
              variant={focusArea === 'variance_drivers' ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => setFocusArea('variance_drivers')}
            >
              Variance Drivers
            </Badge>
            <Badge
              variant={focusArea === 'rig_performance' ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => setFocusArea('rig_performance')}
            >
              Rig Performance
            </Badge>
            <Badge
              variant={focusArea === 'executive_summary' ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => setFocusArea('executive_summary')}
            >
              Executive Summary
            </Badge>
          </div>
        )}
      </CardHeader>

      <CardContent>
        {!insights && !isLoading && (
          <div className="text-center py-8">
            <Sparkles className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground mb-4">
              Click "Generate Insights" to get AI-powered analysis of your revenue data
            </p>
            <p className="text-xs text-muted-foreground">
              Powered by Lovable AI • Using Google Gemini 2.5 Flash
            </p>
          </div>
        )}

        {isLoading && (
          <div className="text-center py-8">
            <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin text-primary" />
            <p className="text-muted-foreground">
              Analyzing your revenue data with AI...
            </p>
          </div>
        )}

        {insights && !isLoading && (
          <div className="space-y-6">
            {/* Alerts */}
            {insights.alerts && insights.alerts.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-destructive">
                  <AlertTriangle className="w-5 h-5" />
                  <h4 className="font-semibold">Critical Alerts</h4>
                </div>
                <div className="space-y-2">
                  {insights.alerts.map((alert, index) => (
                    <div
                      key={index}
                      className="p-3 rounded-lg bg-destructive/10 border border-destructive/20"
                    >
                      <p className="text-sm">{alert}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Insights */}
            {insights.insights && insights.insights.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-primary">
                  <Lightbulb className="w-5 h-5" />
                  <h4 className="font-semibold">Key Insights</h4>
                </div>
                <div className="space-y-2">
                  {insights.insights.map((insight, index) => (
                    <div
                      key={index}
                      className="p-3 rounded-lg bg-primary/5 border border-primary/10"
                    >
                      <p className="text-sm">{insight}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recommendations */}
            {insights.recommendations && insights.recommendations.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-success">
                  <TrendingUp className="w-5 h-5" />
                  <h4 className="font-semibold">Recommendations</h4>
                </div>
                <div className="space-y-2">
                  {insights.recommendations.map((rec, index) => (
                    <div
                      key={index}
                      className="p-3 rounded-lg bg-success/5 border border-success/10"
                    >
                      <p className="text-sm">{rec}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-4 border-t text-xs text-muted-foreground text-center">
              <p>AI insights based on {insights.context?.totalRecords || 0} revenue records</p>
              <p className="mt-1">Click "Refresh" to regenerate with updated data</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

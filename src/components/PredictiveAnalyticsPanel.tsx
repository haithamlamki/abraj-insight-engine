import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { TrendingUp, AlertTriangle, Lightbulb, Target, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface PredictiveAnalyticsPanelProps {
  data: any[];
  metric: string;
  metricLabel: string;
}

export const PredictiveAnalyticsPanel = ({
  data,
  metric,
  metricLabel
}: PredictiveAnalyticsPanelProps) => {
  const [timeframe, setTimeframe] = useState<'next_month' | 'next_quarter' | 'next_6_months'>('next_quarter');
  const [predictions, setPredictions] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const generatePredictions = async () => {
    setIsLoading(true);
    
    try {
      const { data: result, error } = await supabase.functions.invoke('predictive-analytics', {
        body: {
          data: data.slice(-20), // Last 20 data points
          metric,
          timeframe
        }
      });

      if (error) throw error;

      setPredictions(result);
      
      toast({
        title: "Predictions Generated",
        description: `${result.predictions.length} periods forecasted with ${result.confidence_overall}% confidence`,
      });
    } catch (error) {
      console.error('Prediction error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate predictions",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Combine historical data with predictions for chart
  const chartData = predictions
    ? [
        ...data.slice(-6).map(d => ({
          period: d.month || d.date,
          actual: d.value || d[metric],
          type: 'historical'
        })),
        ...predictions.predictions.map((p: any) => ({
          period: p.period,
          predicted: p.value,
          confidence: p.confidence,
          type: 'predicted'
        }))
      ]
    : [];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Predictive Analytics
            </CardTitle>
            <CardDescription>
              AI-powered forecasting for {metricLabel}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Select value={timeframe} onValueChange={(v: any) => setTimeframe(v)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="next_month">Next Month</SelectItem>
                <SelectItem value="next_quarter">Next Quarter</SelectItem>
                <SelectItem value="next_6_months">Next 6 Months</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={generatePredictions} disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Generate
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {predictions ? (
          <>
            {/* Chart */}
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="actual"
                    stroke="hsl(var(--primary))"
                    fill="hsl(var(--primary))"
                    fillOpacity={0.3}
                    name="Historical"
                  />
                  <Area
                    type="monotone"
                    dataKey="predicted"
                    stroke="hsl(var(--chart-2))"
                    fill="hsl(var(--chart-2))"
                    fillOpacity={0.3}
                    strokeDasharray="5 5"
                    name="Predicted"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Trend & Confidence */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Trend</span>
                </div>
                <Badge variant={
                  predictions.trend === 'increasing' ? 'default' :
                  predictions.trend === 'decreasing' ? 'destructive' : 'secondary'
                }>
                  {predictions.trend}
                </Badge>
              </div>
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Confidence</span>
                </div>
                <div className="text-2xl font-bold">
                  {predictions.confidence_overall}%
                </div>
              </div>
            </div>

            {/* Insights */}
            {predictions.insights && predictions.insights.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Key Insights</span>
                </div>
                <div className="space-y-2">
                  {predictions.insights.map((insight: string, idx: number) => (
                    <div key={idx} className="p-3 bg-muted rounded-lg text-sm">
                      {insight}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recommendations */}
            {predictions.recommendations && predictions.recommendations.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Recommendations</span>
                </div>
                <div className="space-y-2">
                  {predictions.recommendations.map((rec: string, idx: number) => (
                    <div key={idx} className="p-3 bg-primary/10 rounded-lg text-sm">
                      {rec}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Risks */}
            {predictions.risks && predictions.risks.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                  <span className="text-sm font-medium">Potential Risks</span>
                </div>
                <div className="space-y-2">
                  {predictions.risks.map((risk: string, idx: number) => (
                    <div key={idx} className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm">
                      {risk}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="py-12 text-center">
            <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">
              Generate AI-powered predictions to see future trends
            </p>
            <Button onClick={generatePredictions} disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Generate Predictions
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

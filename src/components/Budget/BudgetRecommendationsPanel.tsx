import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useBudgetRecommendations } from "@/hooks/useBudgetRecommendations";
import { 
  Sparkles, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  AlertTriangle,
  CheckCircle2,
  Lightbulb,
  BarChart3,
  Activity
} from "lucide-react";
import { cn } from "@/lib/utils";

export function BudgetRecommendationsPanel() {
  const [selectedReport, setSelectedReport] = useState('revenue');
  const [selectedRig, setSelectedRig] = useState<string>('');
  
  const { isLoading, recommendations, generateRecommendations } = useBudgetRecommendations();

  const { data: rigs } = useQuery({
    queryKey: ['dim-rig'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dim_rig')
        .select('*')
        .eq('active', true);
      if (error) throw error;
      return data;
    },
  });

  const handleGenerate = () => {
    generateRecommendations(selectedReport, selectedRig || undefined);
  };

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case 'high': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-red-600';
      default: return 'text-muted-foreground';
    }
  };

  const getTrendIcon = (direction: string) => {
    switch (direction) {
      case 'increasing': return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'decreasing': return <TrendingDown className="h-4 w-4 text-red-600" />;
      case 'stable': return <Minus className="h-4 w-4 text-blue-600" />;
      case 'volatile': return <Activity className="h-4 w-4 text-orange-600" />;
      default: return <BarChart3 className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Budget Recommendations
          </CardTitle>
          <CardDescription>
            Analyze historical trends and get AI-powered budget suggestions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Report Type</label>
              <Select value={selectedReport} onValueChange={setSelectedReport}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="revenue">Revenue</SelectItem>
                  <SelectItem value="utilization">Utilization</SelectItem>
                  <SelectItem value="billing_npt">Billing NPT</SelectItem>
                  <SelectItem value="fuel">Fuel</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Rig (Optional)</label>
              <Select value={selectedRig} onValueChange={setSelectedRig}>
                <SelectTrigger>
                  <SelectValue placeholder="All rigs" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All rigs</SelectItem>
                  {rigs?.map((rig) => (
                    <SelectItem key={rig.id} value={rig.rig_code}>
                      {rig.rig_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button 
            onClick={handleGenerate} 
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Sparkles className="h-4 w-4 mr-2 animate-pulse" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Generate Recommendations
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {recommendations && (
        <div className="space-y-4">
          {/* Overview Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Analysis Overview</CardTitle>
                <Badge variant={
                  recommendations.recommendations.confidence === 'high' ? 'default' :
                  recommendations.recommendations.confidence === 'medium' ? 'secondary' :
                  'outline'
                }>
                  {recommendations.recommendations.confidence} confidence
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Report Type</p>
                  <p className="font-medium capitalize">{recommendations.reportType}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Data Points</p>
                  <p className="font-medium">{recommendations.dataPoints}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Scope</p>
                  <p className="font-medium">{recommendations.rigCode === 'all' ? 'All Rigs' : recommendations.rigCode}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Trends Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Trend Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Direction</p>
                  <div className="flex items-center gap-2">
                    {getTrendIcon(recommendations.recommendations.trends.direction)}
                    <span className="font-medium capitalize">
                      {recommendations.recommendations.trends.direction}
                    </span>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Seasonality</p>
                  <Badge variant="outline" className="capitalize">
                    {recommendations.recommendations.trends.seasonality}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Predictability</p>
                  <Badge variant="outline" className="capitalize">
                    {recommendations.recommendations.trends.predictability}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recommended Values Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                Recommended Budget Values
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Object.entries(recommendations.recommendations.recommendedValues).map(([key, value]) => (
                  <div key={key} className="flex justify-between items-center p-2 bg-muted/50 rounded">
                    <span className="font-medium capitalize">{key.replace(/_/g, ' ')}</span>
                    <span className="text-lg font-bold">{typeof value === 'number' ? value.toLocaleString() : value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Variance Threshold Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recommended Variance Threshold</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 bg-primary/10 rounded-lg">
                <span className="font-medium">Optimal Threshold</span>
                <span className="text-3xl font-bold text-primary">
                  {recommendations.recommendations.varianceThreshold}%
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Insights Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-yellow-600" />
                Key Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {recommendations.recommendations.insights.map((insight, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{insight}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Risk Factors Card */}
          {recommendations.recommendations.riskFactors.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-600" />
                  Risk Factors
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {recommendations.recommendations.riskFactors.map((risk, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{risk}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Reasoning Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Analysis Reasoning</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {recommendations.recommendations.reasoning}
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

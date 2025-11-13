import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useReportData } from "@/hooks/useReportData";
import { linearRegression, detectAnomalies, generateRecommendations } from "@/utils/forecastingAlgorithms";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from "recharts";
import { TrendingUp, AlertTriangle, Lightbulb, Loader2 } from "lucide-react";
import { useMemo } from "react";

export const PredictiveAnalytics = () => {
  const { data: nptData } = useReportData("billing_npt");
  const { data: revenueData } = useReportData("revenue");
  const { data: utilizationData } = useReportData("utilization");

  const analytics = useMemo(() => {
    if (!nptData || !revenueData || !utilizationData) return null;

    // Aggregate monthly data
    const monthlyNPT = Array(12).fill(0);
    const monthlyRevenue = Array(12).fill(0);
    const monthlyUtilization = Array(12).fill(0);

    nptData.forEach((item: any) => {
      const monthIndex = new Date(item.date || item.created_at).getMonth();
      monthlyNPT[monthIndex] += Number(item.npt_hours) || 0;
    });

    revenueData.forEach((item: any) => {
      const monthIndex = item.month ? parseInt(item.month) - 1 : new Date(item.created_at).getMonth();
      monthlyRevenue[monthIndex] += Number(item.revenue_actual) || 0;
    });

    utilizationData.forEach((item: any) => {
      const monthIndex = item.month ? parseInt(item.month) - 1 : new Date(item.created_at).getMonth();
      monthlyUtilization[monthIndex] += Number(item.utilization_rate) || 0;
    });

    // Calculate forecasts
    const nptForecast = linearRegression(monthlyNPT, 3);
    const revenueForecast = linearRegression(monthlyRevenue, 3);

    // Detect anomalies
    const nptAnomalies = detectAnomalies(monthlyNPT);
    const revenueAnomalies = detectAnomalies(monthlyRevenue);

    // Generate recommendations
    const recommendations = generateRecommendations({
      nptData: monthlyNPT,
      revenueData: monthlyRevenue,
      utilizationData: monthlyUtilization,
    });

    // Create chart data
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const chartData = months.map((month, i) => ({
      month,
      nptActual: monthlyNPT[i],
      nptForecast: nptForecast[i],
      isAnomaly: nptAnomalies[i],
      revenueActual: monthlyRevenue[i],
      revenueForecast: revenueForecast[i],
    }));

    // Add forecast months
    ["Next 1", "Next 2", "Next 3"].forEach((label, i) => {
      chartData.push({
        month: label,
        nptActual: 0,
        nptForecast: nptForecast[12 + i],
        isAnomaly: false,
        revenueActual: 0,
        revenueForecast: revenueForecast[12 + i],
      });
    });

    return {
      chartData,
      recommendations,
      anomalyCount: nptAnomalies.filter(Boolean).length + revenueAnomalies.filter(Boolean).length,
    };
  }, [nptData, revenueData, utilizationData]);

  if (!analytics) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Forecast Period</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3 Months</div>
            <p className="text-xs text-muted-foreground">Predictive horizon</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Anomalies Detected</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{analytics.anomalyCount}</div>
            <p className="text-xs text-muted-foreground">Unusual patterns found</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recommendations</CardTitle>
            <Lightbulb className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.recommendations.length}</div>
            <p className="text-xs text-muted-foreground">Action items identified</p>
          </CardContent>
        </Card>
      </div>

      {/* NPT Forecast Chart */}
      <Card>
        <CardHeader>
          <CardTitle>NPT Forecast - Next 3 Months</CardTitle>
          <CardDescription>Historical data with trend projection and anomaly detection</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={analytics.chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="month" 
                className="text-xs"
                tick={{ fill: "hsl(var(--muted-foreground))" }}
              />
              <YAxis 
                className="text-xs"
                tick={{ fill: "hsl(var(--muted-foreground))" }}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: "hsl(var(--background))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "var(--radius)",
                }}
              />
              <Legend />
              <ReferenceLine x="Dec" stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
              <Line 
                type="monotone" 
                dataKey="nptActual" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                name="Actual NPT"
                dot={(props: any) => {
                  const { cx, cy, payload } = props;
                  if (payload.isAnomaly) {
                    return (
                      <circle 
                        cx={cx} 
                        cy={cy} 
                        r={6} 
                        fill="hsl(var(--destructive))" 
                        stroke="white" 
                        strokeWidth={2}
                      />
                    );
                  }
                  return <circle cx={cx} cy={cy} r={4} fill="hsl(var(--primary))" />;
                }}
              />
              <Line 
                type="monotone" 
                dataKey="nptForecast" 
                stroke="hsl(var(--muted-foreground))" 
                strokeWidth={2}
                strokeDasharray="5 5"
                name="Forecast"
                dot={{ fill: "hsl(var(--muted-foreground))" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Revenue Forecast Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue Forecast - Next 3 Months</CardTitle>
          <CardDescription>Revenue projection based on historical trends</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={analytics.chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="month" 
                className="text-xs"
                tick={{ fill: "hsl(var(--muted-foreground))" }}
              />
              <YAxis 
                className="text-xs"
                tick={{ fill: "hsl(var(--muted-foreground))" }}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: "hsl(var(--background))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "var(--radius)",
                }}
              />
              <Legend />
              <ReferenceLine x="Dec" stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
              <Line 
                type="monotone" 
                dataKey="revenueActual" 
                stroke="hsl(var(--success))" 
                strokeWidth={2}
                name="Actual Revenue"
                dot={{ fill: "hsl(var(--success))" }}
              />
              <Line 
                type="monotone" 
                dataKey="revenueForecast" 
                stroke="hsl(var(--muted-foreground))" 
                strokeWidth={2}
                strokeDasharray="5 5"
                name="Forecast"
                dot={{ fill: "hsl(var(--muted-foreground))" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>Smart Recommendations</CardTitle>
          <CardDescription>AI-generated insights based on historical patterns</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {analytics.recommendations.map((recommendation, index) => (
              <Alert key={index} className="border-l-4 border-l-primary">
                <Lightbulb className="h-4 w-4" />
                <AlertDescription>{recommendation}</AlertDescription>
              </Alert>
            ))}
            {analytics.recommendations.length === 0 && (
              <p className="text-muted-foreground text-center py-4">
                All metrics within normal ranges. No immediate action required.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

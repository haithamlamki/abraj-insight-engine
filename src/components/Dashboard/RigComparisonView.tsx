import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RigPerformanceData } from "@/hooks/useRigPerformanceData";
import {
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle,
  Lightbulb,
  ArrowRight,
  Award,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface RigComparisonViewProps {
  rig1: RigPerformanceData;
  rig2: RigPerformanceData;
}

export function RigComparisonView({ rig1, rig2 }: RigComparisonViewProps) {
  // Calculate differences
  const efficiencyDiff = rig1.annualStats.avgEfficiency - rig2.annualStats.avgEfficiency;
  const nptDiff = rig1.annualStats.totalNPT - rig2.annualStats.totalNPT;
  const complianceDiff = rig1.annualStats.complianceRate - rig2.annualStats.complianceRate;

  const betterRig = efficiencyDiff > 0 ? rig1 : rig2;
  const worseRig = efficiencyDiff > 0 ? rig2 : rig1;

  // Prepare comparison chart data
  const chartData = Array.from({ length: 12 }, (_, i) => {
    const month = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][i];
    const rig1Data = rig1.monthlyData.find((m) => m.month === i + 1);
    const rig2Data = rig2.monthlyData.find((m) => m.month === i + 1);

    return {
      month,
      [rig1.rigName]: rig1Data?.efficiency || 0,
      [rig2.rigName]: rig2Data?.efficiency || 0,
    };
  });

  // Generate improvement suggestions
  const suggestions: string[] = [];
  
  if (Math.abs(efficiencyDiff) > 5) {
    suggestions.push(
      `${worseRig.rigName} efficiency is ${Math.abs(efficiencyDiff).toFixed(1)}% lower. Review operational procedures from ${betterRig.rigName}.`
    );
  }

  if (Math.abs(nptDiff) > 20) {
    suggestions.push(
      `${worseRig.rigName} has ${Math.abs(nptDiff).toFixed(0)} more NPT days. Investigate recurring issues and maintenance schedules.`
    );
  }

  if (Math.abs(complianceDiff) > 10) {
    suggestions.push(
      `${worseRig.rigName} compliance rate is ${Math.abs(complianceDiff).toFixed(1)}% lower. Implement training programs similar to ${betterRig.rigName}.`
    );
  }

  if (rig1.trend === "declining" || rig2.trend === "declining") {
    const decliningRig = rig1.trend === "declining" ? rig1 : rig2;
    suggestions.push(
      `${decliningRig.rigName} shows declining performance trend. Conduct root cause analysis and implement corrective actions.`
    );
  }

  if (suggestions.length === 0) {
    suggestions.push("Both rigs are performing within similar ranges. Continue monitoring for consistency.");
  }

  const MetricComparison = ({
    label,
    value1,
    value2,
    unit,
    higherIsBetter = true,
  }: {
    label: string;
    value1: number;
    value2: number;
    unit: string;
    higherIsBetter?: boolean;
  }) => {
    const diff = value1 - value2;
    const better = higherIsBetter ? diff > 0 : diff < 0;

    return (
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">{label}</p>
        <div className="grid grid-cols-3 gap-2 items-center">
          <div className="text-right">
            <p className="text-lg font-bold">
              {value1.toFixed(1)}
              {unit}
            </p>
          </div>
          <div className="flex justify-center">
            {diff !== 0 ? (
              <Badge
                variant={better ? "default" : "secondary"}
                className="gap-1"
              >
                {better ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                {Math.abs(diff).toFixed(1)}
                {unit}
              </Badge>
            ) : (
              <Badge variant="outline">Equal</Badge>
            )}
          </div>
          <div className="text-left">
            <p className="text-lg font-bold">
              {value2.toFixed(1)}
              {unit}
            </p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Header with rig names */}
      <div className="grid grid-cols-3 gap-4 items-center">
        <Card className="border-2 border-primary/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg">{rig1.rigName}</h3>
                <Badge variant="outline" className="mt-1">
                  {rig1.trend === "improving" ? (
                    <TrendingUp className="h-3 w-3 mr-1 text-success" />
                  ) : rig1.trend === "declining" ? (
                    <TrendingDown className="h-3 w-3 mr-1 text-destructive" />
                  ) : null}
                  {rig1.trend}
                </Badge>
              </div>
              {efficiencyDiff > 0 && (
                <Award className="h-6 w-6 text-primary" />
              )}
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-center">
          <ArrowRight className="h-8 w-8 text-muted-foreground" />
        </div>

        <Card className="border-2 border-primary/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg">{rig2.rigName}</h3>
                <Badge variant="outline" className="mt-1">
                  {rig2.trend === "improving" ? (
                    <TrendingUp className="h-3 w-3 mr-1 text-success" />
                  ) : rig2.trend === "declining" ? (
                    <TrendingDown className="h-3 w-3 mr-1 text-destructive" />
                  ) : null}
                  {rig2.trend}
                </Badge>
              </div>
              {efficiencyDiff < 0 && (
                <Award className="h-6 w-6 text-primary" />
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Metrics comparison */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Performance Metrics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <MetricComparison
            label="Average Efficiency"
            value1={rig1.annualStats.avgEfficiency}
            value2={rig2.annualStats.avgEfficiency}
            unit="%"
            higherIsBetter={true}
          />
          <MetricComparison
            label="Total NPT"
            value1={rig1.annualStats.totalNPT}
            value2={rig2.annualStats.totalNPT}
            unit=" days"
            higherIsBetter={false}
          />
          <MetricComparison
            label="Compliance Rate"
            value1={rig1.annualStats.complianceRate}
            value2={rig2.annualStats.complianceRate}
            unit="%"
            higherIsBetter={true}
          />
          <MetricComparison
            label="Operating Days"
            value1={rig1.annualStats.totalOperatingDays}
            value2={rig2.annualStats.totalOperatingDays}
            unit=" days"
            higherIsBetter={true}
          />
        </CardContent>
      </Card>

      {/* Efficiency trend comparison */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Efficiency Trend Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis
                dataKey="month"
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                label={{
                  value: "Efficiency (%)",
                  angle: -90,
                  position: "insideLeft",
                  style: { fontSize: 12 },
                }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "var(--radius)",
                  fontSize: 12,
                }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line
                type="monotone"
                dataKey={rig1.rigName}
                stroke={rig1.color}
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey={rig2.rigName}
                stroke={rig2.color}
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Improvement suggestions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-primary" />
            Improvement Suggestions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {suggestions.map((suggestion, index) => (
            <Alert key={index}>
              {index === 0 ? (
                <AlertCircle className="h-4 w-4" />
              ) : (
                <CheckCircle className="h-4 w-4" />
              )}
              <AlertDescription className="text-sm">
                {suggestion}
              </AlertDescription>
            </Alert>
          ))}
        </CardContent>
      </Card>

      {/* Winner summary */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Award className="h-6 w-6 text-primary" />
            <div>
              <p className="font-semibold">Overall Performance Leader</p>
              <p className="text-sm text-muted-foreground">
                {betterRig.rigName} demonstrates {Math.abs(efficiencyDiff).toFixed(1)}% higher efficiency
                with {Math.abs(nptDiff).toFixed(0)} fewer NPT days
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, TrendingUp, TrendingDown, Minus, BarChart3, TableIcon } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface ActualsBudgetComparisonProps {
  versionId: string;
}

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export function ActualsBudgetComparison({ versionId }: ActualsBudgetComparisonProps) {
  const [selectedReportId, setSelectedReportId] = useState<string>("");
  const [selectedMetricId, setSelectedMetricId] = useState<string>("");
  const [viewMode, setViewMode] = useState<"table" | "chart">("chart");

  const { data: reports, isLoading: reportsLoading } = useQuery({
    queryKey: ["dim_report"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("dim_report")
        .select("*")
        .eq("active", true)
        .order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  const { data: metrics } = useQuery({
    queryKey: ["dim_metric", selectedReportId],
    queryFn: async () => {
      if (!selectedReportId) return [];
      const { data, error } = await supabase
        .from("dim_metric")
        .select("*")
        .eq("report_id", selectedReportId)
        .eq("active", true);
      if (error) throw error;
      return data;
    },
    enabled: !!selectedReportId,
  });

  const { data: rigs } = useQuery({
    queryKey: ["dim_rig"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("dim_rig")
        .select("*")
        .eq("active", true)
        .order("rig_code");
      if (error) throw error;
      return data;
    },
  });

  const { data: budgetData } = useQuery({
    queryKey: ["fact_budget_comparison", versionId, selectedReportId, selectedMetricId],
    queryFn: async () => {
      if (!selectedReportId || !selectedMetricId) return [];
      const { data, error } = await supabase
        .from("fact_budget")
        .select("*")
        .eq("version_id", versionId)
        .eq("report_id", selectedReportId)
        .eq("metric_id", selectedMetricId)
        .eq("year", 2025);
      if (error) throw error;
      return data;
    },
    enabled: !!selectedReportId && !!selectedMetricId,
  });

  const { data: actualsData, isLoading: actualsLoading } = useQuery({
    queryKey: ["actuals_2024", selectedReportId, selectedMetricId],
    queryFn: async () => {
      if (!selectedReportId || !selectedMetricId) return null;

      const report = reports?.find(r => r.id === selectedReportId);
      const metric = metrics?.find(m => m.id === selectedMetricId);
      if (!report || !metric) return null;

      const monthMap: Record<string, number> = {
        "January": 1, "February": 2, "March": 3, "April": 4, "May": 5, "June": 6,
        "July": 7, "August": 8, "September": 9, "October": 10, "November": 11, "December": 12
      };

      // Map report keys to tables and metric keys to columns
      const tableMap: Record<string, string> = {
        "revenue": "revenue",
        "utilization": "utilization",
        "fuel": "fuel_consumption",
        "work_orders": "work_orders",
        "customer_satisfaction": "customer_satisfaction",
        "billing_npt": "billing_npt_summary",
      };

      const tableName = tableMap[report.report_key];
      if (!tableName) return null;

      const { data, error } = await supabase
        .from(tableName as any)
        .select("*")
        .eq("year", 2024);

      if (error) throw error;

      // Transform data to map rig + month to actual value
      const actualsMap: Record<string, number> = {};
      
      if (data && Array.isArray(data)) {
        (data as any[]).forEach((row) => {
          const rigName = row.rig as string;
          const month = monthMap[row.month as string];
          if (!rigName || !month) return;

          let value: number | null = null;

          // Map metric keys to actual column names
          switch (metric.metric_key) {
            case "revenue_actual":
              value = row.revenue_actual;
              break;
            case "dayrate_actual":
              value = row.dayrate_actual;
              break;
            case "working_days":
              value = row.working_days;
              break;
            case "fuel_charge":
              value = row.fuel_charge;
              break;
            case "npt_repair":
              value = row.npt_repair;
              break;
            case "npt_zero":
              value = row.npt_zero;
              break;
            case "operating_days":
              value = row.operating_days;
              break;
            case "npt_days":
              value = row.npt_days;
              break;
            case "utilization_rate":
              value = row.utilization_rate;
              break;
            case "fuel_cost_usd":
              value = row.fuel_cost;
              break;
            case "total_consumed":
              value = row.total_consumed;
              break;
            case "rig_engine_consumption":
              value = row.rig_engine_consumption;
              break;
            case "compliance_rate_percent":
              value = row.compliance_rate;
              break;
            case "total_open":
              value = (row.elec_open || 0) + (row.mech_open || 0) + (row.oper_open || 0);
              break;
            case "total_closed":
              value = (row.elec_closed || 0) + (row.mech_closed || 0) + (row.oper_closed || 0);
              break;
            case "satisfaction_score_percent":
              value = row.satisfaction_score;
              break;
            case "total_npt_hours":
              value = row.total_npt;
              break;
            case "operational_rate_hours":
              value = row.opr_rate;
              break;
            case "repair_rate_hours":
              value = row.repair_rate;
              break;
          }

          if (value != null) {
            actualsMap[`${rigName}_${month}`] = value;
          }
        });
      }

      return actualsMap;
    },
    enabled: !!selectedReportId && !!selectedMetricId && !!reports && !!metrics,
  });

  const calculateVariance = (actual: number, budget: number) => {
    if (budget === 0) return actual === 0 ? 0 : 100;
    return ((budget - actual) / actual) * 100;
  };

  const getVarianceBadge = (variance: number) => {
    if (Math.abs(variance) < 5) {
      return (
        <Badge variant="outline" className="gap-1">
          <Minus className="h-3 w-3" />
          {variance.toFixed(1)}%
        </Badge>
      );
    } else if (variance > 0) {
      return (
        <Badge variant="default" className="gap-1 bg-green-500">
          <TrendingUp className="h-3 w-3" />
          +{variance.toFixed(1)}%
        </Badge>
      );
    } else {
      return (
        <Badge variant="destructive" className="gap-1">
          <TrendingDown className="h-3 w-3" />
          {variance.toFixed(1)}%
        </Badge>
      );
    }
  };

  // Prepare chart data
  const chartData = rigs?.map((rig) => {
    const rigData: any = { rigName: rig.rig_name };
    
    MONTHS.forEach((month, monthIndex) => {
      const monthNum = monthIndex + 1;
      const budget = budgetData?.find(
        b => b.rig_id === rig.id && b.month === monthNum
      )?.budget_value || 0;
      
      const actual = actualsData?.[`${rig.rig_name}_${monthNum}`] || 0;
      const variance = calculateVariance(actual, budget);

      rigData[`${month}_actual`] = actual;
      rigData[`${month}_budget`] = budget;
      rigData[`${month}_variance`] = variance;
    });

    return rigData;
  }) || [];

  // Prepare monthly aggregate data
  const monthlyData = MONTHS.map((month, monthIndex) => {
    const monthNum = monthIndex + 1;
    let totalActual = 0;
    let totalBudget = 0;
    let rigCount = 0;

    rigs?.forEach((rig) => {
      const budget = budgetData?.find(
        b => b.rig_id === rig.id && b.month === monthNum
      )?.budget_value || 0;
      
      const actual = actualsData?.[`${rig.rig_name}_${monthNum}`] || 0;

      if (actual > 0 || budget > 0) {
        totalActual += actual;
        totalBudget += budget;
        rigCount++;
      }
    });

    const avgVariance = rigCount > 0 ? calculateVariance(totalActual, totalBudget) : 0;

    return {
      month,
      actual: totalActual,
      budget: totalBudget,
      variance: avgVariance,
    };
  });

  if (reportsLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Report Type</label>
          <Select value={selectedReportId} onValueChange={(value) => {
            setSelectedReportId(value);
            setSelectedMetricId("");
          }}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a report..." />
            </SelectTrigger>
            <SelectContent>
              {reports?.map((report) => (
                <SelectItem key={report.id} value={report.id}>
                  {report.display_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Metric</label>
          <Select 
            value={selectedMetricId} 
            onValueChange={setSelectedMetricId}
            disabled={!selectedReportId}
          >
            <SelectTrigger>
              <SelectValue placeholder="Choose a metric..." />
            </SelectTrigger>
            <SelectContent>
              {metrics?.map((metric) => (
                <SelectItem key={metric.id} value={metric.id}>
                  {metric.display_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {selectedMetricId && (
        <Card className="p-4">
          <div className="flex justify-end mb-4 gap-2">
            <Button
              variant={viewMode === "chart" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("chart")}
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Charts
            </Button>
            <Button
              variant={viewMode === "table" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("table")}
            >
              <TableIcon className="h-4 w-4 mr-2" />
              Table
            </Button>
          </div>

          {actualsLoading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : viewMode === "chart" ? (
            <div className="space-y-8">
              {/* Monthly Aggregate Trend */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Overall Monthly Trend</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="actual"
                      stroke="#ef4444"
                      name="2024 Actual"
                      strokeWidth={2}
                    />
                    <Line
                      type="monotone"
                      dataKey="budget"
                      stroke="#22c55e"
                      name="2025 Budget"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Variance by Month */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Variance Trend (%)</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value: number) => `${value.toFixed(1)}%`}
                    />
                    <Legend />
                    <Bar
                      dataKey="variance"
                      fill="#3b82f6"
                      name="Budget vs Actual Variance"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Individual Rig Performance */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Rig-by-Rig Comparison (January - June)</h3>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="rigName" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    {MONTHS.slice(0, 6).map((month, idx) => (
                      <Bar
                        key={`actual-${month}`}
                        dataKey={`${month}_actual`}
                        fill={`hsl(${idx * 60}, 70%, 50%)`}
                        name={`${month} Actual`}
                        stackId={month}
                      />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4">Rig-by-Rig Comparison (July - December)</h3>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="rigName" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    {MONTHS.slice(6, 12).map((month, idx) => (
                      <Bar
                        key={`actual-${month}`}
                        dataKey={`${month}_actual`}
                        fill={`hsl(${(idx + 6) * 60}, 70%, 50%)`}
                        name={`${month} Actual`}
                        stackId={month}
                      />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="sticky left-0 bg-background z-10">Rig</TableHead>
                    {MONTHS.map((month) => (
                      <TableHead key={month} className="text-center min-w-[200px]">
                        {month}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rigs?.map((rig) => (
                    <TableRow key={rig.id}>
                      <TableCell className="font-medium sticky left-0 bg-background z-10">
                        {rig.rig_name}
                      </TableCell>
                      {MONTHS.map((_, monthIndex) => {
                        const month = monthIndex + 1;
                        const budget = budgetData?.find(
                          b => b.rig_id === rig.id && b.month === month
                        )?.budget_value || 0;
                        
                        const actual = actualsData?.[`${rig.rig_name}_${month}`] || 0;
                        const variance = calculateVariance(actual, budget);

                        return (
                          <TableCell key={month} className="text-center">
                            <div className="space-y-1">
                              <div className="text-xs text-muted-foreground">
                                2024: {actual.toFixed(2)}
                              </div>
                              <div className="font-medium">
                                2025: {budget.toFixed(2)}
                              </div>
                              {(actual > 0 || budget > 0) && getVarianceBadge(variance)}
                            </div>
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </Card>
        )}

      {!selectedMetricId && (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">
            Select a report type and metric to view the comparison
          </p>
        </Card>
      )}
    </div>
  );
}

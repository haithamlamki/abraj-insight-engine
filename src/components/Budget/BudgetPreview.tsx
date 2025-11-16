import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

interface BudgetPreviewProps {
  versionId: string;
}

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export function BudgetPreview({ versionId }: BudgetPreviewProps) {
  const [selectedReport, setSelectedReport] = useState<string>("");
  const [selectedRig, setSelectedRig] = useState<string>("");
  const [selectedMetric, setSelectedMetric] = useState<string>("");

  const { data: reports, isLoading: reportsLoading } = useQuery({
    queryKey: ["budget-preview-reports"],
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

  const { data: rigs, isLoading: rigsLoading } = useQuery({
    queryKey: ["budget-preview-rigs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("dim_rig")
        .select("*")
        .eq("active", true)
        .order("rig_name");
      if (error) throw error;
      return data;
    },
  });

  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: ["budget-preview-metrics", selectedReport],
    queryFn: async () => {
      if (!selectedReport) return [];
      const { data, error } = await supabase
        .from("dim_metric")
        .select("*")
        .eq("report_id", selectedReport)
        .eq("active", true);
      if (error) throw error;
      return data;
    },
    enabled: !!selectedReport,
  });

  const { data: budgetData, isLoading: budgetLoading } = useQuery({
    queryKey: ["budget-preview-data", versionId, selectedReport, selectedRig, selectedMetric],
    queryFn: async () => {
      let query = supabase
        .from("fact_budget")
        .select(`
          *,
          rig:dim_rig!inner(rig_code, rig_name),
          metric:dim_metric!inner(metric_key, display_name, unit, format),
          report:dim_report!inner(report_key, display_name)
        `)
        .eq("version_id", versionId)
        .eq("year", 2025);

      if (selectedReport) query = query.eq("report_id", selectedReport);
      if (selectedRig) query = query.eq("rig_id", selectedRig);
      if (selectedMetric) query = query.eq("metric_id", selectedMetric);

      const { data, error } = await query.order("month");
      if (error) throw error;
      return data;
    },
    enabled: !!versionId,
  });

  const formatValue = (value: number, format?: string, unit?: string) => {
    if (format === "currency") return `${value.toLocaleString()} ${unit || "OMR"}`;
    if (format === "percentage") return `${value.toFixed(2)}%`;
    if (format === "number") return value.toLocaleString();
    return `${value} ${unit || ""}`;
  };

  const groupedData = budgetData?.reduce((acc: any, item: any) => {
    const rigKey = item.rig.rig_name;
    const metricKey = item.metric.display_name;
    
    if (!acc[rigKey]) acc[rigKey] = {};
    if (!acc[rigKey][metricKey]) acc[rigKey][metricKey] = {};
    
    acc[rigKey][metricKey][item.month] = {
      value: item.budget_value,
      format: item.metric.format,
      unit: item.metric.unit,
    };
    
    return acc;
  }, {});

  const calculateTotal = (rigData: any, metricName: string) => {
    const values = Object.values(rigData[metricName] || {}).map((v: any) => v.value);
    return values.reduce((sum: number, val: number) => sum + val, 0);
  };

  if (reportsLoading || rigsLoading) {
    return <Skeleton className="h-96 w-full" />;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Budget Preview - 2025</CardTitle>
          <CardDescription>View and analyze budget data across reports, rigs, and metrics</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Report Type</label>
              <Select value={selectedReport} onValueChange={setSelectedReport}>
                <SelectTrigger>
                  <SelectValue placeholder="All Reports" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Reports</SelectItem>
                  {reports?.map((report) => (
                    <SelectItem key={report.id} value={report.id}>
                      {report.display_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Rig</label>
              <Select value={selectedRig} onValueChange={setSelectedRig}>
                <SelectTrigger>
                  <SelectValue placeholder="All Rigs" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Rigs</SelectItem>
                  {rigs?.map((rig) => (
                    <SelectItem key={rig.id} value={rig.id}>
                      {rig.rig_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Metric</label>
              <Select 
                value={selectedMetric} 
                onValueChange={setSelectedMetric}
                disabled={!selectedReport}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Metrics" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Metrics</SelectItem>
                  {metrics?.map((metric) => (
                    <SelectItem key={metric.id} value={metric.id}>
                      {metric.display_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {budgetLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : !budgetData || budgetData.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No budget data found. Try adjusting your filters or import actuals first.
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedData || {}).map(([rigName, rigData]: [string, any]) => (
                <Card key={rigName}>
                  <CardHeader>
                    <CardTitle className="text-lg">{rigName}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="font-semibold">Metric</TableHead>
                            {MONTHS.map((month) => (
                              <TableHead key={month} className="text-center min-w-[100px]">
                                {month.substring(0, 3)}
                              </TableHead>
                            ))}
                            <TableHead className="text-center font-semibold">Total</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {Object.entries(rigData).map(([metricName, monthData]: [string, any]) => (
                            <TableRow key={metricName}>
                              <TableCell className="font-medium">{metricName}</TableCell>
                              {MONTHS.map((_, monthIndex) => {
                                const data = monthData[monthIndex + 1];
                                return (
                                  <TableCell key={monthIndex} className="text-center">
                                    {data ? (
                                      <Badge variant="outline">
                                        {formatValue(data.value, data.format, data.unit)}
                                      </Badge>
                                    ) : (
                                      <span className="text-muted-foreground">-</span>
                                    )}
                                  </TableCell>
                                );
                              })}
                              <TableCell className="text-center">
                                <Badge>
                                  {formatValue(
                                    calculateTotal(rigData, metricName),
                                    monthData[1]?.format,
                                    monthData[1]?.unit
                                  )}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

import { useState } from "react";
import { DashboardLayout } from "@/components/Layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from "recharts";
import { 
  TrendingUp, TrendingDown, FileCheck, AlertCircle, 
  CheckCircle2, XCircle, FileSpreadsheet, Clipboard,
  Activity, BarChart3
} from "lucide-react";
import {
  useImportStatistics,
  useCommonValidationErrors,
  useRecentImportLogs,
  useDataQualityKPIs,
} from "@/hooks/useDataQualityStats";
import { format } from "date-fns";
import DataCleaningSuggestions from "@/components/Admin/DataCleaningSuggestions";

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

export default function DataQuality() {
  const [timeRange, setTimeRange] = useState<number>(30);
  const [groupBy, setGroupBy] = useState<'day' | 'hour'>('day');

  const { data: kpis } = useDataQualityKPIs(timeRange);
  const { data: statistics } = useImportStatistics(timeRange, groupBy);
  const { data: commonErrors } = useCommonValidationErrors(timeRange, 10);
  const { data: recentLogs } = useRecentImportLogs(50);

  const kpiCards = [
    {
      title: "Total Imports",
      value: kpis?.totalImports || 0,
      icon: FileSpreadsheet,
      trend: kpis && kpis.totalImports > 0 ? '+' : '',
      color: "text-blue-500",
    },
    {
      title: "Success Rate",
      value: `${kpis?.successRate.toFixed(1) || 0}%`,
      icon: kpis && kpis.successRate >= 80 ? CheckCircle2 : AlertCircle,
      trend: kpis && kpis.successRate >= 80 ? '+' : '-',
      color: kpis && kpis.successRate >= 80 ? "text-green-500" : "text-orange-500",
    },
    {
      title: "Data Quality Score",
      value: `${kpis?.dataQualityScore.toFixed(1) || 0}%`,
      icon: kpis && kpis.dataQualityScore >= 90 ? TrendingUp : TrendingDown,
      trend: kpis && kpis.dataQualityScore >= 90 ? '+' : '-',
      color: kpis && kpis.dataQualityScore >= 90 ? "text-green-500" : "text-red-500",
    },
    {
      title: "Rows Processed",
      value: kpis?.totalRowsProcessed.toLocaleString() || 0,
      icon: Activity,
      trend: '',
      color: "text-purple-500",
    },
  ];

  // Prepare chart data
  const successTrendData = statistics?.map(stat => ({
    period: stat.period,
    successRate: parseFloat(stat.avg_success_rate.toString()),
    successful: stat.successful_imports,
    failed: stat.failed_imports,
  })).reverse() || [];

  const skippedRowsTrendData = statistics?.map(stat => ({
    period: stat.period,
    skipped: stat.total_rows_skipped,
    valid: stat.total_rows_valid,
  })).reverse() || [];

  const importMethodData = recentLogs
    ? [
        { name: 'Excel Upload', value: recentLogs.filter(l => l.import_method === 'excel').length },
        { name: 'Copy & Paste', value: recentLogs.filter(l => l.import_method === 'paste').length },
      ]
    : [];

  const reportTypeData = recentLogs
    ? Object.entries(
        recentLogs.reduce((acc, log) => {
          acc[log.report_type] = (acc[log.report_type] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      ).map(([name, value]) => ({ name, value }))
    : [];

  return (
    <DashboardLayout>
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Data Quality Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Monitor import statistics, validation errors, and data quality trends
            </p>
          </div>
          <div className="flex gap-2">
            <Select value={timeRange.toString()} onValueChange={(v) => setTimeRange(parseInt(v))}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
            <Select value={groupBy} onValueChange={(v) => setGroupBy(v as 'day' | 'hour')}>
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">Daily</SelectItem>
                <SelectItem value="hour">Hourly</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {kpiCards.map((kpi, index) => {
            const Icon = kpi.icon;
            return (
              <Card key={index}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{kpi.title}</CardTitle>
                  <Icon className={`h-4 w-4 ${kpi.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{kpi.value}</div>
                  {kpi.trend && (
                    <p className={`text-xs ${kpi.color}`}>
                      {kpi.trend} from previous period
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Tabs defaultValue="suggestions" className="space-y-4">
          <TabsList>
            <TabsTrigger value="suggestions">AI Suggestions</TabsTrigger>
            <TabsTrigger value="trends">Trends</TabsTrigger>
            <TabsTrigger value="errors">Validation Errors</TabsTrigger>
            <TabsTrigger value="logs">Recent Imports</TabsTrigger>
            <TabsTrigger value="distribution">Distribution</TabsTrigger>
          </TabsList>

          {/* AI Suggestions Tab */}
          <TabsContent value="suggestions" className="space-y-4">
            <DataCleaningSuggestions commonErrors={commonErrors || []} />
          </TabsContent>

          {/* Trends Tab */}
          <TabsContent value="trends" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Import Success Rate Trend</CardTitle>
                  <CardDescription>
                    Success rate percentage over time
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={successTrendData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="period" />
                      <YAxis domain={[0, 100]} />
                      <Tooltip />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="successRate" 
                        stroke="hsl(var(--chart-1))" 
                        strokeWidth={2}
                        name="Success Rate %"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Successful vs Failed Imports</CardTitle>
                  <CardDescription>
                    Import outcomes over time
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={successTrendData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="period" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="successful" fill="hsl(var(--chart-2))" name="Successful" />
                      <Bar dataKey="failed" fill="hsl(var(--chart-5))" name="Failed" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Skipped vs Valid Rows Trend</CardTitle>
                  <CardDescription>
                    Template rows skipped vs valid data rows processed
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={skippedRowsTrendData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="period" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="valid" fill="hsl(var(--chart-2))" name="Valid Rows" />
                      <Bar dataKey="skipped" fill="hsl(var(--chart-4))" name="Skipped Rows" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Validation Errors Tab */}
          <TabsContent value="errors" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Most Common Validation Errors</CardTitle>
                <CardDescription>
                  Top validation issues across all imports in the last {timeRange} days
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Error Message</TableHead>
                      <TableHead className="text-right">Count</TableHead>
                      <TableHead>Affected Report Types</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {commonErrors?.map((error, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{error.error_message}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant="destructive">{error.error_count}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {error.report_types.map((type, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {type}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Recent Imports Tab */}
          <TabsContent value="logs" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Import Activity</CardTitle>
                <CardDescription>
                  Last 50 import operations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date/Time</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Report Type</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead className="text-right">Total Rows</TableHead>
                      <TableHead className="text-right">Valid</TableHead>
                      <TableHead className="text-right">Errors</TableHead>
                      <TableHead className="text-right">Skipped</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentLogs?.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="text-sm">
                          {format(new Date(log.created_at), 'MMM dd, HH:mm')}
                        </TableCell>
                        <TableCell className="text-sm">{log.user_email}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{log.report_type}</Badge>
                        </TableCell>
                        <TableCell>
                          {log.import_method === 'excel' ? (
                            <FileSpreadsheet className="h-4 w-4 text-green-500" />
                          ) : (
                            <Clipboard className="h-4 w-4 text-blue-500" />
                          )}
                        </TableCell>
                        <TableCell className="text-right">{log.total_rows}</TableCell>
                        <TableCell className="text-right text-green-600">{log.valid_rows}</TableCell>
                        <TableCell className="text-right text-red-600">{log.error_rows}</TableCell>
                        <TableCell className="text-right text-orange-600">{log.skipped_rows}</TableCell>
                        <TableCell>
                          {log.success ? (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-500" />
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Distribution Tab */}
          <TabsContent value="distribution" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Import Method Distribution</CardTitle>
                  <CardDescription>
                    Excel upload vs copy & paste
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={importMethodData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={(entry: any) => `${entry.name}: ${((entry.percent || 0) * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {importMethodData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Report Type Distribution</CardTitle>
                  <CardDescription>
                    Imports by report type
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={reportTypeData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" width={120} />
                      <Tooltip />
                      <Bar dataKey="value" fill="hsl(var(--chart-3))" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { TrendingUp, Building2, Drill, DollarSign } from "lucide-react";

interface BudgetSummaryDashboardProps {
  versionId: string;
}

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

export function BudgetSummaryDashboard({ versionId }: BudgetSummaryDashboardProps) {
  const { data: budgetSummary, isLoading } = useQuery({
    queryKey: ["budget-summary", versionId],
    queryFn: async () => {
      // Fetch all budget data with related dimensions
      const { data: budgetData, error } = await supabase
        .from("fact_budget")
        .select(`
          budget_value,
          currency,
          rig:dim_rig!inner(rig_code, rig_name),
          report:dim_report!inner(report_key, display_name, department),
          metric:dim_metric!inner(metric_key, display_name)
        `)
        .eq("version_id", versionId)
        .eq("year", 2025);

      if (error) throw error;
      if (!budgetData) return null;

      // Calculate totals by department
      const departmentTotals = budgetData.reduce((acc: any, item: any) => {
        const dept = item.report.department;
        if (!acc[dept]) {
          acc[dept] = { department: dept, total: 0, count: 0 };
        }
        acc[dept].total += item.budget_value;
        acc[dept].count += 1;
        return acc;
      }, {});

      // Calculate totals by rig
      const rigTotals = budgetData.reduce((acc: any, item: any) => {
        const rig = item.rig.rig_name;
        if (!acc[rig]) {
          acc[rig] = { rig: rig, total: 0, count: 0 };
        }
        acc[rig].total += item.budget_value;
        acc[rig].count += 1;
        return acc;
      }, {});

      // Calculate totals by report type
      const reportTotals = budgetData.reduce((acc: any, item: any) => {
        const report = item.report.display_name;
        if (!acc[report]) {
          acc[report] = { report: report, total: 0, count: 0, department: item.report.department };
        }
        acc[report].total += item.budget_value;
        acc[report].count += 1;
        return acc;
      }, {});

      const grandTotal = budgetData.reduce((sum, item: any) => sum + item.budget_value, 0);
      
      return {
        grandTotal,
        totalRecords: budgetData.length,
        currency: budgetData[0]?.currency || "OMR",
        departments: Object.values(departmentTotals),
        rigs: Object.values(rigTotals),
        reports: Object.values(reportTotals),
      };
    },
    enabled: !!versionId,
  });

  const formatCurrency = (value: number, currency: string = "OMR") => {
    return `${value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })} ${currency}`;
  };

  if (isLoading) {
    return <Skeleton className="h-96 w-full" />;
  }

  if (!budgetSummary) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No budget data available for summary.
      </div>
    );
  }

  const departmentData = (budgetSummary.departments as any[])
    .sort((a, b) => b.total - a.total)
    .map((d, idx) => ({ ...d, fill: COLORS[idx % COLORS.length] }));

  const rigData = (budgetSummary.rigs as any[])
    .sort((a, b) => b.total - a.total)
    .map((r, idx) => ({ ...r, fill: COLORS[idx % COLORS.length] }));

  const topRigs = rigData.slice(0, 10);
  const topReports = (budgetSummary.reports as any[])
    .sort((a, b) => b.total - a.total)
    .slice(0, 8);

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(budgetSummary.grandTotal, budgetSummary.currency)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Across all departments and rigs
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Departments</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{departmentData.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Active departments in budget
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rigs</CardTitle>
            <Drill className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rigData.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Total rigs with budget
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Budget Lines</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{budgetSummary.totalRecords.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Total budget entries
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Budget by Department</CardTitle>
            <CardDescription>Total budget allocation across departments</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={departmentData}
                  dataKey="total"
                  nameKey="department"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={(entry: any) => `${entry.department}: ${formatCurrency(entry.total, budgetSummary.currency)}`}
                >
                  {departmentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: any) => formatCurrency(Number(value), budgetSummary.currency)}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Rigs */}
        <Card>
          <CardHeader>
            <CardTitle>Top 10 Rigs by Budget</CardTitle>
            <CardDescription>Highest budget allocations by rig</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topRigs} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" tickFormatter={(value) => `${(Number(value) / 1000).toFixed(0)}K`} />
                <YAxis type="category" dataKey="rig" width={80} />
                <Tooltip
                  formatter={(value: any) => formatCurrency(Number(value), budgetSummary.currency)}
                />
                <Bar dataKey="total" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Report Types Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Budget by Report Type</CardTitle>
          <CardDescription>Breakdown of budget across different report categories</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={topReports}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="report" angle={-45} textAnchor="end" height={100} />
              <YAxis tickFormatter={(value) => `${(Number(value) / 1000).toFixed(0)}K`} />
              <Tooltip
                formatter={(value: any) => formatCurrency(Number(value), budgetSummary.currency)}
              />
              <Legend />
              <Bar dataKey="total" fill="hsl(var(--chart-2))" name="Total Budget" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Detailed Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Department Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {departmentData.map((dept: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-4 h-4 rounded-full" 
                      style={{ backgroundColor: dept.fill }}
                    />
                    <div>
                      <div className="font-medium">{dept.department}</div>
                      <div className="text-xs text-muted-foreground">{dept.count} budget lines</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">{formatCurrency(dept.total, budgetSummary.currency)}</div>
                    <div className="text-xs text-muted-foreground">
                      {((dept.total / budgetSummary.grandTotal) * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Rig Summary (Top 10)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {topRigs.map((rig: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-4 h-4 rounded-full" 
                      style={{ backgroundColor: rig.fill }}
                    />
                    <div>
                      <div className="font-medium">{rig.rig}</div>
                      <div className="text-xs text-muted-foreground">{rig.count} budget lines</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">{formatCurrency(rig.total, budgetSummary.currency)}</div>
                    <div className="text-xs text-muted-foreground">
                      {((rig.total / budgetSummary.grandTotal) * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

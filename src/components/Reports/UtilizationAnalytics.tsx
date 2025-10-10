import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { TrendingUp, TrendingDown, Award, AlertTriangle } from "lucide-react";

interface UtilizationAnalyticsProps {
  data: any[];
}

export const UtilizationAnalytics = ({ data }: UtilizationAnalyticsProps) => {
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">No data available for analysis</p>
        </CardContent>
      </Card>
    );
  }

  // Calculate analytics
  const avgUtilization = data.reduce((sum, row) => sum + (Number(row.utilization_rate) || 0), 0) / data.length;
  
  // Top performing rigs
  const rigPerformance = data.reduce((acc: any, row) => {
    const rig = row.rig;
    if (!acc[rig]) {
      acc[rig] = { rig, total: 0, count: 0 };
    }
    acc[rig].total += Number(row.utilization_rate) || 0;
    acc[rig].count += 1;
    return acc;
  }, {});

  const topRigs = Object.values(rigPerformance)
    .map((r: any) => ({ rig: r.rig, avgUtilization: r.total / r.count }))
    .sort((a: any, b: any) => b.avgUtilization - a.avgUtilization)
    .slice(0, 5);

  // Utilization distribution
  const distributionBuckets = [
    { range: "0-20%", count: 0, color: "#ef4444" },
    { range: "21-40%", count: 0, color: "#f97316" },
    { range: "41-60%", count: 0, color: "#eab308" },
    { range: "61-80%", count: 0, color: "#84cc16" },
    { range: "81-100%", count: 0, color: "#22c55e" },
  ];

  data.forEach(row => {
    const util = Number(row.utilization_rate) || 0;
    if (util <= 20) distributionBuckets[0].count++;
    else if (util <= 40) distributionBuckets[1].count++;
    else if (util <= 60) distributionBuckets[2].count++;
    else if (util <= 80) distributionBuckets[3].count++;
    else distributionBuckets[4].count++;
  });

  // Monthly trend
  const monthlyData = data.reduce((acc: any, row) => {
    const key = `${row.year}-${row.month}`;
    if (!acc[key]) {
      acc[key] = { period: `${row.month} ${row.year}`, total: 0, count: 0 };
    }
    acc[key].total += Number(row.utilization_rate) || 0;
    acc[key].count += 1;
    return acc;
  }, {});

  const trendData = Object.values(monthlyData)
    .map((m: any) => ({ period: m.period, utilization: (m.total / m.count).toFixed(1) }))
    .slice(-12);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Average Utilization</CardDescription>
            <CardTitle className="text-3xl">{avgUtilization.toFixed(1)}%</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm">
              {avgUtilization >= 80 ? (
                <>
                  <TrendingUp className="h-4 w-4 text-success" />
                  <span className="text-success">Excellent</span>
                </>
              ) : (
                <>
                  <TrendingDown className="h-4 w-4 text-warning" />
                  <span className="text-warning">Needs Attention</span>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Records</CardDescription>
            <CardTitle className="text-3xl">{data.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Across all rigs and periods</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Active Rigs</CardDescription>
            <CardTitle className="text-3xl">{Object.keys(rigPerformance).length}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Unique rigs tracked</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>High Utilization</CardDescription>
            <CardTitle className="text-3xl">
              {data.filter(d => Number(d.utilization_rate) >= 80).length}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Records ≥ 80% utilization</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Top 5 Performing Rigs</CardTitle>
            <CardDescription>By average utilization rate</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topRigs}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="rig" />
                <YAxis domain={[0, 100]} />
                <Tooltip formatter={(value: any) => `${Number(value).toFixed(1)}%`} />
                <Bar dataKey="avgUtilization" fill="hsl(var(--chart-1))" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Utilization Distribution</CardTitle>
            <CardDescription>Number of records by utilization range</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={distributionBuckets}
                  dataKey="count"
                  nameKey="range"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={(entry) => `${entry.range}: ${entry.count}`}
                >
                  {distributionBuckets.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Utilization Trend (Last 12 Periods)</CardTitle>
          <CardDescription>Average utilization rate over time</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="period" angle={-45} textAnchor="end" height={80} />
              <YAxis domain={[0, 100]} />
              <Tooltip formatter={(value: any) => `${value}%`} />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="utilization" 
                stroke="hsl(var(--chart-1))" 
                strokeWidth={2}
                name="Utilization Rate"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Best Performers List */}
      <Card>
        <CardHeader>
          <CardTitle>Rig Performance Rankings</CardTitle>
          <CardDescription>All rigs sorted by average utilization</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.values(rigPerformance)
              .map((r: any) => ({ rig: r.rig, avgUtilization: r.total / r.count, records: r.count }))
              .sort((a: any, b: any) => b.avgUtilization - a.avgUtilization)
              .map((rig: any, index) => (
                <div key={rig.rig} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10">
                      <span className="text-sm font-bold">#{index + 1}</span>
                    </div>
                    <div>
                      <p className="font-medium">{rig.rig}</p>
                      <p className="text-sm text-muted-foreground">{rig.records} records</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={rig.avgUtilization >= 80 ? "default" : rig.avgUtilization >= 60 ? "secondary" : "destructive"}>
                      {rig.avgUtilization.toFixed(1)}%
                    </Badge>
                    {index === 0 && <Award className="h-5 w-5 text-yellow-500" />}
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

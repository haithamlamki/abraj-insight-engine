import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { useMemo } from "react";

interface YTDAnalyticsProps {
  data: any[];
}

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

export const YTDAnalytics = ({ data }: YTDAnalyticsProps) => {
  // Calculate summary statistics
  const stats = useMemo(() => {
    const totalHours = data.reduce((sum, item) => sum + (parseFloat(item.npt_hours) || 0), 0);
    const avgHours = data.length > 0 ? totalHours / data.length : 0;
    const billableCount = data.filter(item => item.billable === true).length;
    const nonBillableCount = data.filter(item => item.billable === false).length;
    
    return {
      totalHours: totalHours.toFixed(1),
      avgHours: avgHours.toFixed(1),
      totalIncidents: data.length,
      billableCount,
      nonBillableCount,
      billablePercent: data.length > 0 ? ((billableCount / data.length) * 100).toFixed(1) : 0
    };
  }, [data]);

  // NPT by System
  const nptBySystem = useMemo(() => {
    const systemMap = new Map();
    data.forEach(item => {
      const system = item.system || 'Unknown';
      const hours = parseFloat(item.npt_hours) || 0;
      systemMap.set(system, (systemMap.get(system) || 0) + hours);
    });
    return Array.from(systemMap.entries())
      .map(([system, hours]) => ({ system, hours: parseFloat(hours.toFixed(1)) }))
      .sort((a, b) => b.hours - a.hours)
      .slice(0, 10);
  }, [data]);

  // NPT by Rig
  const nptByRig = useMemo(() => {
    const rigMap = new Map();
    data.forEach(item => {
      const rig = item.rig || 'Unknown';
      const hours = parseFloat(item.npt_hours) || 0;
      rigMap.set(rig, (rigMap.get(rig) || 0) + hours);
    });
    return Array.from(rigMap.entries())
      .map(([rig, hours]) => ({ rig, hours: parseFloat(hours.toFixed(1)) }))
      .sort((a, b) => b.hours - a.hours)
      .slice(0, 10);
  }, [data]);

  // Billable vs Non-Billable
  const billableData = useMemo(() => {
    const billableHours = data.filter(i => i.billable === true).reduce((s: number, i) => s + (parseFloat(String(i.npt_hours)) || 0), 0);
    const nonBillableHours = data.filter(i => i.billable === false).reduce((s: number, i) => s + (parseFloat(String(i.npt_hours)) || 0), 0);
    return [
      { name: 'Billable', value: stats.billableCount, hours: billableHours },
      { name: 'Non-Billable', value: stats.nonBillableCount, hours: nonBillableHours }
    ];
  }, [data, stats]);

  // Monthly trend
  const monthlyTrend = useMemo(() => {
    const monthMap = new Map();
    data.forEach(item => {
      const key = `${item.year}-${item.month}`;
      const hours = parseFloat(item.npt_hours) || 0;
      if (!monthMap.has(key)) {
        monthMap.set(key, { period: key, hours: 0, count: 0 });
      }
      const current = monthMap.get(key);
      current.hours += hours;
      current.count += 1;
    });
    return Array.from(monthMap.values())
      .map(item => ({ ...item, hours: parseFloat(item.hours.toFixed(1)) }))
      .sort((a, b) => a.period.localeCompare(b.period));
  }, [data]);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total NPT Hours</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalHours}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg Hours/Incident</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgHours}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Incidents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalIncidents}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Billable %</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.billablePercent}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>NPT Hours by System</CardTitle>
            <CardDescription>Top 10 systems by total NPT hours</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={nptBySystem}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="system" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="hours" fill="hsl(var(--chart-1))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>NPT Hours by Rig</CardTitle>
            <CardDescription>Top 10 rigs by total NPT hours</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={nptByRig}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="rig" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="hours" fill="hsl(var(--chart-2))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Billable vs Non-Billable</CardTitle>
            <CardDescription>Distribution of NPT incidents</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={billableData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry: any) => `${entry.name}: ${((entry.percent || 0) * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {billableData.map((entry, index) => (
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
            <CardTitle>Monthly NPT Trend</CardTitle>
            <CardDescription>NPT hours over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="hours" stroke="hsl(var(--chart-3))" name="NPT Hours" />
                <Line type="monotone" dataKey="count" stroke="hsl(var(--chart-4))" name="Incident Count" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

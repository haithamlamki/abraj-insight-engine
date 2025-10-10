import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { TrendingUp, TrendingDown, Clock, DollarSign, AlertTriangle, Wrench } from "lucide-react";

interface BillingNPTAnalyticsProps {
  data: any[];
}

export const BillingNPTAnalytics = ({ data }: BillingNPTAnalyticsProps) => {
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">No data available for analysis</p>
        </CardContent>
      </Card>
    );
  }

  // Calculate key metrics
  const totalNPTHours = data.reduce((sum, row) => sum + (Number(row.npt_hours) || 0), 0);
  const totalIncidents = data.length;
  const billableCount = data.filter(row => row.billable === true).length;
  const nonBillableCount = totalIncidents - billableCount;
  const billableRate = ((billableCount / totalIncidents) * 100).toFixed(1);

  // System-wise NPT breakdown
  const systemBreakdown = data.reduce((acc: any, row) => {
    const system = row.system || 'Unknown';
    if (!acc[system]) {
      acc[system] = { system, hours: 0, incidents: 0 };
    }
    acc[system].hours += Number(row.npt_hours) || 0;
    acc[system].incidents += 1;
    return acc;
  }, {});

  const topSystems = Object.values(systemBreakdown)
    .sort((a: any, b: any) => b.hours - a.hours)
    .slice(0, 8);

  // NPT Type distribution
  const nptTypeData = data.reduce((acc: any, row) => {
    const type = row.npt_type || 'Unknown';
    if (!acc[type]) {
      acc[type] = { type, count: 0, hours: 0 };
    }
    acc[type].count += 1;
    acc[type].hours += Number(row.npt_hours) || 0;
    return acc;
  }, {});

  const nptTypePie = Object.values(nptTypeData).map((item: any) => ({
    name: item.type,
    value: item.hours,
    count: item.count
  }));

  const COLORS = ['#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6'];

  // Rig performance
  const rigPerformance = data.reduce((acc: any, row) => {
    const rig = row.rig || 'Unknown';
    if (!acc[rig]) {
      acc[rig] = { rig, hours: 0, incidents: 0 };
    }
    acc[rig].hours += Number(row.npt_hours) || 0;
    acc[rig].incidents += 1;
    return acc;
  }, {});

  const topRigs = Object.values(rigPerformance)
    .sort((a: any, b: any) => b.hours - a.hours)
    .slice(0, 10);

  // Monthly trend
  const monthlyData = data.reduce((acc: any, row) => {
    const key = `${row.year}-${String(row.month).padStart(2, '0')}`;
    if (!acc[key]) {
      acc[key] = { 
        period: `${row.month}/${row.year}`, 
        hours: 0, 
        incidents: 0,
        billable: 0,
        nonBillable: 0
      };
    }
    acc[key].hours += Number(row.npt_hours) || 0;
    acc[key].incidents += 1;
    if (row.billable) {
      acc[key].billable += Number(row.npt_hours) || 0;
    } else {
      acc[key].nonBillable += Number(row.npt_hours) || 0;
    }
    return acc;
  }, {});

  const trendData = Object.values(monthlyData)
    .sort((a: any, b: any) => a.period.localeCompare(b.period))
    .slice(-12);

  // Department responsibility
  const deptData = data.reduce((acc: any, row) => {
    const dept = row.department_responsibility || 'Not Assigned';
    if (!acc[dept]) {
      acc[dept] = { department: dept, incidents: 0, hours: 0 };
    }
    acc[dept].incidents += 1;
    acc[dept].hours += Number(row.npt_hours) || 0;
    return acc;
  }, {});

  const topDepts = Object.values(deptData)
    .sort((a: any, b: any) => b.hours - a.hours)
    .slice(0, 6);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total NPT Hours</CardDescription>
            <CardTitle className="text-3xl">{totalNPTHours.toFixed(1)}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Across all incidents</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Incidents</CardDescription>
            <CardTitle className="text-3xl">{totalIncidents}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm">
              <AlertTriangle className="h-4 w-4 text-warning" />
              <span className="text-muted-foreground">NPT events recorded</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Billable Rate</CardDescription>
            <CardTitle className="text-3xl">{billableRate}%</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm">
              <DollarSign className="h-4 w-4 text-success" />
              <span className="text-muted-foreground">{billableCount} billable events</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Avg Hours/Incident</CardDescription>
            <CardTitle className="text-3xl">{(totalNPTHours / totalIncidents).toFixed(1)}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm">
              <Wrench className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Per event average</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1: System & NPT Type */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>NPT Hours by System</CardTitle>
            <CardDescription>Top 8 systems by total NPT hours</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={topSystems} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis type="category" dataKey="system" width={120} />
                <Tooltip 
                  formatter={(value: any, name: string) => {
                    if (name === 'hours') return [`${Number(value).toFixed(1)} hrs`, 'NPT Hours'];
                    return [`${value}`, 'Incidents'];
                  }}
                />
                <Legend />
                <Bar dataKey="hours" fill="hsl(var(--destructive))" radius={[0, 8, 8, 0]} name="NPT Hours" />
                <Bar dataKey="incidents" fill="hsl(var(--chart-2))" radius={[0, 8, 8, 0]} name="Incidents" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>NPT Type Distribution</CardTitle>
            <CardDescription>Hours breakdown by NPT type</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <PieChart>
                <Pie
                  data={nptTypePie}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={120}
                  label={(entry) => `${entry.name}: ${Number(entry.value).toFixed(0)}h`}
                >
                  {nptTypePie.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: any) => `${Number(value).toFixed(1)} hours`} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Trend */}
      <Card>
        <CardHeader>
          <CardTitle>NPT Trend (Last 12 Months)</CardTitle>
          <CardDescription>Monthly NPT hours split by billable status</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="period" angle={-45} textAnchor="end" height={80} />
              <YAxis />
              <Tooltip formatter={(value: any) => `${Number(value).toFixed(1)} hrs`} />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="hours" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                name="Total NPT Hours"
              />
              <Line 
                type="monotone" 
                dataKey="billable" 
                stroke="hsl(var(--success))" 
                strokeWidth={2}
                name="Billable Hours"
              />
              <Line 
                type="monotone" 
                dataKey="nonBillable" 
                stroke="hsl(var(--destructive))" 
                strokeWidth={2}
                name="Non-Billable Hours"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Bottom Row: Rigs & Departments */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Top 10 Rigs by NPT Hours</CardTitle>
            <CardDescription>Rigs with highest total NPT</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topRigs.map((rig: any, index) => (
                <div key={rig.rig} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-destructive/10">
                      <span className="text-sm font-bold">#{index + 1}</span>
                    </div>
                    <div>
                      <p className="font-medium">{rig.rig}</p>
                      <p className="text-sm text-muted-foreground">{rig.incidents} incidents</p>
                    </div>
                  </div>
                  <Badge variant="destructive">
                    {rig.hours.toFixed(1)} hrs
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Department Responsibility</CardTitle>
            <CardDescription>NPT hours by responsible department</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topDepts}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="department" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip formatter={(value: any) => `${Number(value).toFixed(1)} hrs`} />
                <Bar dataKey="hours" fill="hsl(var(--chart-3))" radius={[8, 8, 0, 0]} name="NPT Hours" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

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

  const allRigs = Object.values(rigPerformance)
    .sort((a: any, b: any) => b.hours - a.hours);

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

      {/* Bottom Row: All Rigs & Departments */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>All Rigs by NPT Hours</CardTitle>
            <CardDescription>Complete rig rankings sorted by total NPT</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
              {allRigs.map((rig: any, index) => (
                <div key={rig.rig} className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-destructive/10">
                      <span className="text-sm font-bold">#{index + 1}</span>
                    </div>
                    <div>
                      <p className="font-medium">{rig.rig}</p>
                      <p className="text-sm text-muted-foreground">{rig.incidents} incidents</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge variant={index < 5 ? "destructive" : "secondary"}>
                      {Number(rig.hours).toFixed(1)} hrs
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {(Number(rig.hours) / rig.incidents).toFixed(1)} hrs/incident
                    </span>
                  </div>
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
            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
              {Object.values(deptData)
                .sort((a: any, b: any) => b.hours - a.hours)
                .map((dept: any, index) => (
                  <div key={dept.department} className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-chart-3/10">
                        <span className="text-sm font-bold">#{index + 1}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{dept.department}</p>
                        <p className="text-sm text-muted-foreground">{dept.incidents} incidents</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="ml-2">
                      {Number(dept.hours).toFixed(1)} hrs
                    </Badge>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Analysis */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Root Cause Analysis</CardTitle>
            <CardDescription>Most common root causes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {(() => {
                const rootCauses = data.reduce((acc: any, row) => {
                  const cause = row.root_cause || 'Not Specified';
                  if (!acc[cause]) acc[cause] = 0;
                  acc[cause]++;
                  return acc;
                }, {});
                return Object.entries(rootCauses)
                  .sort((a: any, b: any) => b[1] - a[1])
                  .slice(0, 8)
                  .map(([cause, count]: [string, any]) => (
                    <div key={cause} className="flex items-center justify-between text-sm">
                      <span className="truncate flex-1 mr-2">{cause}</span>
                      <Badge variant="secondary">{count}</Badge>
                    </div>
                  ));
              })()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Equipment Failures</CardTitle>
            <CardDescription>Top parent equipment issues</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {(() => {
                const equipment = data.reduce((acc: any, row) => {
                  const eq = row.parent_equipment_failure || 'Not Specified';
                  if (!acc[eq]) acc[eq] = 0;
                  acc[eq]++;
                  return acc;
                }, {});
                return Object.entries(equipment)
                  .sort((a: any, b: any) => b[1] - a[1])
                  .slice(0, 8)
                  .map(([eq, count]: [string, any]) => (
                    <div key={eq} className="flex items-center justify-between text-sm">
                      <span className="truncate flex-1 mr-2">{eq}</span>
                      <Badge variant="secondary">{count}</Badge>
                    </div>
                  ));
              })()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contractual Process</CardTitle>
            <CardDescription>NPT by contractual process</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {(() => {
                const processes = data.reduce((acc: any, row) => {
                  const proc = row.contractual_process || 'Not Specified';
                  if (!acc[proc]) acc[proc] = { count: 0, hours: 0 };
                  acc[proc].count++;
                  acc[proc].hours += Number(row.npt_hours) || 0;
                  return acc;
                }, {});
                return Object.entries(processes)
                  .sort((a: any, b: any) => b[1].hours - a[1].hours)
                  .slice(0, 8)
                  .map(([proc, data]: [string, any]) => (
                    <div key={proc} className="flex items-center justify-between text-sm">
                      <span className="truncate flex-1 mr-2">{proc}</span>
                      <div className="flex items-center gap-1">
                        <Badge variant="outline">{data.count}</Badge>
                        <Badge variant="secondary">{data.hours.toFixed(0)}h</Badge>
                      </div>
                    </div>
                  ));
              })()}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

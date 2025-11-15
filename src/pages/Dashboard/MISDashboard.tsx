import { useState, useMemo } from "react";
import { DashboardLayout } from "@/components/Layout/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMISData } from "@/hooks/useMISData";
import { KPICard } from "@/components/Dashboard/KPICard";
import { ChartCard } from "@/components/Dashboard/ChartCard";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TrendingUp, TrendingDown, DollarSign, Clock, AlertTriangle, CheckCircle2, Gauge, Fuel, MapPin, Target } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const COLORS = ["hsl(var(--primary))", "hsl(var(--secondary))", "hsl(var(--accent))", "hsl(var(--muted))"];

export default function MISDashboard() {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [selectedMonth, setSelectedMonth] = useState<string>("all");
  const [selectedRigs, setSelectedRigs] = useState<string[]>([]);

  const { data: misData, isLoading } = useMISData({
    year: selectedYear,
    month: selectedMonth === "all" ? undefined : selectedMonth,
    rigs: selectedRigs.length > 0 ? selectedRigs : undefined,
  });

  const kpis = misData?.kpis;
  const data = misData?.data;

  // Get unique rigs
  const availableRigs = useMemo(() => {
    if (!data) return [];
    const rigs = new Set<string>();
    data.revenue.forEach(r => rigs.add(r.rig));
    data.utilization.forEach(u => rigs.add(u.rig));
    return Array.from(rigs).sort();
  }, [data]);

  // Revenue by Rig
  const revenueByRig = useMemo(() => {
    if (!data?.revenue) return [];
    const rigMap = new Map<string, number>();
    data.revenue.forEach(r => {
      const current = rigMap.get(r.rig) || 0;
      rigMap.set(r.rig, current + (Number(r.revenue_actual) || 0));
    });
    return Array.from(rigMap.entries())
      .map(([rig, revenue]) => ({ rig, revenue }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);
  }, [data]);

  // NPT by Type
  const nptByType = useMemo(() => {
    if (!data?.billingNpt) return [];
    const typeMap = new Map<string, number>();
    data.billingNpt.forEach(n => {
      const type = n.npt_type || "Unknown";
      const current = typeMap.get(type) || 0;
      typeMap.set(type, current + (Number(n.npt_hours) || 0));
    });
    return Array.from(typeMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [data]);

  // Utilization Trend by Month
  const utilizationTrend = useMemo(() => {
    if (!data?.utilization) return [];
    const monthMap = new Map<string, { sum: number; count: number }>();
    data.utilization.forEach(u => {
      const month = u.month;
      const current = monthMap.get(month) || { sum: 0, count: 0 };
      monthMap.set(month, {
        sum: current.sum + (Number(u.utilization_rate) || 0),
        count: current.count + 1,
      });
    });
    return MONTHS.map(month => ({
      month,
      utilization: monthMap.has(month) 
        ? (monthMap.get(month)!.sum / monthMap.get(month)!.count)
        : 0,
    }));
  }, [data]);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-lg text-muted-foreground">Loading MIS Dashboard...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">MIS Dashboard</h1>
            <p className="text-muted-foreground">Management Information System - Integrated View</p>
          </div>
          <div className="flex gap-4">
            <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(Number(v))}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[currentYear - 2, currentYear - 1, currentYear, currentYear + 1].map(y => (
                  <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="All Months" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Months</SelectItem>
                {MONTHS.map(m => (
                  <SelectItem key={m} value={m}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Top KPIs */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <KPICard
            title="Total Revenue"
            value={`$${((kpis?.totalRevenue || 0) / 1000000).toFixed(2)}M`}
            change={kpis?.revenueVariancePercent || 0}
            trend={kpis && kpis.revenueVariance >= 0 ? "up" : "down"}
          />
          <KPICard
            title="Fleet Utilization"
            value={`${(kpis?.avgUtilization || 0).toFixed(1)}%`}
            change={0}
            trend="up"
          />
          <KPICard
            title="Total NPT Hours"
            value={(kpis?.totalNPT || 0).toFixed(0)}
            change={0}
            trend="down"
          />
          <KPICard
            title="Active Rigs"
            value={kpis?.activeRigs || 0}
            change={0}
            trend="neutral"
          />
        </div>

        {/* Secondary KPIs */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Open Work Orders</p>
                <p className="text-2xl font-bold">{kpis?.totalOpenWOs || 0}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Critical Stock</p>
                <p className="text-2xl font-bold">{kpis?.criticalStock || 0}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Satisfaction</p>
                <p className="text-2xl font-bold">{(kpis?.avgSatisfaction || 0).toFixed(1)}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-primary" />
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Fuel Cost</p>
                <p className="text-2xl font-bold">${((kpis?.totalFuelCost || 0) / 1000).toFixed(0)}K</p>
              </div>
              <Fuel className="h-8 w-8 text-accent" />
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Wells</p>
                <p className="text-2xl font-bold">{kpis?.activeWells || 0}</p>
              </div>
              <MapPin className="h-8 w-8 text-secondary" />
            </div>
          </Card>
        </div>

        {/* Charts Row 1 */}
        <div className="grid gap-6 md:grid-cols-2">
          <ChartCard title="Revenue by Rig" description="Top 10 performing rigs">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={revenueByRig}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="rig" stroke="hsl(var(--foreground))" />
                <YAxis stroke="hsl(var(--foreground))" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "hsl(var(--card))", 
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px"
                  }}
                />
                <Bar dataKey="revenue" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="NPT by Type" description="Distribution of non-productive time">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={nptByType.slice(0, 6)}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry: any) => `${entry.name}: ${Number(entry.value).toFixed(0)}h`}
                  outerRadius={100}
                  fill="hsl(var(--primary))"
                  dataKey="value"
                >
                  {nptByType.slice(0, 6).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "hsl(var(--card))", 
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px"
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Charts Row 2 */}
        <ChartCard title="Fleet Utilization Trend" description="Average utilization by month">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={utilizationTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" stroke="hsl(var(--foreground))" />
              <YAxis stroke="hsl(var(--foreground))" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: "hsl(var(--card))", 
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px"
                }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="utilization" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                name="Utilization %"
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Data Tables */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Recent Rig Moves</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rig</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>From → To</TableHead>
                  <TableHead className="text-right">Cost Variance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.rigMoves.slice(0, 5).map((move) => (
                  <TableRow key={move.id}>
                    <TableCell className="font-medium">{move.rig}</TableCell>
                    <TableCell>{new Date(move.move_date).toLocaleDateString()}</TableCell>
                    <TableCell className="text-sm">{move.from_location} → {move.to_location}</TableCell>
                    <TableCell className={`text-right ${(move.variance_cost || 0) < 0 ? 'text-primary' : 'text-destructive'}`}>
                      ${(move.variance_cost || 0).toFixed(0)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Active Wells</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rig</TableHead>
                  <TableHead>Well</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Depth</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.wells
                  .filter(w => w.status === "Active" || w.status === "Drilling")
                  .slice(0, 5)
                  .map((well) => (
                    <TableRow key={well.id}>
                      <TableCell className="font-medium">{well.rig}</TableCell>
                      <TableCell>{well.well_name}</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                          {well.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        {well.actual_depth || 0} / {well.target_depth || 0}m
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}

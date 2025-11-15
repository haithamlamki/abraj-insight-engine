import { useState, useMemo } from "react";
import { DashboardLayout } from "@/components/Layout/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useMISData } from "@/hooks/useMISData";
import { KPICard } from "@/components/Dashboard/KPICard";
import { ChartCard } from "@/components/Dashboard/ChartCard";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TrendingUp, TrendingDown, DollarSign, Clock, AlertTriangle, CheckCircle2, Gauge, Fuel, MapPin, Target, X, Filter } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const COLORS = ["hsl(var(--primary))", "hsl(var(--secondary))", "hsl(var(--accent))", "hsl(var(--muted))"];

interface DrillDownFilter {
  type: 'rig' | 'npt_type' | 'status' | 'client' | null;
  value: string | null;
}

export default function MISDashboard() {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [selectedMonth, setSelectedMonth] = useState<string>("all");
  const [selectedRigs, setSelectedRigs] = useState<string[]>([]);
  const [drillDown, setDrillDown] = useState<DrillDownFilter>({ type: null, value: null });

  // Apply drill-down filter to selectedRigs
  const effectiveRigs = useMemo(() => {
    if (drillDown.type === 'rig' && drillDown.value) {
      return [drillDown.value];
    }
    return selectedRigs.length > 0 ? selectedRigs : undefined;
  }, [drillDown, selectedRigs]);

  const { data: misData, isLoading } = useMISData({
    year: selectedYear,
    month: selectedMonth === "all" ? undefined : selectedMonth,
    rigs: effectiveRigs,
  });

  // Handle drill-down actions
  const handleDrillDown = (type: DrillDownFilter['type'], value: string) => {
    setDrillDown({ type, value });
  };

  const clearDrillDown = () => {
    setDrillDown({ type: null, value: null });
  };

  const getDrillDownLabel = () => {
    if (!drillDown.type || !drillDown.value) return '';
    
    switch (drillDown.type) {
      case 'rig':
        return `Rig ${drillDown.value}`;
      case 'npt_type':
        return `${drillDown.value} NPT`;
      case 'status':
        return `Status: ${drillDown.value}`;
      case 'client':
        return `Client: ${drillDown.value}`;
      default:
        return drillDown.value;
    }
  };

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

  // Apply drill-down filters to data
  const filteredData = useMemo(() => {
    if (!data || !drillDown.type || !drillDown.value) return data;

    const filtered = { ...data };
    
    if (drillDown.type === 'rig') {
      filtered.revenue = data.revenue.filter(r => r.rig === drillDown.value);
      filtered.utilization = data.utilization.filter(u => u.rig === drillDown.value);
      filtered.billingNpt = data.billingNpt.filter(n => n.rig === drillDown.value);
      filtered.workOrders = data.workOrders.filter(w => w.rig === drillDown.value);
      filtered.fuel = data.fuel.filter(f => f.rig === drillDown.value);
      filtered.stock = data.stock.filter(s => s.rig === drillDown.value);
      filtered.satisfaction = data.satisfaction.filter(s => s.rig === drillDown.value);
      filtered.rigMoves = data.rigMoves.filter(m => m.rig === drillDown.value);
      filtered.wells = data.wells.filter(w => w.rig === drillDown.value);
    } else if (drillDown.type === 'npt_type') {
      filtered.billingNpt = data.billingNpt.filter(n => n.npt_type === drillDown.value);
    } else if (drillDown.type === 'status') {
      filtered.utilization = data.utilization.filter(u => u.status === drillDown.value);
    }

    return filtered;
  }, [data, drillDown]);

  const displayData = filteredData || data;

  // Comparison metrics (filtered vs overall)
  const comparisonMetrics = useMemo(() => {
    if (!drillDown.type || !drillDown.value || !data || !filteredData) return null;

    // Calculate filtered KPIs
    const filteredRevenue = filteredData.revenue.reduce((sum, r) => sum + (Number(r.revenue_actual) || 0), 0);
    const filteredNPT = filteredData.billingNpt.reduce((sum, n) => sum + (Number(n.npt_hours) || 0), 0);
    const filteredUtilization = filteredData.utilization.length > 0
      ? filteredData.utilization.reduce((sum, u) => sum + (Number(u.utilization_rate) || 0), 0) / filteredData.utilization.length
      : 0;
    const filteredFuel = filteredData.fuel.reduce((sum, f) => sum + (Number(f.fuel_cost) || 0), 0);
    const filteredOpenWOs = filteredData.workOrders.reduce((sum, w) => 
      sum + (Number(w.elec_open) || 0) + (Number(w.mech_open) || 0) + (Number(w.oper_open) || 0), 0);

    // Calculate overall KPIs
    const overallRevenue = data.revenue.reduce((sum, r) => sum + (Number(r.revenue_actual) || 0), 0);
    const overallNPT = data.billingNpt.reduce((sum, n) => sum + (Number(n.npt_hours) || 0), 0);
    const overallUtilization = data.utilization.length > 0
      ? data.utilization.reduce((sum, u) => sum + (Number(u.utilization_rate) || 0), 0) / data.utilization.length
      : 0;
    const overallFuel = data.fuel.reduce((sum, f) => sum + (Number(f.fuel_cost) || 0), 0);
    const overallOpenWOs = data.workOrders.reduce((sum, w) => 
      sum + (Number(w.elec_open) || 0) + (Number(w.mech_open) || 0) + (Number(w.oper_open) || 0), 0);

    return {
      revenue: {
        filtered: filteredRevenue,
        overall: overallRevenue,
        variance: overallRevenue > 0 ? ((filteredRevenue - overallRevenue) / overallRevenue) * 100 : 0,
      },
      npt: {
        filtered: filteredNPT,
        overall: overallNPT,
        variance: overallNPT > 0 ? ((filteredNPT - overallNPT) / overallNPT) * 100 : 0,
      },
      utilization: {
        filtered: filteredUtilization,
        overall: overallUtilization,
        variance: overallUtilization > 0 ? ((filteredUtilization - overallUtilization) / overallUtilization) * 100 : 0,
      },
      fuel: {
        filtered: filteredFuel,
        overall: overallFuel,
        variance: overallFuel > 0 ? ((filteredFuel - overallFuel) / overallFuel) * 100 : 0,
      },
      workOrders: {
        filtered: filteredOpenWOs,
        overall: overallOpenWOs,
        variance: overallOpenWOs > 0 ? ((filteredOpenWOs - overallOpenWOs) / overallOpenWOs) * 100 : 0,
      },
    };
  }, [drillDown, data, filteredData]);

  // Revenue by Rig
  const revenueByRig = useMemo(() => {
    if (!displayData?.revenue) return [];
    const rigMap = new Map<string, number>();
    displayData.revenue.forEach(r => {
      const current = rigMap.get(r.rig) || 0;
      rigMap.set(r.rig, current + (Number(r.revenue_actual) || 0));
    });
    return Array.from(rigMap.entries())
      .map(([rig, revenue]) => ({ rig, revenue }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);
  }, [displayData]);

  // NPT by Type
  const nptByType = useMemo(() => {
    if (!displayData?.billingNpt) return [];
    const typeMap = new Map<string, number>();
    displayData.billingNpt.forEach(n => {
      const type = n.npt_type || "Unknown";
      const current = typeMap.get(type) || 0;
      typeMap.set(type, current + (Number(n.npt_hours) || 0));
    });
    return Array.from(typeMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [displayData]);

  // Utilization Trend by Month
  const utilizationTrend = useMemo(() => {
    if (!displayData?.utilization) return [];
    const monthMap = new Map<string, { sum: number; count: number }>();
    displayData.utilization.forEach(u => {
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
  }, [displayData]);

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
            
            {/* Breadcrumb Navigation for Drill-Down */}
            {drillDown.type && drillDown.value && (
              <div className="mt-3 px-4 py-2.5 bg-accent/50 rounded-lg border border-border/50">
                <Breadcrumb>
                  <BreadcrumbList>
                    <BreadcrumbItem>
                      <BreadcrumbLink 
                        onClick={clearDrillDown}
                        className="cursor-pointer hover:text-foreground transition-colors font-medium"
                      >
                        All Data
                      </BreadcrumbLink>
                    </BreadcrumbItem>
                    
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      <BreadcrumbPage className="font-medium text-foreground">
                        {getDrillDownLabel()}
                      </BreadcrumbPage>
                    </BreadcrumbItem>
                  </BreadcrumbList>
                </Breadcrumb>
              </div>
            )}
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

        {/* Comparison View - Shows when drill-down is active */}
        {comparisonMetrics && (
          <Card className="p-6 bg-muted/30 border-primary/20">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold">Comparison View</h3>
                <p className="text-sm text-muted-foreground">
                  {drillDown.value} vs Overall Average
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={clearDrillDown}>
                Exit Comparison
              </Button>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
              {/* Revenue Comparison */}
              <Card className="p-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">Revenue</p>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xl font-bold">
                      ${(comparisonMetrics.revenue.filtered / 1000000).toFixed(2)}M
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Overall: ${(comparisonMetrics.revenue.overall / 1000000).toFixed(2)}M
                    </p>
                  </div>
                  <div className={`flex items-center gap-1 text-sm font-medium ${
                    comparisonMetrics.revenue.variance >= 0 ? 'text-primary' : 'text-destructive'
                  }`}>
                    {comparisonMetrics.revenue.variance >= 0 ? (
                      <TrendingUp className="h-4 w-4" />
                    ) : (
                      <TrendingDown className="h-4 w-4" />
                    )}
                    {Math.abs(comparisonMetrics.revenue.variance).toFixed(1)}%
                  </div>
                </div>
              </Card>

              {/* Utilization Comparison */}
              <Card className="p-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">Utilization</p>
                    <Gauge className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xl font-bold">
                      {comparisonMetrics.utilization.filtered.toFixed(1)}%
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Overall: {comparisonMetrics.utilization.overall.toFixed(1)}%
                    </p>
                  </div>
                  <div className={`flex items-center gap-1 text-sm font-medium ${
                    comparisonMetrics.utilization.variance >= 0 ? 'text-primary' : 'text-destructive'
                  }`}>
                    {comparisonMetrics.utilization.variance >= 0 ? (
                      <TrendingUp className="h-4 w-4" />
                    ) : (
                      <TrendingDown className="h-4 w-4" />
                    )}
                    {Math.abs(comparisonMetrics.utilization.variance).toFixed(1)}%
                  </div>
                </div>
              </Card>

              {/* NPT Comparison */}
              <Card className="p-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">NPT Hours</p>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xl font-bold">
                      {comparisonMetrics.npt.filtered.toFixed(0)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Overall: {comparisonMetrics.npt.overall.toFixed(0)}
                    </p>
                  </div>
                  <div className={`flex items-center gap-1 text-sm font-medium ${
                    comparisonMetrics.npt.variance <= 0 ? 'text-primary' : 'text-destructive'
                  }`}>
                    {comparisonMetrics.npt.variance <= 0 ? (
                      <TrendingDown className="h-4 w-4" />
                    ) : (
                      <TrendingUp className="h-4 w-4" />
                    )}
                    {Math.abs(comparisonMetrics.npt.variance).toFixed(1)}%
                  </div>
                </div>
              </Card>

              {/* Fuel Comparison */}
              <Card className="p-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">Fuel Cost</p>
                    <Fuel className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xl font-bold">
                      ${(comparisonMetrics.fuel.filtered / 1000).toFixed(0)}K
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Overall: ${(comparisonMetrics.fuel.overall / 1000).toFixed(0)}K
                    </p>
                  </div>
                  <div className={`flex items-center gap-1 text-sm font-medium ${
                    comparisonMetrics.fuel.variance <= 0 ? 'text-primary' : 'text-destructive'
                  }`}>
                    {comparisonMetrics.fuel.variance <= 0 ? (
                      <TrendingDown className="h-4 w-4" />
                    ) : (
                      <TrendingUp className="h-4 w-4" />
                    )}
                    {Math.abs(comparisonMetrics.fuel.variance).toFixed(1)}%
                  </div>
                </div>
              </Card>

              {/* Work Orders Comparison */}
              <Card className="p-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">Open WOs</p>
                    <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xl font-bold">
                      {comparisonMetrics.workOrders.filtered.toFixed(0)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Overall: {comparisonMetrics.workOrders.overall.toFixed(0)}
                    </p>
                  </div>
                  <div className={`flex items-center gap-1 text-sm font-medium ${
                    comparisonMetrics.workOrders.variance <= 0 ? 'text-primary' : 'text-destructive'
                  }`}>
                    {comparisonMetrics.workOrders.variance <= 0 ? (
                      <TrendingDown className="h-4 w-4" />
                    ) : (
                      <TrendingUp className="h-4 w-4" />
                    )}
                    {Math.abs(comparisonMetrics.workOrders.variance).toFixed(1)}%
                  </div>
                </div>
              </Card>
            </div>
          </Card>
        )}

        {/* Top KPIs - Now Clickable */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="cursor-pointer transition-transform hover:scale-105">
            <KPICard
              title="Total Revenue"
              value={`$${((kpis?.totalRevenue || 0) / 1000000).toFixed(2)}M`}
              change={kpis?.revenueVariancePercent || 0}
              trend={kpis && kpis.revenueVariance >= 0 ? "up" : "down"}
            />
          </div>
          <div className="cursor-pointer transition-transform hover:scale-105">
            <KPICard
              title="Fleet Utilization"
              value={`${(kpis?.avgUtilization || 0).toFixed(1)}%`}
              change={0}
              trend="up"
            />
          </div>
          <div className="cursor-pointer transition-transform hover:scale-105">
            <KPICard
              title="Total NPT Hours"
              value={(kpis?.totalNPT || 0).toFixed(0)}
              change={0}
              trend="down"
            />
          </div>
          <div className="cursor-pointer transition-transform hover:scale-105">
            <KPICard
              title="Active Rigs"
              value={kpis?.activeRigs || 0}
              change={0}
              trend="neutral"
            />
          </div>
        </div>

        {/* Secondary KPIs - Now Clickable */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <Card 
            className="p-4 cursor-pointer transition-transform hover:scale-105 hover:shadow-lg"
            onClick={() => {
              // Filter to show work orders data
              clearDrillDown();
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Open Work Orders</p>
                <p className="text-2xl font-bold">{kpis?.totalOpenWOs || 0}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>
          </Card>
          <Card 
            className="p-4 cursor-pointer transition-transform hover:scale-105 hover:shadow-lg"
            onClick={() => {
              // Filter to show critical stock
              clearDrillDown();
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Critical Stock</p>
                <p className="text-2xl font-bold">{kpis?.criticalStock || 0}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>
          </Card>
          <Card 
            className="p-4 cursor-pointer transition-transform hover:scale-105 hover:shadow-lg"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Satisfaction</p>
                <p className="text-2xl font-bold">{(kpis?.avgSatisfaction || 0).toFixed(1)}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-primary" />
            </div>
          </Card>
          <Card 
            className="p-4 cursor-pointer transition-transform hover:scale-105 hover:shadow-lg"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Fuel Cost</p>
                <p className="text-2xl font-bold">${((kpis?.totalFuelCost || 0) / 1000).toFixed(0)}K</p>
              </div>
              <Fuel className="h-8 w-8 text-accent" />
            </div>
          </Card>
          <Card 
            className="p-4 cursor-pointer transition-transform hover:scale-105 hover:shadow-lg"
          >
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
          <ChartCard title="Revenue by Rig" description="Top 10 performing rigs - Click to drill down">
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
                <Bar 
                  dataKey="revenue" 
                  fill="hsl(var(--primary))"
                  cursor="pointer"
                  onClick={(data: any) => handleDrillDown('rig', data.rig)}
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="NPT by Type" description="Distribution of non-productive time - Click to drill down">
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
                  cursor="pointer"
                  onClick={(entry: any) => handleDrillDown('npt_type', entry.name)}
                >
                  {nptByType.slice(0, 6).map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={COLORS[index % COLORS.length]}
                    />
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
                {displayData?.rigMoves.slice(0, 5).map((move) => (
                  <TableRow 
                    key={move.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleDrillDown('rig', move.rig)}
                  >
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
                {displayData?.wells
                  .filter(w => w.status === "Active" || w.status === "Drilling")
                  .slice(0, 5)
                  .map((well) => (
                    <TableRow 
                      key={well.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleDrillDown('rig', well.rig)}
                    >
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

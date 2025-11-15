import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/Layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Download, TrendingUp, DollarSign, Factory, Search, Filter, BarChart3 } from "lucide-react";
import { useFuelAnalytics, FuelFilters } from "@/hooks/useFuelAnalytics";
import { useReportFilters } from "@/hooks/useReportFilters";
import { ChartCard } from "@/components/Dashboard/ChartCard";
import { KPICard } from "@/components/Dashboard/KPICard";
import { QuickNavigationBar } from "@/components/QuickNavigationBar";
import { RelatedReportsPanel } from "@/components/RelatedReportsPanel";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Treemap } from "recharts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import * as XLSX from 'xlsx';
import { toast } from "sonner";

const COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

const FuelAnalytics = () => {
  const currentYear = new Date().getFullYear();
  const [filters, setFilters] = useState<FuelFilters>({
    year: currentYear,
  });
  const [costRange, setCostRange] = useState<[number, number]>([0, 100000]);
  const [searchText, setSearchText] = useState("");

  // Cross-report filter integration
  const { filters: crossReportFilters, updateFilters: updateCrossFilters } = useReportFilters('fuel_analytics');
  
  useEffect(() => {
    if (Object.keys(crossReportFilters).length > 0) {
      setFilters(prev => ({ ...prev, ...crossReportFilters }));
    }
  }, []);

  useEffect(() => {
    updateCrossFilters(filters);
  }, [filters]);
  
  // Drill-down filters
  const [drillDownFilters, setDrillDownFilters] = useState<{
    selectedRig?: string;
    selectedMonth?: string;
    selectedYear?: string;
  }>({});

  // Combine all filters
  const combinedFilters: FuelFilters = {
    ...filters,
    minCost: costRange[0],
    maxCost: costRange[1],
    rig: drillDownFilters.selectedRig || filters.rig,
  };

  const { data: analytics, isLoading } = useFuelAnalytics(combinedFilters);

  const handleYearChange = (year: string) => {
    setFilters(prev => ({ ...prev, year: parseInt(year), month: undefined }));
  };

  const handleMonthChange = (month: string) => {
    setFilters(prev => ({ ...prev, month: month === 'all' ? undefined : month }));
  };

  const handleRigChange = (rig: string) => {
    setFilters(prev => ({ ...prev, rig: rig === 'all' ? undefined : rig }));
  };

  const handleExportToExcel = () => {
    if (!analytics?.records) return;

    const worksheet = XLSX.utils.json_to_sheet(analytics.records);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Fuel Data");
    XLSX.writeFile(workbook, `fuel_analytics_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success("Data exported successfully");
  };

  const handleResetFilters = () => {
    setFilters({ year: currentYear });
    setCostRange([0, 100000]);
    setSearchText("");
    setDrillDownFilters({});
  };

  const handleDrillDown = (type: 'rig' | 'month' | 'year', value: string) => {
    setDrillDownFilters(prev => {
      const newFilters = { ...prev };
      const isRemoving = prev[`selected${type.charAt(0).toUpperCase() + type.slice(1)}` as keyof typeof prev] === value;
      
      if (type === 'rig') {
        newFilters.selectedRig = prev.selectedRig === value ? undefined : value;
      } else if (type === 'month') {
        newFilters.selectedMonth = prev.selectedMonth === value ? undefined : value;
      } else if (type === 'year') {
        newFilters.selectedYear = prev.selectedYear === value ? undefined : value;
        if (prev.selectedYear !== value) {
          const yearNum = parseInt(value);
          setFilters(prev => ({ ...prev, year: yearNum }));
        }
      }
      
      if (!isRemoving) {
        toast.success(`Filtered by ${type}: ${value}`);
      }
      
      return newFilters;
    });
  };

  const clearDrillDown = (type?: 'rig' | 'month' | 'year') => {
    if (type) {
      setDrillDownFilters(prev => {
        const newFilters = { ...prev };
        if (type === 'rig') delete newFilters.selectedRig;
        else if (type === 'month') delete newFilters.selectedMonth;
        else if (type === 'year') delete newFilters.selectedYear;
        return newFilters;
      });
    } else {
      setDrillDownFilters({});
    }
  };

  const hasActiveDrillDown = Object.values(drillDownFilters).some(v => v !== undefined);

  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  const uniqueRigs = analytics ? [...new Set(analytics.records.map(r => r.rig))] : [];

  if (isLoading) {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Smart Navigation */}
        <QuickNavigationBar 
          currentReport="fuel_analytics" 
          currentFilters={filters}
        />
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Fuel Cost Analytics</h2>
            <p className="text-muted-foreground">Interactive dashboard for fuel consumption analysis</p>
          </div>
          <div className="flex items-center justify-center h-64">
            <div className="text-muted-foreground">Loading analytics...</div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Fuel Cost Analytics</h2>
          <p className="text-muted-foreground">Interactive dashboard for fuel consumption analysis</p>
        </div>

        {/* Smart Filters */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                <CardTitle>Filters & Controls</CardTitle>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleResetFilters}>
                  Reset Filters
                </Button>
                <Button variant="default" size="sm" onClick={handleExportToExcel}>
                  <Download className="h-4 w-4 mr-2" />
                  Export to Excel
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Year Filter */}
              <div className="space-y-2">
                <Label>Year</Label>
                <Select value={filters.year?.toString()} onValueChange={handleYearChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map(year => (
                      <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Month Filter */}
              <div className="space-y-2">
                <Label>Month</Label>
                <Select value={filters.month || 'all'} onValueChange={handleMonthChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="All months" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Months</SelectItem>
                    {months.map((month, idx) => (
                      <SelectItem key={month} value={month}>{month}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Rig Filter */}
              <div className="space-y-2">
                <Label>Rig</Label>
                <Select value={filters.rig || 'all'} onValueChange={handleRigChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="All rigs" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Rigs</SelectItem>
                    {uniqueRigs.map(rig => (
                      <SelectItem key={rig} value={rig}>{rig}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Cost Range Filter */}
            <div className="space-y-4 mt-4">
              <Label>Fuel Cost Range: ${costRange[0].toLocaleString()} - ${costRange[1].toLocaleString()}</Label>
              <Slider
                value={costRange}
                onValueChange={(value) => setCostRange(value as [number, number])}
                min={0}
                max={100000}
                step={1000}
                className="w-full"
              />
            </div>
          </CardContent>
        </Card>

        {/* KPI Summary */}
        <div className="grid gap-6 md:grid-cols-4">
          <KPICard
            title="Total Fuel Cost"
            value={`$${(analytics?.totalCost || 0).toLocaleString('en-US', { maximumFractionDigits: 0 })}`}
            icon={DollarSign}
          />
          <KPICard
            title="Total Consumed"
            value={`${(analytics?.totalConsumed || 0).toLocaleString('en-US', { maximumFractionDigits: 0 })} L`}
            icon={TrendingUp}
          />
          <KPICard
            title="Total Received"
            value={`${(analytics?.totalReceived || 0).toLocaleString('en-US', { maximumFractionDigits: 0 })} L`}
            icon={Factory}
          />
          <KPICard
            title="Active Rigs"
            value={analytics?.uniqueRigsCount || 0}
            icon={BarChart3}
          />
        </div>

        {/* Charts Section */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Monthly Trend */}
          <Card>
            <CardHeader>
              <CardTitle>Monthly Trend</CardTitle>
              <CardDescription>Fuel consumption and cost over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analytics?.monthlyTrend || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Line yAxisId="left" type="monotone" dataKey="consumed" stroke={COLORS[0]} name="Consumed (L)" />
                  <Line yAxisId="right" type="monotone" dataKey="cost" stroke={COLORS[1]} name="Cost ($)" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Top Consumers */}
          <Card>
            <CardHeader>
              <CardTitle>Top Fuel Consumers</CardTitle>
              <CardDescription>Rigs with highest consumption</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics?.topConsumers || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill={COLORS[2]} name="Consumed (L)" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Cost by Rig */}
          <Card>
            <CardHeader>
              <CardTitle>Cost Distribution by Rig</CardTitle>
              <CardDescription>Fuel costs across all rigs</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics?.rigBreakdown || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill={COLORS[3]} name="Cost ($)" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Yearly Comparison */}
          <Card>
            <CardHeader>
              <CardTitle>Yearly Comparison</CardTitle>
              <CardDescription>Year-over-year performance</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics?.yearlyComparison || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="consumed" fill={COLORS[0]} name="Consumed (L)" />
                  <Bar dataKey="cost" fill={COLORS[1]} name="Cost ($)" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Data Table */}
        <Card>
          <CardHeader>
            <CardTitle>Detailed Fuel Records</CardTitle>
            <CardDescription>All fuel consumption records with filters applied</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rig</TableHead>
                    <TableHead>Year</TableHead>
                    <TableHead>Month</TableHead>
                    <TableHead className="text-right">Opening Stock (L)</TableHead>
                    <TableHead className="text-right">Received (L)</TableHead>
                    <TableHead className="text-right">Consumed (L)</TableHead>
                    <TableHead className="text-right">Closing Balance (L)</TableHead>
                    <TableHead className="text-right">Cost ($)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {analytics?.records.slice(0, 50).map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="font-medium">{record.rig}</TableCell>
                      <TableCell>{record.year}</TableCell>
                      <TableCell>{record.month}</TableCell>
                      <TableCell className="text-right">{record.opening_stock?.toLocaleString() || 0}</TableCell>
                      <TableCell className="text-right">{record.total_received?.toLocaleString() || 0}</TableCell>
                      <TableCell className="text-right">{record.total_consumed?.toLocaleString() || 0}</TableCell>
                      <TableCell className="text-right">{record.closing_balance?.toLocaleString() || 0}</TableCell>
                      <TableCell className="text-right font-semibold">${record.fuel_cost?.toLocaleString() || 0}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {analytics && analytics.records.length > 50 && (
                <div className="text-center text-sm text-muted-foreground mt-4">
                  Showing first 50 of {analytics.records.length} records. Use filters to refine results.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Related Reports Navigation */}
        <RelatedReportsPanel 
          currentReport="fuel_analytics"
          currentFilters={filters}
          variant="full"
        />
      </div>
    </DashboardLayout>
  );
};

export default FuelAnalytics;

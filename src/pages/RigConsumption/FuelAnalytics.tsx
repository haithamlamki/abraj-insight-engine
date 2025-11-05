import { useState } from "react";
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
import { ChartCard } from "@/components/Dashboard/ChartCard";
import { KPICard } from "@/components/Dashboard/KPICard";
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
  const [costRange, setCostRange] = useState<[number, number]>([0, 50000]);
  const [searchText, setSearchText] = useState("");

  const { data: analytics, isLoading } = useFuelAnalytics({
    ...filters,
    minValue: costRange[0],
    maxValue: costRange[1],
    searchText: searchText || undefined,
  });

  const handleYearChange = (year: string) => {
    setFilters(prev => ({ ...prev, year: parseInt(year), month: undefined }));
  };

  const handleMonthChange = (month: string) => {
    setFilters(prev => ({ ...prev, month: month === 'all' ? undefined : parseInt(month) }));
  };

  const handleRigChange = (rig: string) => {
    setFilters(prev => ({ ...prev, wbsElement: rig === 'all' ? undefined : rig }));
  };

  const handleCostElementChange = (element: string) => {
    setFilters(prev => ({ ...prev, costElement: element === 'all' ? undefined : element }));
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
    setCostRange([0, 50000]);
    setSearchText("");
  };

  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);
  const months = [
    { value: '1', label: 'January' },
    { value: '2', label: 'February' },
    { value: '3', label: 'March' },
    { value: '4', label: 'April' },
    { value: '5', label: 'May' },
    { value: '6', label: 'June' },
    { value: '7', label: 'July' },
    { value: '8', label: 'August' },
    { value: '9', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' },
  ];

  const uniqueRigs = analytics ? [...new Set(analytics.records.map(r => r.rig))] : [];
  const uniqueCostElements = analytics ? [...new Set(analytics.records.map(r => r.fuel_type))] : [];

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                <Select value={filters.month?.toString() || 'all'} onValueChange={handleMonthChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="All months" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Months</SelectItem>
                    {months.map(month => (
                      <SelectItem key={month.value} value={month.value}>{month.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* WBS Element (Rig) Filter */}
              <div className="space-y-2">
                <Label>WBS Element (Rig)</Label>
                <Select value={filters.wbsElement || 'all'} onValueChange={handleRigChange}>
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

              {/* Cost Element Filter */}
              <div className="space-y-2">
                <Label>Cost Element</Label>
                <Select value={filters.costElement || 'all'} onValueChange={handleCostElementChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="All elements" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Elements</SelectItem>
                    {uniqueCostElements.map(element => (
                      <SelectItem key={element} value={element}>{element}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Cost Range Slider */}
              <div className="space-y-2 md:col-span-2">
                <Label>Cost Range: ${costRange[0].toLocaleString()} - ${costRange[1].toLocaleString()}</Label>
                <Slider
                  min={0}
                  max={50000}
                  step={1000}
                  value={costRange}
                  onValueChange={(value) => setCostRange(value as [number, number])}
                  className="mt-2"
                />
              </div>

              {/* Search Box */}
              <div className="space-y-2 md:col-span-2">
                <Label>Search (PO Text / Supplier)</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search purchase orders or suppliers..."
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Overall KPIs */}
        <div className="grid gap-6 md:grid-cols-3">
          <KPICard
            title="Total Cost"
            value={`$${analytics?.totalCost.toLocaleString() || 0}`}
            icon={DollarSign}
          />
          <KPICard
            title="Avg Cost per WBS Element"
            value={`$${analytics?.avgCostPerRig.toLocaleString(undefined, { maximumFractionDigits: 0 }) || 0}`}
            icon={TrendingUp}
          />
          <KPICard
            title="WBS Elements"
            value={analytics?.uniqueRigsCount.toString() || '0'}
            icon={Factory}
          />
        </div>

        {/* Charts Tabs */}
        <Tabs defaultValue="trends" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="trends">Trends</TabsTrigger>
            <TabsTrigger value="breakdown">Breakdown</TabsTrigger>
            <TabsTrigger value="top5">Top 5 Costs</TabsTrigger>
            <TabsTrigger value="details">Detailed Table</TabsTrigger>
          </TabsList>

          {/* Trend Analysis Tab */}
          <TabsContent value="trends" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Monthly Spend Trend */}
              <ChartCard
                title="Monthly Spend Trend"
                description="Cost trend over selected period"
              >
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={analytics?.monthlyTrend || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                      formatter={(value: number) => `$${value.toLocaleString()}`}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="cost" 
                      stroke="hsl(var(--chart-1))" 
                      strokeWidth={2}
                      name="Cost"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartCard>

              {/* Yearly Comparison */}
              <ChartCard
                title="Yearly Spend Comparison"
                description="Compare costs across years"
              >
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analytics?.yearlyComparison || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="year" stroke="hsl(var(--muted-foreground))" />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                      formatter={(value: number) => `$${value.toLocaleString()}`}
                    />
                    <Legend />
                    <Bar dataKey="cost" fill="hsl(var(--chart-2))" name="Cost" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>
          </TabsContent>

          {/* Category Breakdown Tab */}
          <TabsContent value="breakdown" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Cost by WBS Element */}
              <ChartCard
                title="Cost by WBS Element"
                description="Distribution across rigs"
              >
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analytics?.rigBreakdown.slice(0, 10) || []} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" stroke="hsl(var(--muted-foreground))" />
                    <YAxis type="category" dataKey="name" stroke="hsl(var(--muted-foreground))" width={100} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                      formatter={(value: number) => `$${value.toLocaleString()}`}
                    />
                    <Bar dataKey="value" fill="hsl(var(--chart-3))" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>

              {/* Cost by Element Description */}
              <ChartCard
                title="Cost by Element Description"
                description="Breakdown by cost type"
              >
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={analytics?.costElementBreakdown || []}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label={(entry) => `${entry.name}: ${entry.percentage}%`}
                    >
                      {analytics?.costElementBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                      formatter={(value: number) => `$${value.toLocaleString()}`}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>
          </TabsContent>

          {/* Top 5 Tab */}
          <TabsContent value="top5">
            <ChartCard
              title="Top 5 Cost Elements by Spend"
              description="Highest spending categories"
            >
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={analytics?.topCostElements || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                    formatter={(value: number) => `$${value.toLocaleString()}`}
                  />
                  <Bar dataKey="value" fill="hsl(var(--chart-4))">
                    {analytics?.topCostElements.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </TabsContent>

          {/* Detailed Table Tab */}
          <TabsContent value="details">
            <Card>
              <CardHeader>
                <CardTitle>Detailed Fuel Records</CardTitle>
                <CardDescription>
                  All fuel consumption records with applied filters
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>WBS Element</TableHead>
                        <TableHead>Cost Element</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-right">Value</TableHead>
                        <TableHead>Supplier</TableHead>
                        <TableHead>Remarks</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {analytics?.records.slice(0, 50).map((record) => (
                        <TableRow key={record.id}>
                          <TableCell>{new Date(record.date).toLocaleDateString()}</TableCell>
                          <TableCell className="font-medium">{record.rig}</TableCell>
                          <TableCell>{record.fuel_type}</TableCell>
                          <TableCell className="max-w-xs truncate">{record.fuel_type}</TableCell>
                          <TableCell className="text-right">
                            {record.total_cost > 10000 ? (
                              <Badge variant="destructive">
                                ${record.total_cost.toLocaleString()}
                              </Badge>
                            ) : (
                              <span>${record.total_cost.toLocaleString()}</span>
                            )}
                          </TableCell>
                          <TableCell>{record.supplier || '-'}</TableCell>
                          <TableCell className="max-w-xs truncate">{record.remarks || '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                {analytics && analytics.records.length > 50 && (
                  <p className="text-sm text-muted-foreground mt-4">
                    Showing first 50 of {analytics.records.length} records. Use filters to narrow down results.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default FuelAnalytics;

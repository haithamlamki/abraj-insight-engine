import { useState, useMemo, useRef } from "react";
import { DataEntryLayout } from "@/components/Reports/DataEntryLayout";
import { DataEntryForm } from "@/components/Reports/DataEntryForm";
import { ExcelUploadZone } from "@/components/Reports/ExcelUploadZone";
import { DataTableWithDB } from "@/components/Reports/DataTableWithDB";
import { DollarSign, TrendingUp, PieChart, Target } from "lucide-react";
import { useRevenueFilters } from "@/hooks/useRevenueFilters";
import { useRevenueAnalytics } from "@/hooks/useRevenueAnalytics";
import { RevenueFilterPanel } from "@/components/Revenue/RevenueFilterPanel";
import { ActiveFiltersBar } from "@/components/Revenue/ActiveFiltersBar";
import { EnhancedKPICard } from "@/components/Revenue/EnhancedKPICard";
import { RevenueTimeSeriesChart } from "@/components/Revenue/RevenueTimeSeriesChart";
import { RigPerformanceChart } from "@/components/Revenue/RigPerformanceChart";
import { TopPerformersPanel } from "@/components/Revenue/TopPerformersPanel";
import { NPTCorrelationChart } from "@/components/Revenue/NPTCorrelationChart";
import { RevenueForecastChart } from "@/components/Revenue/RevenueForecastChart";
import { ExportMenu } from "@/components/Revenue/ExportMenu";
import { AIInsightsPanel } from "@/components/Revenue/AIInsightsPanel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useReportData } from "@/hooks/useReportData";

const Revenue = () => {
  const {
    filters,
    updateFilters,
    resetFilters,
    applyQuickFilter,
    hasActiveFilters,
  } = useRevenueFilters();

  const {
    data,
    monthlyTrend,
    topRigsByVariance,
    bottomRigsByVariance,
    topMonthsByRevenue,
    nptCorrelation,
    totalActual,
    totalBudget,
    totalVariance,
    variancePct,
    avgMonthlyRevenue,
    avgDayrate,
    historicalTimeSeries,
    correlationCoefficient,
    isLoading,
  } = useRevenueAnalytics(filters);

  const [selectedRig, setSelectedRig] = useState<string | null>(null);
  const dashboardRef = useRef<HTMLDivElement>(null);

  // Get all data for export
  const { data: allRevenueData } = useReportData('revenue');

  // Calculate available years and revenue range from data
  const { availableYears, minRevenue, maxRevenue } = useMemo(() => {
    if (!data || data.length === 0) {
      return {
        availableYears: [new Date().getFullYear()],
        minRevenue: 0,
        maxRevenue: 10000000,
      };
    }

    const years = [...new Set(data.map(d => d.year))].sort((a, b) => b - a);
    const revenues = data.map(d => d.revenue_actual);
    
    return {
      availableYears: years,
      minRevenue: Math.min(...revenues),
      maxRevenue: Math.max(...revenues),
    };
  }, [data]);

  // Handle rig drill-down
  const handleRigClick = (rig: string) => {
    setSelectedRig(rig);
    updateFilters({ rigs: [rig] });
  };

  // Handle month drill-down
  const handleMonthClick = (month: string, year: number) => {
    updateFilters({ months: [month], years: [year] });
  };

  // Handle filter removal
  const handleRemoveFilter = (filterType: keyof typeof filters, value: any) => {
    updateFilters({ [filterType]: value });
  };

  const formFields = [
    { name: "rig", label: "Rig", type: "text" as const, required: true },
    { name: "month", label: "Month", type: "select" as const, options: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"], required: true },
    { name: "days", label: "Days", type: "number" as const, required: true },
    { name: "fuel", label: "Fuel ($)", type: "number" as const, required: true },
    { name: "nptRepair", label: "NPT Repair ($)", type: "number" as const, required: true },
    { name: "nptZero", label: "NPT Zero ($)", type: "number" as const, required: true },
    { name: "client", label: "Client", type: "text" as const, required: true },
    { name: "revTotal", label: "Revenue Total ($)", type: "number" as const, required: true },
    { name: "comments", label: "Comments", type: "text" as const },
  ];

  const tableColumns = [
    { key: "year", label: "Year", sortable: true },
    { key: "month", label: "Months", sortable: true },
    { key: "rig", label: "Rig", sortable: true },
    { key: "actual", label: "Actual", sortable: true },
    { key: "fuel", label: "Fuel", sortable: true },
    { key: "totalRev", label: "Total Rev", sortable: true },
    { key: "budgetedRev", label: "Budgeted Rev", sortable: true },
    { key: "diff", label: "Diff", sortable: true },
    { key: "nptRepair", label: "NPT Repair", sortable: true },
    { key: "nptZero", label: "NPT Zero", sortable: true },
    { key: "comments", label: "Comments", sortable: true },
  ];

  const sampleData = [
    { rig: "ADC-225", month: "January", days: "31", fuel: "$125,000", nptRepair: "$45,000", nptZero: "$15,000", client: "ADNOC", revTotal: "$4.2M" },
    { rig: "ADC-226", month: "January", days: "31", fuel: "$130,000", nptRepair: "$38,000", nptZero: "$12,000", client: "ADNOC", revTotal: "$4.5M" },
    { rig: "ADC-227", month: "January", days: "31", fuel: "$118,000", nptRepair: "$52,000", nptZero: "$18,000", client: "ADNOC", revTotal: "$3.8M" },
  ];

  const trendData = [
    { month: "Oct", revenue: 4.1, fuel: 0.118, nptRepair: 0.042, nptZero: 0.014 },
    { month: "Nov", revenue: 4.3, fuel: 0.125, nptRepair: 0.038, nptZero: 0.012 },
    { month: "Dec", revenue: 4.0, fuel: 0.120, nptRepair: 0.048, nptZero: 0.016 },
    { month: "Jan", revenue: 4.2, fuel: 0.125, nptRepair: 0.045, nptZero: 0.015 },
    { month: "Feb", revenue: 4.5, fuel: 0.130, nptRepair: 0.038, nptZero: 0.012 },
    { month: "Mar", revenue: 3.8, fuel: 0.118, nptRepair: 0.052, nptZero: 0.018 },
  ];

  return (
    <DataEntryLayout
      title="Revenue Analysis Dashboard"
      description="Interactive revenue tracking and analysis with forecasting"
      breadcrumbs={[
        { label: "Dashboard", href: "/" },
        { label: "Rig Financials", href: "/rig-financials" },
        { label: "Revenue" }
      ]}
      viewContent={
        <Tabs defaultValue="dashboard" className="space-y-6">
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
              <TabsTrigger value="data">Detailed Data</TabsTrigger>
            </TabsList>
            
            <div className="flex gap-2">
              <ExportMenu
                data={data}
                filteredCount={data.length}
                totalCount={allRevenueData?.length || 0}
                dashboardRef={dashboardRef}
              />
              <RevenueFilterPanel
                filters={filters}
                onFiltersChange={updateFilters}
                onReset={resetFilters}
                onApplyQuickFilter={applyQuickFilter}
                hasActiveFilters={hasActiveFilters}
                availableYears={availableYears}
                minRevenue={minRevenue}
                maxRevenue={maxRevenue}
              />
            </div>
          </div>

          {hasActiveFilters && (
            <ActiveFiltersBar
              filters={filters}
              onRemoveFilter={handleRemoveFilter}
              onClearAll={resetFilters}
            />
          )}

          <TabsContent value="dashboard" className="space-y-6">
            <div ref={dashboardRef}>
            {/* KPI Cards */}
            <div className="grid gap-6 md:grid-cols-4">
              <EnhancedKPICard
                title="Total Revenue"
                value={isLoading ? "..." : `$${(totalActual / 1000000).toFixed(2)}M`}
                icon={DollarSign}
                trend={variancePct >= 0 ? 'up' : 'down'}
                change={variancePct}
                subtitle="vs budget"
                sparklineData={monthlyTrend.map(m => m.actual)}
              />
              <EnhancedKPICard
                title="Budget Variance"
                value={isLoading ? "..." : `${variancePct >= 0 ? '+' : ''}${variancePct.toFixed(1)}%`}
                icon={TrendingUp}
                trend={variancePct >= 0 ? 'up' : 'down'}
                change={variancePct}
                subtitle={`$${(totalVariance / 1000000).toFixed(2)}M`}
              />
              <EnhancedKPICard
                title="Avg Dayrate"
                value={isLoading ? "..." : `$${avgDayrate.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
                icon={PieChart}
                subtitle="per day"
              />
              <EnhancedKPICard
                title="Avg Monthly"
                value={isLoading ? "..." : `$${(avgMonthlyRevenue / 1000000).toFixed(2)}M`}
                icon={Target}
                subtitle="revenue"
                sparklineData={monthlyTrend.map(m => m.actual)}
              />
            </div>

            {/* Time Series Chart */}
            <div id="time-series-chart">
              <RevenueTimeSeriesChart
                data={monthlyTrend}
                title="Revenue Trend Analysis"
                description="Actual vs Budget over time with variance"
              />
            </div>

            {/* Rig Performance and Top Performers */}
            <div className="grid gap-6 lg:grid-cols-2">
              <div id="rig-performance-chart">
                <RigPerformanceChart
                  data={topRigsByVariance}
                  title="Rig Performance Analysis"
                  description="Variance by rig (top performers)"
                  onRigClick={handleRigClick}
                />
              </div>
              <TopPerformersPanel
                topRigs={topRigsByVariance}
                bottomRigs={bottomRigsByVariance}
                topMonths={topMonthsByRevenue}
                onRigClick={handleRigClick}
                onMonthClick={handleMonthClick}
              />
            </div>

            {/* Forecast Chart */}
            {historicalTimeSeries.length > 3 && (
              <div id="forecast-chart">
                <RevenueForecastChart
                  historicalData={historicalTimeSeries}
                  title="Revenue Forecast"
                  description="Projected revenue based on historical trends"
                />
              </div>
            )}

            {/* NPT Correlation */}
            {nptCorrelation.length > 0 && (
              <div id="npt-correlation-chart">
                <NPTCorrelationChart
                  data={nptCorrelation}
                  correlationCoefficient={correlationCoefficient}
                  title="NPT Impact Analysis"
                  description="Correlation between NPT and revenue variance"
                  onRigClick={handleRigClick}
                />
              </div>
            )}

            {/* AI Insights Panel */}
            <AIInsightsPanel filters={filters} />
            </div>
          </TabsContent>

          <TabsContent value="data" className="space-y-6">
            <DataTableWithDB 
              columns={tableColumns} 
              reportType="revenue"
              formatRow={(row) => ({
                ...row,
                year: row.year,
                month: row.month,
                rig: row.rig,
                actual: `$${(row.revenue_actual / 1000000).toFixed(2)}M`,
                fuel: `$${row.fuel_charge?.toLocaleString() || 0}`,
                totalRev: `$${(row.revenue_actual / 1000000).toFixed(2)}M`,
                budgetedRev: `$${(row.revenue_budget / 1000000).toFixed(2)}M`,
                diff: `$${(row.variance / 1000000).toFixed(2)}M`,
                nptRepair: `$${row.npt_repair?.toLocaleString() || 0}`,
                nptZero: `$${row.npt_zero?.toLocaleString() || 0}`,
                comments: row.comments || '-'
              })}
            />
          </TabsContent>
        </Tabs>
      }
      entryContent={
        <DataEntryForm
          title="Enter Revenue Data"
          fields={formFields}
          frequency="daily"
          reportType="revenue"
        />
      }
      uploadContent={
        <ExcelUploadZone
          title="Upload Revenue Report"
          templateName="revenue_template.xlsx"
          reportType="revenue"
        />
      }
    />
  );
};

export default Revenue;

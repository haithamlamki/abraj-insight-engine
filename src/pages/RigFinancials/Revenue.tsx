import { useState, useMemo, useRef, useEffect } from "react";
import { DataEntryLayout } from "@/components/Reports/DataEntryLayout";
import { DataTableWithDB } from "@/components/Reports/DataTableWithDB";
import { DollarSign, TrendingUp, PieChart, Target } from "lucide-react";
import { useRevenueFilters } from "@/hooks/useRevenueFilters";
import { useRevenueAnalytics } from "@/hooks/useRevenueAnalytics";
import { useReportFilters } from "@/hooks/useReportFilters";
import { RevenueFilterPanel } from "@/components/Revenue/RevenueFilterPanel";
import { ActiveFiltersBar } from "@/components/Revenue/ActiveFiltersBar";
import { QuickNavigationBar } from "@/components/QuickNavigationBar";
import { RelatedReportsPanel } from "@/components/RelatedReportsPanel";
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

  // Cross-report filter integration
  const { filters: crossReportFilters, updateFilters: updateCrossFilters } = useReportFilters('revenue');
  
  // Merge cross-report filters with local filters on mount
  useEffect(() => {
    if (Object.keys(crossReportFilters).length > 0) {
      updateFilters(crossReportFilters);
    }
  }, []);

  // Update cross-report filters when local filters change
  useEffect(() => {
    updateCrossFilters(filters);
  }, [filters]);

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

          {/* Smart Navigation */}
          <QuickNavigationBar 
            currentReport="revenue" 
            currentFilters={filters}
          />

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

            {/* Related Reports Navigation */}
            <RelatedReportsPanel 
              currentReport="revenue"
              currentFilters={filters}
              variant="full"
            />
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
    />
  );
};

export default Revenue;

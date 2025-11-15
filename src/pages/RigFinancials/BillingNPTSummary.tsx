import { useMemo, useEffect } from "react";
import { DataEntryLayout } from "@/components/Reports/DataEntryLayout";
import { DataTableWithDB } from "@/components/Reports/DataTableWithDB";
import { EnhancedKPICard } from "@/components/Revenue/EnhancedKPICard";
import { useReportData } from "@/hooks/useReportData";
import { useBillingNPTFilters } from "@/hooks/useBillingNPTFilters";
import { useBillingNPTAnalytics } from "@/hooks/useBillingNPTAnalytics";
import { useReportFilters } from "@/hooks/useReportFilters";
import { OperationalRateChart } from "@/components/BillingNPT/OperationalRateChart";
import { NPTCategoryChart } from "@/components/BillingNPT/NPTCategoryChart";
import { RigEfficiencyChart } from "@/components/BillingNPT/RigEfficiencyChart";
import { PerformersPanel } from "@/components/BillingNPT/PerformersPanel";
import { NPTCorrelationChart } from "@/components/BillingNPT/NPTCorrelationChart";
import { BillingNPTFilterPanel } from "@/components/BillingNPT/BillingNPTFilterPanel";
import { ActiveFiltersBar } from "@/components/BillingNPT/ActiveFiltersBar";
import { AIInsightsPanel } from "@/components/BillingNPT/AIInsightsPanel";
import { QuickNavigationBar } from "@/components/QuickNavigationBar";
import { RelatedReportsPanel } from "@/components/RelatedReportsPanel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, AlertTriangle, FileText, Target, Percent, TrendingDown, Activity } from "lucide-react";
import { HourBreakdownChart } from "@/components/BillingNPT/HourBreakdownChart";
import { NPTHeatmap } from "@/components/BillingNPT/NPTHeatmap";

const BillingNPTSummary = () => {
  const { data: summaryData = [] } = useReportData('billing_npt_summary');
  const { filters, updateFilters, clearFilters, applyQuickFilter, hasActiveFilters } = useBillingNPTFilters();
  
  // Cross-report filter integration
  const { filters: crossReportFilters, updateFilters: updateCrossFilters } = useReportFilters('billing_npt');
  
  useEffect(() => {
    if (Object.keys(crossReportFilters).length > 0) {
      updateFilters(crossReportFilters);
    }
  }, []);

  useEffect(() => {
    updateCrossFilters(filters);
  }, [filters]);
  
  const analytics = useBillingNPTAnalytics(summaryData, filters);

  const availableYears = useMemo<number[]>(() => {
    const years = new Set(summaryData.map((r: any) => r.year).filter(Boolean));
    return Array.from(years).map(y => Number(y)).sort((a, b) => b - a);
  }, [summaryData]);

  const availableMonths = useMemo<string[]>(() => {
    const months = new Set(summaryData.map((r: any) => r.month).filter(Boolean));
    return Array.from(months).map(m => String(m));
  }, [summaryData]);

  const availableRigs = useMemo<string[]>(() => {
    const rigs = new Set(summaryData.map((r: any) => r.rig).filter(Boolean));
    return Array.from(rigs).map(r => String(r)).sort();
  }, [summaryData]);

  const handleRemoveFilter = (filterType: string, value?: string | number) => {
    if (filterType === 'years' && value !== undefined) {
      updateFilters({ years: filters.years.filter(y => y !== Number(value)) });
    } else if (filterType === 'months' && value !== undefined) {
      updateFilters({ months: filters.months.filter(m => m !== String(value)) });
    } else if (filterType === 'rigs' && value !== undefined) {
      updateFilters({ rigs: filters.rigs.filter(r => r !== String(value)) });
    }
  };

  const handleMonthClick = (yearMonth: string) => {
    const [year, month] = yearMonth.split('-');
    updateFilters({ 
      years: [parseInt(year)], 
      months: [month] 
    });
  };

  const handleRigClick = (rig: string) => {
    updateFilters({ rigs: [rig] });
  };

  const handleCategoryClick = (category: string) => {
    console.log('Category clicked:', category);
  };

  const handleHeatmapClick = (rig: string, month: string) => {
    updateFilters({ rigs: [rig], months: [month] });
  };

  return (
    <DataEntryLayout
      title="Billing NPT Summary"
      description="Interactive NPT & Operational Analysis Dashboard"
      breadcrumbs={[
        { label: "Dashboard", href: "/" },
        { label: "Rig Financials", href: "/rig-financials" },
        { label: "Billing NPT Summary" }
      ]}
      viewContent={
        <div className="space-y-6">
          {/* Smart Navigation */}
          <QuickNavigationBar 
            currentReport="billing_npt" 
            currentFilters={filters}
          />

          <Tabs defaultValue="dashboard" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
              <TabsTrigger value="data">Data Table</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>

            <TabsContent value="dashboard" className="space-y-6 mt-6">
              {/* KPI Cards */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                <EnhancedKPICard
                  title="Total NPT Hours"
                  value={analytics.kpis.totalNPTHours.toLocaleString()}
                  icon={AlertTriangle}
                  trend="neutral"
                  subtitle="All incidents"
                />
                <EnhancedKPICard
                  title="NPT % of Time"
                  value={`${analytics.kpis.nptPercentage}%`}
                  icon={Percent}
                  trend={analytics.kpis.nptPercentage < 10 ? "up" : analytics.kpis.nptPercentage > 15 ? "down" : "neutral"}
                  subtitle={`${analytics.kpis.totalNPTHours.toLocaleString()} / ${analytics.kpis.totalHours.toLocaleString()} hrs`}
                />
                <EnhancedKPICard
                  title="Operating Efficiency"
                  value={`${analytics.kpis.avgOperationalRate}%`}
                  icon={TrendingUp}
                  trend={analytics.kpis.avgOperationalRate >= 75 ? "up" : analytics.kpis.avgOperationalRate < 65 ? "down" : "neutral"}
                  subtitle="Fleet average"
                />
                <EnhancedKPICard
                  title="Reduced Rate %"
                  value={`${analytics.kpis.reducedRatePercentage}%`}
                  icon={Activity}
                  trend="neutral"
                  subtitle="Of total time"
                />
                <EnhancedKPICard
                  title="Repair NPT %"
                  value={`${analytics.kpis.repairNPTPercentage}%`}
                  icon={AlertTriangle}
                  trend="neutral"
                  subtitle="Of total NPT"
                />
                <EnhancedKPICard
                  title="Zero NPT %"
                  value={`${analytics.kpis.zeroNPTPercentage}%`}
                  icon={Target}
                  trend="neutral"
                  subtitle="Of total NPT"
                />
                <EnhancedKPICard
                  title="YoY NPT Change"
                  value={`${analytics.kpis.yoyNPTChange > 0 ? '+' : ''}${analytics.kpis.yoyNPTChange}%`}
                  icon={TrendingDown}
                  trend={analytics.kpis.yoyNPTChange < 0 ? "up" : analytics.kpis.yoyNPTChange > 0 ? "down" : "neutral"}
                  subtitle="vs previous year"
                />
                <EnhancedKPICard
                  title="Problem Rigs"
                  value={analytics.kpis.problemRigsCount}
                  icon={Target}
                  trend="neutral"
                  subtitle=">500 hrs NPT"
                />
              </div>

              {hasActiveFilters && (
                <ActiveFiltersBar
                  filters={filters}
                  totalRecords={summaryData.length}
                  filteredRecords={analytics.filteredData.length}
                  onRemoveFilter={handleRemoveFilter}
                  onClearAll={clearFilters}
                />
              )}

              <BillingNPTFilterPanel
                filters={filters}
                onFiltersChange={updateFilters}
                onClearFilters={clearFilters}
                onApplyQuickFilter={applyQuickFilter}
                availableYears={availableYears}
                availableMonths={availableMonths}
                availableRigs={availableRigs}
              />

              <OperationalRateChart 
                data={analytics.monthlyTrends}
                onMonthClick={handleMonthClick}
              />

              <div className="grid gap-6 md:grid-cols-2">
                <RigEfficiencyChart 
                  data={analytics.rigPerformance}
                  onRigClick={handleRigClick}
                />
                <NPTCategoryChart 
                  data={analytics.categoryBreakdown}
                  onCategoryClick={handleCategoryClick}
                />
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <PerformersPanel
                  topPerformers={analytics.topPerformers}
                  bottomPerformers={analytics.bottomPerformers}
                  onRigClick={handleRigClick}
                />
                <NPTCorrelationChart data={analytics.correlationData} />
              </div>

              <HourBreakdownChart
                data={analytics.hourBreakdown}
                title="Hour Breakdown by Month"
                description="How time is spent across all billing categories"
                xAxisKey="yearMonth"
                onBarClick={handleMonthClick}
              />

              <HourBreakdownChart
                data={analytics.rigHourBreakdown}
                title="Hour Breakdown by Rig"
                description="Time distribution across rigs for selected period"
                xAxisKey="rig"
                onBarClick={handleRigClick}
              />

              <NPTHeatmap
                data={analytics.heatmapData}
                title="NPT % Heatmap: Rig vs Month"
                description="Click on a cell to filter by rig and month"
                onCellClick={handleHeatmapClick}
              />

              {/* AI Insights Panel */}
              <AIInsightsPanel filters={filters} />

              {/* Related Reports Navigation */}
              <RelatedReportsPanel 
                currentReport="billing_npt"
                currentFilters={filters}
                variant="full"
              />
            </TabsContent>

            <TabsContent value="data" className="space-y-6 mt-6">
              <DataTableWithDB
                reportType="billing_npt_summary"
                title="Billing NPT Summary Records"
                columns={[
                  { key: 'year', label: 'Year', sortable: true },
                  { key: 'month', label: 'Month', sortable: true },
                  { key: 'rig', label: 'Rig', sortable: true },
                  { key: 'opr_rate', label: 'Opr Rate', sortable: true },
                  { key: 'reduce_rate', label: 'Reduce Rate', sortable: true },
                  { key: 'repair_rate', label: 'Repair Rate', sortable: true },
                  { key: 'zero_rate', label: 'Zero Rate', sortable: true },
                  { key: 'special_rate', label: 'Special Rate', sortable: true },
                  { key: 'rig_move', label: 'Rig Move', sortable: true },
                  { key: 'a_maint', label: 'A.Maint', sortable: true },
                  { key: 'total', label: 'Total', sortable: true },
                  { key: 'total_npt', label: 'Total NPT', sortable: true },
                ]}
                formatRow={(row) => ({
                  ...row,
                  opr_rate: row.opr_rate?.toFixed(2) || '0.00',
                  reduce_rate: row.reduce_rate?.toFixed(2) || '0.00',
                  repair_rate: row.repair_rate?.toFixed(2) || '0.00',
                  zero_rate: row.zero_rate?.toFixed(2) || '0.00',
                  special_rate: row.special_rate?.toFixed(2) || '0.00',
                  rig_move: row.rig_move?.toFixed(2) || '0.00',
                  a_maint: row.a_maint?.toFixed(2) || '0.00',
                  total: row.total?.toFixed(2) || '0.00',
                  total_npt: row.total_npt?.toFixed(2) || '0.00',
                })}
              />
            </TabsContent>

            <TabsContent value="analytics" className="space-y-6 mt-6">
              <div className="text-center text-muted-foreground py-12">
                <p className="text-lg font-semibold mb-2">Advanced Analytics Coming Soon</p>
                <p className="text-sm">Additional trend analysis, forecasting, and detailed reporting features will be available here.</p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      }
    />
  );
};

export default BillingNPTSummary;

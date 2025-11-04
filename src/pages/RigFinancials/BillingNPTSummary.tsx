import { useMemo } from "react";
import { DataEntryLayout } from "@/components/Reports/DataEntryLayout";
import { DataEntryForm } from "@/components/Reports/DataEntryForm";
import { ExcelUploadZone } from "@/components/Reports/ExcelUploadZone";
import { EnhancedKPICard } from "@/components/Revenue/EnhancedKPICard";
import { useReportData } from "@/hooks/useReportData";
import { useBillingNPTFilters } from "@/hooks/useBillingNPTFilters";
import { useBillingNPTAnalytics } from "@/hooks/useBillingNPTAnalytics";
import { OperationalRateChart } from "@/components/BillingNPT/OperationalRateChart";
import { NPTCategoryChart } from "@/components/BillingNPT/NPTCategoryChart";
import { RigEfficiencyChart } from "@/components/BillingNPT/RigEfficiencyChart";
import { PerformersPanel } from "@/components/BillingNPT/PerformersPanel";
import { NPTCorrelationChart } from "@/components/BillingNPT/NPTCorrelationChart";
import { BillingNPTFilterPanel } from "@/components/BillingNPT/BillingNPTFilterPanel";
import { ActiveFiltersBar } from "@/components/BillingNPT/ActiveFiltersBar";
import { AIInsightsPanel } from "@/components/BillingNPT/AIInsightsPanel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, AlertTriangle, FileText, Target } from "lucide-react";

const BillingNPTSummary = () => {
  const { data: nptData = [] } = useReportData('billing_npt');
  const { data: summaryData = [] } = useReportData('billing_npt_summary');
  const { filters, updateFilters, clearFilters, applyQuickFilter, hasActiveFilters } = useBillingNPTFilters();
  
  const analytics = useBillingNPTAnalytics(nptData, filters);

  const availableYears = useMemo<number[]>(() => {
    const years = new Set(nptData.map((r: any) => r.year).filter(Boolean));
    return Array.from(years).map(y => Number(y)).sort((a, b) => b - a);
  }, [nptData]);

  const availableMonths = useMemo<string[]>(() => {
    const months = new Set(nptData.map((r: any) => r.month).filter(Boolean));
    return Array.from(months).map(m => String(m));
  }, [nptData]);

  const availableRigs = useMemo<string[]>(() => {
    const rigs = new Set(nptData.map((r: any) => r.rig).filter(Boolean));
    return Array.from(rigs).map(r => String(r)).sort();
  }, [nptData]);

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
    // Future: Add rate type filter
    console.log('Category clicked:', category);
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
          <Tabs defaultValue="dashboard" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>

            <TabsContent value="dashboard" className="space-y-6 mt-6">
              {/* KPI Cards */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <EnhancedKPICard
                  title="Total NPT Hours"
                  value={analytics.kpis.totalNPTHours.toLocaleString()}
                  icon={AlertTriangle}
                  trend="neutral"
                  subtitle="All incidents"
                />
                <EnhancedKPICard
                  title="Avg Operational Rate"
                  value={`${analytics.kpis.avgOperationalRate}%`}
                  icon={TrendingUp}
                  trend="neutral"
                  subtitle="Fleet average"
                />
                <EnhancedKPICard
                  title="Total Records"
                  value={analytics.kpis.totalRecords.toLocaleString()}
                  icon={FileText}
                  trend="neutral"
                  subtitle="Data points"
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
                  totalRecords={nptData.length}
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

              <AIInsightsPanel filters={filters} />
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
      entryContent={
        <DataEntryForm
          title="Add NPT Summary Record"
          reportType="billing_npt_summary"
          frequency="monthly"
          fields={[
            { name: 'year', label: 'Year', type: 'number', required: true },
            { name: 'month', label: 'Month', type: 'text', required: true },
            { name: 'rig', label: 'Rig', type: 'text', required: true },
            { name: 'oprRate', label: 'Operational Rate (hrs)', type: 'number' },
            { name: 'reduceRate', label: 'Reduced Rate (hrs)', type: 'number' },
            { name: 'repairRate', label: 'Repair Rate (hrs)', type: 'number' },
            { name: 'zeroRate', label: 'Zero Rate (hrs)', type: 'number' },
            { name: 'specialRate', label: 'Special Rate (hrs)', type: 'number' },
            { name: 'rigMoveReduce', label: 'Rig Move (Reduce) (hrs)', type: 'number' },
            { name: 'rigMove', label: 'Rig Move (hrs)', type: 'number' },
            { name: 'aMaint', label: 'Allowable Maintenance (hrs)', type: 'number' },
            { name: 'aMaintZero', label: 'A.Maint Zero (hrs)', type: 'number' },
            { name: 'total', label: 'Total (hrs)', type: 'number' },
            { name: 'totalNpt', label: 'Total NPT (hrs)', type: 'number' },
          ]}
        />
      }
      uploadContent={
        <ExcelUploadZone
          title="Import Billing NPT Summary Data"
          templateName="billing_npt_summary_template.xlsx"
          reportType="billing_npt_summary"
        />
      }
    />
  );
};

export default BillingNPTSummary;

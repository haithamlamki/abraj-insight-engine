import { useEffect } from "react";
import { DataEntryLayout } from "@/components/Reports/DataEntryLayout";
import { DataTableWithDB } from "@/components/Reports/DataTableWithDB";
import { useReportData } from "@/hooks/useReportData";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUtilizationFilters, UtilizationFilters } from "@/hooks/useUtilizationFilters";
import { useUtilizationAnalytics } from "@/hooks/useUtilizationAnalytics";
import { useReportFilters } from "@/hooks/useReportFilters";
import { KPICardsGrid } from "@/components/Utilization/KPICardsGrid";
import { UtilizationFilterPanel } from "@/components/Utilization/UtilizationFilterPanel";
import { ActiveFiltersBar } from "@/components/Utilization/ActiveFiltersBar";
import { ClientDistributionChart } from "@/components/Utilization/ClientDistributionChart";
import { RigPerformanceTable } from "@/components/Utilization/RigPerformanceTable";
import { UtilizationTrendChart } from "@/components/Utilization/UtilizationTrendChart";
import { UtilizationHeatmap } from "@/components/Utilization/UtilizationHeatmap";
import { UtilizationAnalytics } from "@/components/Reports/UtilizationAnalytics";
import { QuickNavigationBar } from "@/components/QuickNavigationBar";
import { RelatedReportsPanel } from "@/components/RelatedReportsPanel";

const Utilization = () => {
  const { data: rawData = [] } = useReportData("utilization");
  const { filters, updateFilters, filterOptions, filteredData, clearFilters, applyQuickFilter, activeFilterCount, totalRecords, filteredRecords } = useUtilizationFilters(rawData);
  const { kpis, clientDistribution, rigPerformance, timeSeriesData, heatmapData } = useUtilizationAnalytics(filteredData);

  // Cross-report filter integration
  const { filters: crossReportFilters, updateFilters: updateCrossFilters } = useReportFilters('utilization');
  
  useEffect(() => {
    if (Object.keys(crossReportFilters).length > 0) {
      const mappedFilters: UtilizationFilters = {
        years: crossReportFilters.year ? [crossReportFilters.year.toString()] : [],
        months: crossReportFilters.month ? [crossReportFilters.month] : [],
        clients: crossReportFilters.client ? [crossReportFilters.client] : [],
        rigs: crossReportFilters.rigs || (crossReportFilters.rig ? [crossReportFilters.rig] : []),
        status: crossReportFilters.status ? [crossReportFilters.status] : [],
        utilizationRange: [0, 100],
      };
      updateFilters(mappedFilters);
    }
  }, []);

  useEffect(() => {
    const mappedFilters = {
      rigs: filters.rigs,
      year: filters.years[0] ? parseInt(filters.years[0]) : undefined,
      month: filters.months[0],
      client: filters.clients[0],
      status: filters.status[0],
    };
    updateCrossFilters(mappedFilters);
  }, [filters]);

  const handleRemoveFilter = (category: any, value: string) => {
    if (category === 'utilizationRange') {
      updateFilters({ ...filters, utilizationRange: [0, 100] });
    } else {
      const currentValues = filters[category] as string[];
      updateFilters({ ...filters, [category]: currentValues.filter(v => v !== value) });
    }
  };

  const tableColumns = [
    { key: "year", label: "Year", sortable: true },
    { key: "month", label: "Month", sortable: true },
    { key: "rig", label: "Rig", sortable: true },
    { key: "comment", label: "Comment", sortable: true },
    { key: "client", label: "Client", sortable: true },
    { key: "status", label: "Status", sortable: true },
    { key: "utilization", label: "% Utilization", sortable: true },
    { key: "allowableNPT", label: "Allowable NPT", sortable: true },
    { key: "nptType", label: "NPT Type", sortable: true },
    { key: "workingDays", label: "Total Working Days", sortable: true },
    { key: "monthlyTotalDays", label: "Monthly Total Days", sortable: true },
  ];

  return (
    <DataEntryLayout
      title="Rig Utilization"
      description="Track and analyze rig utilization rates across all operations"
      breadcrumbs={[
        { label: "Dashboard", href: "/" },
        { label: "Rig Financials", href: "/rig-financials" },
        { label: "Utilization" }
      ]}
      viewContent={
        <div className="space-y-6">
          {/* Smart Navigation */}
          <QuickNavigationBar 
            currentReport="utilization" 
            currentFilters={filters}
          />

          <Tabs defaultValue="dashboard" className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-3">
              <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="data">Data Table</TabsTrigger>
            </TabsList>

            <TabsContent value="dashboard" className="space-y-6">
              <KPICardsGrid kpis={kpis} onFilterClick={applyQuickFilter} />
              
              <ActiveFiltersBar
                filters={filters}
                onRemoveFilter={handleRemoveFilter}
                onClearAll={clearFilters}
                totalRecords={totalRecords}
                filteredRecords={filteredRecords}
              />

              <div className="grid gap-6 lg:grid-cols-4">
                <div className="lg:col-span-1">
                  <UtilizationFilterPanel
                    filters={filters}
                    onFilterChange={updateFilters}
                    filterOptions={filterOptions}
                    activeFilterCount={activeFilterCount}
                    onClearFilters={clearFilters}
                    onQuickFilter={applyQuickFilter}
                  />
                </div>
                <div className="lg:col-span-3 space-y-6">
                  <div className="grid gap-6 md:grid-cols-2">
                    <UtilizationTrendChart data={timeSeriesData} />
                    <ClientDistributionChart
                      data={clientDistribution}
                      onClientClick={(client) => updateFilters({ ...filters, clients: [client] })}
                    />
                  </div>
                  <UtilizationHeatmap
                    data={heatmapData}
                    onCellClick={(rig, month) => updateFilters({ ...filters, rigs: [rig] })}
                  />
                  <RigPerformanceTable
                    data={rigPerformance}
                    onRigClick={(rig) => updateFilters({ ...filters, rigs: [rig] })}
                  />
                </div>
              </div>

              {/* Related Reports Navigation */}
              <RelatedReportsPanel 
                currentReport="utilization"
                currentFilters={{ 
                  rigs: filters.rigs,
                  year: filters.years[0] ? parseInt(filters.years[0]) : undefined,
                  month: filters.months[0],
                  client: filters.clients[0],
                  status: filters.status[0],
                }}
                variant="full"
              />
            </TabsContent>

            <TabsContent value="analytics" className="space-y-6">
              <UtilizationAnalytics data={filteredData} />
            </TabsContent>

            <TabsContent value="data" className="space-y-6">
              <DataTableWithDB 
                columns={tableColumns} 
                reportType="utilization"
                formatRow={(row) => ({
                  year: row.year,
                  month: row.month,
                  rig: row.rig,
                  comment: row.comment || '-',
                  client: row.client || '-',
                  status: row.status || 'Active',
                  utilization: row.utilization_rate ? `${row.utilization_rate}%` : '-',
                  allowableNPT: row.allowable_npt || '-',
                  nptType: row.npt_type || '-',
                  workingDays: row.working_days || '-',
                  monthlyTotalDays: row.monthly_total_days || '-',
                })}
              />
            </TabsContent>
          </Tabs>
        </div>
      }
    />
  );
};

export default Utilization;

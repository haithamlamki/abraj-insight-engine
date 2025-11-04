import { DataEntryLayout } from "@/components/Reports/DataEntryLayout";
import { DataEntryForm } from "@/components/Reports/DataEntryForm";
import { ExcelUploadZone } from "@/components/Reports/ExcelUploadZone";
import { DataTableWithDB } from "@/components/Reports/DataTableWithDB";
import { useReportData } from "@/hooks/useReportData";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUtilizationFilters } from "@/hooks/useUtilizationFilters";
import { useUtilizationAnalytics } from "@/hooks/useUtilizationAnalytics";
import { KPICardsGrid } from "@/components/Utilization/KPICardsGrid";
import { UtilizationFilterPanel } from "@/components/Utilization/UtilizationFilterPanel";
import { ActiveFiltersBar } from "@/components/Utilization/ActiveFiltersBar";
import { ClientDistributionChart } from "@/components/Utilization/ClientDistributionChart";
import { RigPerformanceTable } from "@/components/Utilization/RigPerformanceTable";
import { UtilizationTrendChart } from "@/components/Utilization/UtilizationTrendChart";
import { UtilizationHeatmap } from "@/components/Utilization/UtilizationHeatmap";
import { UtilizationAnalytics } from "@/components/Reports/UtilizationAnalytics";

const Utilization = () => {
  const { data: rawData = [] } = useReportData("utilization");
  const { filters, updateFilters, filterOptions, filteredData, clearFilters, applyQuickFilter, activeFilterCount, totalRecords, filteredRecords } = useUtilizationFilters(rawData);
  const { kpis, clientDistribution, rigPerformance, timeSeriesData, heatmapData } = useUtilizationAnalytics(filteredData);

  const handleRemoveFilter = (category: any, value: string) => {
    if (category === 'utilizationRange') {
      updateFilters({ ...filters, utilizationRange: [0, 100] });
    } else {
      const currentValues = filters[category] as string[];
      updateFilters({ ...filters, [category]: currentValues.filter(v => v !== value) });
    }
  };

  const formFields = [
    { name: "year", label: "Year", type: "number" as const, required: true },
    { name: "month", label: "Month", type: "select" as const, options: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"], required: true },
    { name: "rig", label: "Rig", type: "text" as const, required: true },
    { name: "comment", label: "Comment", type: "text" as const, required: false },
    { name: "utilization", label: "% Utilization", type: "number" as const, required: true },
    { name: "allowableNPT", label: "Allowable NPT", type: "number" as const, required: true },
    { name: "nptType", label: "NPT Type", type: "text" as const, required: false },
    { name: "workingDays", label: "Total Working Days", type: "number" as const, required: true },
    { name: "monthlyTotalDays", label: "Monthly Total Days", type: "number" as const, required: true },
  ];

  const tableColumns = [
    { key: "year", label: "Year", sortable: true },
    { key: "month", label: "Month", sortable: true },
    { key: "rig", label: "Rig", sortable: true },
    { key: "comment", label: "Comment", sortable: true },
    { key: "utilization", label: "% Utilization", sortable: true },
    { key: "allowableNPT", label: "Allowable NPT", sortable: true },
    { key: "nptType", label: "NPT Type", sortable: true },
    { key: "workingDays", label: "Total Working Days", sortable: true },
    { key: "monthlyTotalDays", label: "Monthly Total Days", sortable: true },
  ];

  const sampleData = [
    { rig: "ADC-225", month: "January", client: "ADNOC", workingDays: "31", allowableNPT: "74.4", actualNPT: "58.2", utilization: "92.2%" },
    { rig: "ADC-226", month: "January", client: "ADNOC", workingDays: "31", allowableNPT: "74.4", actualNPT: "52.1", utilization: "93.8%" },
    { rig: "ADC-227", month: "January", client: "ADNOC", workingDays: "31", allowableNPT: "74.4", actualNPT: "65.5", utilization: "90.5%" },
  ];

  const trendData = [
    { month: "Oct", utilization: 82 },
    { month: "Nov", utilization: 85 },
    { month: "Dec", utilization: 83 },
    { month: "Jan", utilization: 86 },
    { month: "Feb", utilization: 84 },
    { month: "Mar", utilization: 87.5 },
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
      entryContent={
        <DataEntryForm
          title="Enter Utilization Data"
          fields={formFields}
          frequency="daily"
          reportType="utilization"
        />
      }
      uploadContent={
        <ExcelUploadZone
          title="Upload Utilization Report"
          templateName="utilization_template.xlsx"
          reportType="utilization"
        />
      }
    />
  );
};

export default Utilization;

import { DataEntryLayout } from "@/components/Reports/DataEntryLayout";
import { DataEntryForm } from "@/components/Reports/DataEntryForm";
import { ExcelUploadZone } from "@/components/Reports/ExcelUploadZone";
import { DataTableWithDB } from "@/components/Reports/DataTableWithDB";
import { useNPTRootCauseData } from "@/hooks/useNPTRootCauseData";
import { useNPTFilters } from "@/hooks/useNPTFilters";
import { useNPTAnalytics } from "@/hooks/useNPTAnalytics";
import { NPTFilterPanel } from "@/components/NPTRootCause/NPTFilterPanel";
import { NPTKPICards } from "@/components/NPTRootCause/NPTKPICards";
import { NPTTrendChart } from "@/components/NPTRootCause/NPTTrendChart";
import { RigRankingChart } from "@/components/NPTRootCause/RigRankingChart";
import { NPTTypeDonutChart } from "@/components/NPTRootCause/NPTTypeDonutChart";
import { SystemBreakdownChart } from "@/components/NPTRootCause/SystemBreakdownChart";
import { RootCauseParetoChart } from "@/components/NPTRootCause/RootCauseParetoChart";
import { NPTHeatmap } from "@/components/BillingNPT/NPTHeatmap";
import { BillingNPTAnalytics } from "@/components/Reports/BillingNPTAnalytics";
import { BillingNPTFilters, FilterState } from "@/components/Reports/BillingNPTFilters";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState, useMemo } from "react";

const NPTRootCause = () => {
  const { data } = useNPTRootCauseData();
  const { filters, updateFilters, clearFilters, hasActiveFilters, availableOptions } = useNPTFilters(data);
  const analytics = useNPTAnalytics(data, filters);

  // Billing NPT data
  const [billingFilters, setBillingFilters] = useState<FilterState>({
    year: "all",
    month: "all",
    rig: "all",
    nptType: "all",
    system: "all",
    billable: "all",
    searchTerm: "",
  });

  const { data: rawBillingData = [], isLoading: isBillingLoading } = useQuery({
    queryKey: ["billing_npt"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("billing_npt")
        .select("*")
        .order("date", { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
  });

  const filteredBillingData = useMemo(() => {
    return rawBillingData.filter((row: any) => {
      if (billingFilters.year !== "all" && row.year?.toString() !== billingFilters.year) return false;
      if (billingFilters.month !== "all" && row.month?.toString() !== billingFilters.month) return false;
      if (billingFilters.rig !== "all" && row.rig !== billingFilters.rig) return false;
      if (billingFilters.nptType !== "all" && row.npt_type !== billingFilters.nptType) return false;
      if (billingFilters.system !== "all" && row.system !== billingFilters.system) return false;
      if (billingFilters.billable !== "all") {
        const isBillable = row.billable === true;
        if (billingFilters.billable === "true" && !isBillable) return false;
        if (billingFilters.billable === "false" && isBillable) return false;
      }
      if (billingFilters.searchTerm) {
        const searchLower = billingFilters.searchTerm.toLowerCase();
        return (
          row.system?.toLowerCase().includes(searchLower) ||
          row.parent_equipment_failure?.toLowerCase().includes(searchLower) ||
          row.part_equipment_failure?.toLowerCase().includes(searchLower) ||
          row.root_cause?.toLowerCase().includes(searchLower) ||
          row.immediate_cause?.toLowerCase().includes(searchLower) ||
          row.department_responsibility?.toLowerCase().includes(searchLower)
        );
      }
      return true;
    });
  }, [rawBillingData, billingFilters]);

  const handleMonthClick = (month: string) => {
    updateFilters({ months: [month] });
  };

  const handleRigClick = (rig: string) => {
    updateFilters({ rigs: [rig] });
  };

  const handleTypeClick = (type: string) => {
    updateFilters({ nptTypes: [type] });
  };

  const handleSystemClick = (system: string) => {
    updateFilters({ systems: [system] });
  };

  const handleCauseClick = (cause: string) => {
    updateFilters({ rootCauses: [cause] });
  };

  const handleHeatmapClick = (rig: string, month: string) => {
    updateFilters({ rigs: [rig], months: [month] });
  };

  return (
    <DataEntryLayout
      title="NPT Analysis & Root Cause Dashboard"
      description="Comprehensive NPT analysis with billing tracking and root cause investigation"
      breadcrumbs={[
        { label: "Dashboard", href: "/" },
        { label: "Rig Financials", href: "/rig-financials" },
        { label: "NPT Root Cause" }
      ]}
      viewContent={
        <div className="space-y-6">
          <Tabs defaultValue="root-cause" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="root-cause">NPT Root Cause</TabsTrigger>
              <TabsTrigger value="billing">Billing & NPT Analysis</TabsTrigger>
            </TabsList>

            <TabsContent value="root-cause">
              <Tabs defaultValue="dashboard" className="w-full mt-6">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
                  <TabsTrigger value="analysis">Deep Analysis</TabsTrigger>
                  <TabsTrigger value="data">Data Table</TabsTrigger>
                  <TabsTrigger value="quality">Data Quality</TabsTrigger>
                </TabsList>

            <TabsContent value="dashboard" className="space-y-6 mt-6">
              <NPTKPICards kpis={analytics.kpis} />

              {hasActiveFilters && (
                <Card>
                  <CardHeader>
                    <CardTitle>Active Filters</CardTitle>
                    <CardDescription>
                      Showing {analytics.filteredData.length} of {data.length} records
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {filters.years.map(year => (
                        <Badge key={year} variant="secondary">Year: {year}</Badge>
                      ))}
                      {filters.months.map(month => (
                        <Badge key={month} variant="secondary">Month: {month}</Badge>
                      ))}
                      {filters.rigs.map(rig => (
                        <Badge key={rig} variant="secondary">Rig: {rig}</Badge>
                      ))}
                      {filters.nptTypes.map(type => (
                        <Badge key={type} variant="secondary">Type: {type}</Badge>
                      ))}
                      {filters.systems.map(system => (
                        <Badge key={system} variant="secondary">System: {system}</Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              <NPTFilterPanel
                filters={filters}
                availableOptions={availableOptions}
                onFiltersChange={updateFilters}
                onClearFilters={clearFilters}
              />

              <NPTTrendChart 
                data={analytics.monthlyTrend}
                onMonthClick={handleMonthClick}
              />

              <div className="grid gap-6 md:grid-cols-2">
                <RigRankingChart 
                  data={analytics.rigRanking}
                  onRigClick={handleRigClick}
                />
                <NPTTypeDonutChart 
                  data={analytics.nptTypeDistribution}
                  onTypeClick={handleTypeClick}
                />
              </div>

              <SystemBreakdownChart 
                data={analytics.systemBreakdown}
                onSystemClick={handleSystemClick}
              />

              <RootCauseParetoChart 
                data={analytics.rootCausePareto}
                onCauseClick={handleCauseClick}
              />

              <NPTHeatmap
                data={analytics.heatmapData.map(item => ({
                  rig: item.rig,
                  month: item.month,
                  nptPercent: item.hours,
                  totalNPT: item.hours
                }))}
                title="NPT Hours Heatmap: Rig vs Month"
                description="Click a cell to filter by rig and month"
                onCellClick={handleHeatmapClick}
              />
            </TabsContent>

            <TabsContent value="analysis" className="space-y-6 mt-6">
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Department Breakdown</CardTitle>
                    <CardDescription>NPT hours by responsible department</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {analytics.departmentBreakdown.slice(0, 10).map(dept => (
                        <div key={dept.department} className="flex justify-between items-center">
                          <span className="text-sm font-medium">{dept.department}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">{dept.events} events</span>
                            <Badge>{dept.hours} hrs</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Action Party Workload</CardTitle>
                    <CardDescription>NPT hours assigned to action parties</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {analytics.actionPartyWorkload.slice(0, 10).map(party => (
                        <div key={party.party} className="flex justify-between items-center">
                          <span className="text-sm font-medium">{party.party}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">{party.events} events</span>
                            <Badge>{party.hours} hrs</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Duration Distribution</CardTitle>
                  <CardDescription>NPT events by duration bucket</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-4 gap-4">
                    {analytics.durationDistribution.map(bucket => (
                      <div key={bucket.bucket} className="text-center p-4 border rounded-lg">
                        <div className="text-2xl font-bold">{bucket.count}</div>
                        <div className="text-sm text-muted-foreground">{bucket.bucket}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="data" className="space-y-6 mt-6">
              <DataTableWithDB
                reportType="npt_root_cause"
                title="NPT Root Cause Records"
                columns={[
                  { key: 'rig_number', label: 'Rig Number', sortable: true, defaultWidth: 120 },
                  { key: 'year', label: 'Year', sortable: true, defaultWidth: 90 },
                  { key: 'month', label: 'Month', sortable: true, defaultWidth: 100 },
                  { key: 'date', label: 'Date', sortable: true, defaultWidth: 80 },
                  { key: 'hrs', label: 'Hours', sortable: true, defaultWidth: 90 },
                  { key: 'npt_type', label: 'NPT Type', sortable: true, defaultWidth: 150 },
                  { key: 'system', label: 'System', sortable: true, defaultWidth: 150 },
                  { key: 'parent_equipment_failure', label: 'Parent Equipment Failure', sortable: true, defaultWidth: 220 },
                  { key: 'part_equipment_failure', label: 'Part Equipment Failure', sortable: true, defaultWidth: 220 },
                  { key: 'contractual_process', label: 'Contractual Process', sortable: true, defaultWidth: 180 },
                  { key: 'department_responsibility', label: 'Department Responsibility', sortable: true, defaultWidth: 200 },
                  { key: 'immediate_cause_of_failure', label: 'Immediate Cause of Failure', sortable: true, defaultWidth: 250 },
                  { key: 'root_cause', label: 'Root Cause', sortable: true, defaultWidth: 250 },
                  { key: 'immediate_corrective_action', label: 'Immediate Corrective Action', sortable: true, defaultWidth: 250 },
                  { key: 'future_action_improvement', label: 'Future Action & Improvement', sortable: true, defaultWidth: 250 },
                  { key: 'action_party', label: 'Action Party', sortable: true, defaultWidth: 150 },
                  { key: 'notification_number', label: 'Notification Number (N2)', sortable: true, defaultWidth: 180 },
                  { key: 'failure_investigation_reports', label: 'Failure Investigation Reports', sortable: true, defaultWidth: 240 },
                ]}
                formatRow={(row) => ({
                  ...row,
                  hrs: row.hrs?.toFixed(2) || '0.00',
                })}
              />
            </TabsContent>

            <TabsContent value="quality" className="space-y-6 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Data Quality Metrics</CardTitle>
                  <CardDescription>Track completeness and investigation status</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center p-4 border rounded-lg">
                        <div className="text-2xl font-bold">
                          {((analytics.filteredData.filter(r => r.root_cause).length / analytics.filteredData.length) * 100).toFixed(1)}%
                        </div>
                        <div className="text-sm text-muted-foreground">Root Cause Documented</div>
                      </div>
                      <div className="text-center p-4 border rounded-lg">
                        <div className="text-2xl font-bold">
                          {((analytics.filteredData.filter(r => r.notification_number).length / analytics.filteredData.length) * 100).toFixed(1)}%
                        </div>
                        <div className="text-sm text-muted-foreground">Has N2 Number</div>
                      </div>
                      <div className="text-center p-4 border rounded-lg">
                        <div className="text-2xl font-bold">
                          {((analytics.filteredData.filter(r => r.failure_investigation_reports).length / analytics.filteredData.length) * 100).toFixed(1)}%
                        </div>
                        <div className="text-sm text-muted-foreground">Investigation Complete</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </TabsContent>

        <TabsContent value="billing">
          <Tabs defaultValue="data" className="space-y-6 mt-6">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="data">Data Table</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>

            <TabsContent value="data" className="space-y-6">
              <BillingNPTFilters data={rawBillingData} onFilterChange={setBillingFilters} />
              
              {isBillingLoading ? (
                <div className="text-center py-12 text-muted-foreground">Loading data...</div>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      Showing {filteredBillingData.length} of {rawBillingData.length} records
                    </p>
                  </div>
                  <DataTableWithDB 
                    columns={[
                      { key: "rig", label: "Rig Number", sortable: true },
                      { key: "year", label: "Year", sortable: true },
                      { key: "month", label: "Month", sortable: true },
                      { key: "date", label: "Date", sortable: true },
                      { key: "hours", label: "Hrs.", sortable: true },
                      { key: "nptType", label: "NPT Type", sortable: true },
                      { key: "system", label: "SYSTEM", sortable: true },
                      { key: "parentEquipment", label: "Parent Equipment", sortable: true },
                      { key: "partEquipment", label: "Part Equipment", sortable: true },
                      { key: "contractualProcess", label: "Contractual Process", sortable: true },
                      { key: "department", label: "Department", sortable: true },
                      { key: "immediateCause", label: "Immediate Cause", sortable: true },
                      { key: "rootCause", label: "Root Cause", sortable: true },
                      { key: "correctiveAction", label: "Corrective Action", sortable: true },
                      { key: "futureAction", label: "Future Action", sortable: true },
                      { key: "actionParty", label: "Action Party", sortable: true },
                      { key: "notificationNumber", label: "Notification (N2)", sortable: true },
                      { key: "failureReports", label: "Failure Reports", sortable: true },
                    ]} 
                    reportType="billing_npt"
                    formatRow={(row) => ({
                      rig: row.rig || '-',
                      year: row.year || '-',
                      month: row.month || '-',
                      date: row.date ? new Date(row.date).toLocaleDateString() : '-',
                      hours: row.npt_hours || '-',
                      nptType: row.npt_type || '-',
                      system: row.system || '-',
                      parentEquipment: row.parent_equipment_failure || '-',
                      partEquipment: row.part_equipment_failure || '-',
                      contractualProcess: row.contractual_process || '-',
                      department: row.department_responsibility || '-',
                      immediateCause: row.immediate_cause || '-',
                      rootCause: row.root_cause || '-',
                      correctiveAction: row.corrective_action || '-',
                      futureAction: row.future_action || '-',
                      actionParty: row.action_party || '-',
                      notificationNumber: row.notification_number || '-',
                      failureReports: row.failure_investigation_reports || '-',
                    })}
                  />
                </>
              )}
            </TabsContent>

            <TabsContent value="analytics" className="space-y-6">
              {isBillingLoading ? (
                <div className="text-center py-12 text-muted-foreground">Loading analytics...</div>
              ) : (
                <BillingNPTAnalytics data={filteredBillingData} />
              )}
            </TabsContent>
          </Tabs>
        </TabsContent>

          </Tabs>
        </div>
      }
      entryContent={
        <DataEntryForm
          title="Add NPT Root Cause Record"
          reportType="npt_root_cause"
          frequency="monthly"
          fields={[
            { name: 'rigNumber', label: 'Rig Number', type: 'text', required: true },
            { name: 'year', label: 'Year', type: 'number', required: true },
            { name: 'month', label: 'Month', type: 'text', required: true },
            { name: 'date', label: 'Date', type: 'number', required: true },
            { name: 'hrs', label: 'Hours', type: 'number', required: true },
            { name: 'nptType', label: 'NPT Type', type: 'text', required: true },
            { name: 'system', label: 'System', type: 'text', required: true },
            { name: 'parentEquipmentFailure', label: 'Parent Equipment', type: 'text' },
            { name: 'partEquipmentFailure', label: 'Part Equipment', type: 'text' },
            { name: 'contractualProcess', label: 'Contractual Process', type: 'text' },
            { name: 'departmentResponsibility', label: 'Department', type: 'text' },
            { name: 'immediateCauseOfFailure', label: 'Immediate Cause', type: 'text' },
            { name: 'rootCause', label: 'Root Cause', type: 'text' },
            { name: 'immediateCorrectiveAction', label: 'Corrective Action', type: 'text' },
            { name: 'futureActionImprovement', label: 'Future Action', type: 'text' },
            { name: 'actionParty', label: 'Action Party', type: 'text' },
            { name: 'notificationNumber', label: 'N2 Number', type: 'text' },
            { name: 'failureInvestigationReports', label: 'Investigation Status', type: 'text' },
          ]}
        />
      }
      uploadContent={
        <ExcelUploadZone
          title="Import NPT Root Cause Data"
          templateName="npt_root_cause_template.xlsx"
          reportType="npt_root_cause"
        />
      }
    />
  );
};

export default NPTRootCause;

import { useState, useMemo } from "react";
import { DataEntryLayout } from "@/components/Reports/DataEntryLayout";
import { DataEntryForm } from "@/components/Reports/DataEntryForm";
import { ExcelUploadZone } from "@/components/Reports/ExcelUploadZone";
import { DataTableWithDB } from "@/components/Reports/DataTableWithDB";
import { HistoricalTrendChart } from "@/components/Reports/HistoricalTrendChart";
import { KPICard } from "@/components/Dashboard/KPICard";
import { KPICardWithBudget } from "@/components/Dashboard/KPICardWithBudget";
import { UtilizationFilters, FilterState } from "@/components/Reports/UtilizationFilters";
import { UtilizationAnalytics } from "@/components/Reports/UtilizationAnalytics";
import { Percent, TrendingUp, Calendar, BarChart3 } from "lucide-react";
import { useKPIData } from "@/hooks/useKPIData";
import { useChartData } from "@/hooks/useChartData";
import { useReportData } from "@/hooks/useReportData";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Utilization = () => {
  const [filters, setFilters] = useState<FilterState>({
    year: "all",
    month: "all",
    rig: "all",
    nptType: "all",
  });

  const { data: rawData, isLoading: dataLoading } = useReportData("utilization");
  const { kpis, isLoading: kpisLoading } = useKPIData("utilization");
  const { chartData, isLoading: chartLoading } = useChartData("utilization");

  // Filter data based on active filters
  const filteredData = useMemo(() => {
    if (!rawData) return [];
    
    return rawData.filter((row: any) => {
      if (filters.year !== "all" && row.year?.toString() !== filters.year) return false;
      if (filters.month !== "all" && row.month !== filters.month) return false;
      if (filters.rig !== "all" && row.rig !== filters.rig) return false;
      if (filters.nptType !== "all" && row.npt_type !== filters.nptType) return false;
      return true;
    });
  }, [rawData, filters]);

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
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="data">Data Table</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid gap-6 md:grid-cols-3">
                <KPICardWithBudget 
                  title="Fleet Utilization" 
                  value={kpisLoading ? "..." : `${kpis?.avgUtilization || 0}%`}
                  icon={Percent}
                  reportKey="utilization"
                  year={new Date().getFullYear()}
                  month={new Date().getMonth() + 1}
                  metricKey="utilization_rate"
                />
                <KPICard 
                  title="Working Days" 
                  value={kpisLoading ? "..." : kpis?.totalWorkingDays || 0}
                  trend="up" 
                  icon={Calendar} 
                />
                <KPICard 
                  title="Total Records" 
                  value={dataLoading ? "..." : rawData?.length || 0}
                  icon={BarChart3} 
                />
              </div>

              <UtilizationFilters 
                data={rawData || []} 
                onFilterChange={setFilters} 
              />

              <HistoricalTrendChart
                title="Utilization Trend"
                description="Fleet utilization rate over time"
                data={chartLoading ? [] : chartData}
                dataKeys={[
                  { key: "utilization", label: "Utilization Rate", color: "hsl(var(--chart-1))" }
                ]}
                xAxisKey="month"
              />
            </TabsContent>

            <TabsContent value="analytics" className="space-y-6">
              <UtilizationFilters 
                data={rawData || []} 
                onFilterChange={setFilters} 
              />
              <UtilizationAnalytics data={filteredData} />
            </TabsContent>

            <TabsContent value="data" className="space-y-6">
              <UtilizationFilters 
                data={rawData || []} 
                onFilterChange={setFilters} 
              />
              <DataTableWithDB 
                columns={tableColumns} 
                reportType="utilization"
                formatRow={(row) => ({
                  year: row.year,
                  month: row.month,
                  rig: row.rig,
                  comment: row.comment || '-',
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

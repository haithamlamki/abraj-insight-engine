import { useState, useMemo } from "react";
import { DataEntryLayout } from "@/components/Reports/DataEntryLayout";
import { DataEntryForm } from "@/components/Reports/DataEntryForm";
import { ExcelUploadZone } from "@/components/Reports/ExcelUploadZone";
import { DataTableWithDB } from "@/components/Reports/DataTableWithDB";
import { HistoricalTrendChart } from "@/components/Reports/HistoricalTrendChart";
import { KPICard } from "@/components/Dashboard/KPICard";
import { KPICardWithBudget } from "@/components/Dashboard/KPICardWithBudget";
import { DollarSign, AlertTriangle, Calendar, BarChart3 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useReportData } from "@/hooks/useReportData";
import { YTDFilters } from "@/components/Reports/YTDFilters";
import { YTDAnalytics } from "@/components/Reports/YTDAnalytics";

const YTD = () => {
  const [filters, setFilters] = useState({
    year: "all",
    month: "all",
    rig: "all",
    nptType: "all",
  });

  const { data: nptData, isLoading: nptLoading } = useReportData("billing_npt");
  const { data: revenueData, isLoading: revenueLoading } = useReportData("revenue");

  // Filter NPT data
  const filteredNptData = useMemo(() => {
    if (!nptData) return [];
    
    return nptData.filter((row: any) => {
      if (filters.year !== "all" && row.year?.toString() !== filters.year) return false;
      if (filters.month !== "all" && row.month !== filters.month) return false;
      if (filters.rig !== "all" && row.rig !== filters.rig) return false;
      if (filters.nptType !== "all") {
        const isBillable = row.billable === true;
        if (filters.nptType === "Billable" && !isBillable) return false;
        if (filters.nptType === "Non-Billable" && isBillable) return false;
      }
      return true;
    });
  }, [nptData, filters]);

  // Calculate KPIs
  const kpis = useMemo(() => {
    const totalNptHours = filteredNptData.reduce((sum, item) => sum + (parseFloat(item.npt_hours) || 0), 0);
    const billableHours = filteredNptData.filter(i => i.billable === true).reduce((sum, item) => sum + (parseFloat(item.npt_hours) || 0), 0);
    const ytdRevenue = revenueData?.reduce((sum: number, item: any) => sum + (parseFloat(item.revenue_actual) || 0), 0) || 0;
    
    return {
      totalNptHours: totalNptHours.toFixed(1),
      billableHours: billableHours.toFixed(1),
      incidents: filteredNptData.length,
      ytdRevenue: (ytdRevenue / 1000000).toFixed(1)
    };
  }, [filteredNptData, revenueData]);

  const formFields = [
    { name: "month", label: "Month", type: "select" as const, options: ["January", "February", "March"], required: true },
    { name: "revenue", label: "Revenue ($)", type: "number" as const, required: true },
    { name: "costs", label: "Costs ($)", type: "number" as const, required: true },
    { name: "profit", label: "Profit ($)", type: "number" as const, required: true },
  ];

  const tableColumns = [
    { key: "month", label: "Month", sortable: true },
    { key: "revenue", label: "Revenue", sortable: true },
    { key: "costs", label: "Costs", sortable: true },
    { key: "profit", label: "Profit", sortable: true },
    { key: "margin", label: "Margin %", sortable: true },
  ];

  const sampleData = [
    { month: "January", revenue: "$4.2M", costs: "$3.1M", profit: "$1.1M", margin: "26.2%" },
    { month: "February", revenue: "$4.5M", costs: "$3.3M", profit: "$1.2M", margin: "26.7%" },
    { month: "March", revenue: "$3.8M", costs: "$2.8M", profit: "$1.0M", margin: "26.3%" },
  ];

  const trendData = [
    { month: "Jan", revenue: 4.2, target: 4.0 },
    { month: "Feb", revenue: 4.5, target: 4.2 },
    { month: "Mar", revenue: 3.8, target: 4.1 },
  ];

  return (
    <DataEntryLayout
      title="YTD Analysis"
      description="Year-to-date financial performance tracking and analysis"
      breadcrumbs={[
        { label: "Dashboard", href: "/" },
        { label: "Rig Financials", href: "/rig-financials" },
        { label: "YTD" }
      ]}
      viewContent={
        <div className="space-y-6">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="analytics">NPT Analytics</TabsTrigger>
              <TabsTrigger value="data">Data Table</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid gap-6 md:grid-cols-4">
                <KPICardWithBudget 
                  title="YTD Revenue" 
                  value={revenueLoading ? "..." : `$${kpis.ytdRevenue}M`}
                  icon={DollarSign}
                  reportKey="revenue"
                  year={new Date().getFullYear()}
                  metricKey="revenue_omr"
                />
                <KPICardWithBudget 
                  title="Total NPT Hours" 
                  value={nptLoading ? "..." : kpis.totalNptHours}
                  icon={AlertTriangle}
                  reportKey="billing_npt"
                  year={new Date().getFullYear()}
                  metricKey="npt_hours"
                />
                <KPICard 
                  title="Billable NPT Hours" 
                  value={nptLoading ? "..." : kpis.billableHours}
                  icon={Calendar} 
                />
                <KPICard 
                  title="Total Incidents" 
                  value={nptLoading ? "..." : kpis.incidents}
                  icon={BarChart3} 
                />
              </div>

              <HistoricalTrendChart
                title="Revenue vs Target"
                description="Monthly revenue performance against targets"
                data={trendData}
                dataKeys={[
                  { key: "revenue", label: "Actual Revenue ($M)", color: "hsl(var(--primary))" },
                  { key: "target", label: "Target ($M)", color: "hsl(var(--chart-2))" }
                ]}
                xAxisKey="month"
              />
            </TabsContent>

            <TabsContent value="analytics" className="space-y-6">
              <YTDFilters data={nptData || []} onFilterChange={setFilters} />
              <YTDAnalytics data={filteredNptData} />
            </TabsContent>

            <TabsContent value="data" className="space-y-6">
              <YTDFilters data={nptData || []} onFilterChange={setFilters} />
              <DataTableWithDB 
                columns={[
                  { key: "rig", label: "Rig", sortable: true },
                  { key: "date", label: "Date", sortable: true },
                  { key: "npt_hours", label: "Hours", sortable: true },
                  { key: "system", label: "System", sortable: true },
                  { key: "billable", label: "Billable", sortable: true },
                  { key: "root_cause", label: "Root Cause", sortable: true },
                ]} 
                reportType="billing_npt"
                formatRow={(row) => ({
                  rig: row.rig || '-',
                  date: row.date || '-',
                  npt_hours: row.npt_hours || '-',
                  system: row.system || '-',
                  billable: row.billable ? 'Yes' : 'No',
                  root_cause: row.root_cause || '-',
                })}
              />
            </TabsContent>
          </Tabs>
        </div>
      }
      entryContent={
        <DataEntryForm
          title="Enter YTD Data"
          fields={formFields}
          frequency="monthly"
          reportType="revenue"
        />
      }
      uploadContent={
        <div className="space-y-6">
          <ExcelUploadZone
            title="Upload NPT Data"
            templateName="billing_npt_template.xlsx"
            reportType="billing_npt"
          />
          <ExcelUploadZone
            title="Upload Revenue Data"
            templateName="ytd_template.xlsx"
            reportType="ytd"
          />
        </div>
      }
    />
  );
};

export default YTD;

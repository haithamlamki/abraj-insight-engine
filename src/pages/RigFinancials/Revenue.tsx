import { DataEntryLayout } from "@/components/Reports/DataEntryLayout";
import { DataEntryForm } from "@/components/Reports/DataEntryForm";
import { ExcelUploadZone } from "@/components/Reports/ExcelUploadZone";
import { DataTableWithDB } from "@/components/Reports/DataTableWithDB";
import { HistoricalTrendChart } from "@/components/Reports/HistoricalTrendChart";
import { KPICard } from "@/components/Dashboard/KPICard";
import { DollarSign, TrendingUp, PieChart } from "lucide-react";
import { useKPIData } from "@/hooks/useKPIData";
import { useChartData } from "@/hooks/useChartData";

const Revenue = () => {
  const { kpis, isLoading: kpisLoading } = useKPIData("revenue");
  const { chartData, isLoading: chartLoading } = useChartData("revenue");

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
      title="Revenue Analysis"
      description="Detailed revenue tracking and breakdown by rig"
      breadcrumbs={[
        { label: "Dashboard", href: "/" },
        { label: "Rig Financials", href: "/rig-financials" },
        { label: "Revenue" }
      ]}
      viewContent={
        <div className="space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            <KPICard 
              title="Total Revenue" 
              value={kpisLoading ? "..." : `$${Number(kpis?.totalRevenue || 0).toLocaleString()}`}
              trend="up" 
              icon={DollarSign} 
            />
            <KPICard 
              title="Budget Variance" 
              value={kpisLoading ? "..." : `${kpis?.variance || 0}%`}
              change={Number(kpis?.variance || 0)}
              trend={Number(kpis?.variance || 0) >= 0 ? "up" : "down"}
              icon={TrendingUp} 
            />
            <KPICard 
              title="Avg Dayrate" 
              value={kpisLoading ? "..." : `$${Number(kpis?.avgDayrate || 0).toLocaleString()}`}
              icon={PieChart} 
            />
          </div>

          <HistoricalTrendChart
            title="Revenue Trend"
            description="Actual vs Budget revenue over time"
            data={chartLoading ? [] : chartData}
            dataKeys={[
              { key: "actual", label: "Actual Revenue", color: "hsl(var(--chart-1))" },
              { key: "budget", label: "Budget Revenue", color: "hsl(var(--chart-2))" }
            ]}
            xAxisKey="month"
          />

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
        </div>
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

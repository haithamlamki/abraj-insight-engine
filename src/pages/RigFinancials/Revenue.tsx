import { DataEntryLayout } from "@/components/Reports/DataEntryLayout";
import { DataEntryForm } from "@/components/Reports/DataEntryForm";
import { ExcelUploadZone } from "@/components/Reports/ExcelUploadZone";
import { DataTableWithDB } from "@/components/Reports/DataTableWithDB";
import { HistoricalTrendChart } from "@/components/Reports/HistoricalTrendChart";
import { KPICard } from "@/components/Dashboard/KPICard";
import { DollarSign, TrendingUp, PieChart } from "lucide-react";

const Revenue = () => {
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
    { key: "rig", label: "Rig", sortable: true },
    { key: "month", label: "Month", sortable: true },
    { key: "days", label: "Days", sortable: true },
    { key: "fuel", label: "Fuel", sortable: true },
    { key: "nptRepair", label: "NPT Repair", sortable: true },
    { key: "nptZero", label: "NPT Zero", sortable: true },
    { key: "client", label: "Client", sortable: true },
    { key: "revTotal", label: "Revenue Total", sortable: true },
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
            <KPICard title="Monthly Revenue" value="$1.85M" change={8.7} trend="up" icon={DollarSign} />
            <KPICard title="Average Daily Rate" value="$45,000" change={3.2} trend="up" icon={TrendingUp} />
            <KPICard title="Revenue per Rig" value="$74K" change={5.5} trend="up" icon={PieChart} />
          </div>

          <HistoricalTrendChart
            title="Revenue Breakdown"
            description="Revenue components by month"
            data={trendData}
            dataKeys={[
              { key: "revenue", label: "Total Revenue ($M)", color: "hsl(var(--primary))" },
              { key: "fuel", label: "Fuel ($M)", color: "hsl(var(--chart-2))" },
              { key: "nptRepair", label: "NPT Repair ($M)", color: "hsl(var(--chart-3))" },
              { key: "nptZero", label: "NPT Zero ($M)", color: "hsl(var(--chart-4))" }
            ]}
            xAxisKey="month"
          />

          <DataTableWithDB 
            columns={tableColumns} 
            reportType="revenue"
            formatRow={(row) => ({
              ...row,
              rig: row.rig,
              month: row.month,
              days: row.working_days,
              fuel: `$${row.fuel_charge?.toLocaleString() || 0}`,
              nptRepair: `$${row.npt_repair?.toLocaleString() || 0}`,
              nptZero: `$${row.npt_zero?.toLocaleString() || 0}`,
              client: row.client || '-',
              revTotal: `$${(row.revenue_actual / 1000000).toFixed(1)}M`
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

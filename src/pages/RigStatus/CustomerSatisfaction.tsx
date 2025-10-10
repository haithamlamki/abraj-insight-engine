import { DataEntryLayout } from "@/components/Reports/DataEntryLayout";
import { DataEntryForm } from "@/components/Reports/DataEntryForm";
import { ExcelUploadZone } from "@/components/Reports/ExcelUploadZone";
import { DataTableWithDB } from "@/components/Reports/DataTableWithDB";
import { HistoricalTrendChart } from "@/components/Reports/HistoricalTrendChart";
import { KPICard } from "@/components/Dashboard/KPICard";
import { SmilePlus, Star, TrendingUp } from "lucide-react";
import { useKPIData } from "@/hooks/useKPIData";
import { useChartData } from "@/hooks/useChartData";

const CustomerSatisfaction = () => {
  const { kpis, isLoading: kpisLoading } = useKPIData("customer_satisfaction");
  const { chartData, isLoading: chartLoading } = useChartData("customer_satisfaction");

  const formFields = [
    { name: "rig", label: "Rig", type: "text" as const, required: true },
    { name: "month", label: "Month", type: "select" as const, options: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"], required: true },
    { name: "year", label: "Year", type: "select" as const, options: ["2024", "2023", "2022"], required: true },
    { name: "satisfactionRate", label: "Satisfaction Rate (%)", type: "number" as const, required: true },
    { name: "responseTime", label: "Avg Response Time (hrs)", type: "number" as const },
    { name: "issuesResolved", label: "Issues Resolved", type: "number" as const },
    { name: "clientFeedback", label: "Client Feedback", type: "text" as const },
  ];

  const tableColumns = [
    { key: "rig", label: "Rig", sortable: true },
    { key: "month", label: "Month", sortable: true },
    { key: "satisfactionRate", label: "Satisfaction", sortable: true },
    { key: "responseTime", label: "Response Time", sortable: true },
    { key: "issuesResolved", label: "Issues Resolved", sortable: true },
  ];

  const sampleData = [
    { rig: "ADC-225", month: "January", satisfactionRate: "94.5%", responseTime: "2.3", issuesResolved: "45" },
    { rig: "ADC-226", month: "January", satisfactionRate: "96.8%", responseTime: "1.8", issuesResolved: "38" },
    { rig: "ADC-227", month: "January", satisfactionRate: "92.2%", responseTime: "2.8", issuesResolved: "52" },
  ];

  const trendData = [
    { month: "Oct", satisfaction: 93.2, responseTime: 2.5 },
    { month: "Nov", satisfaction: 94.5, responseTime: 2.3 },
    { month: "Dec", satisfaction: 96.8, responseTime: 1.8 },
    { month: "Jan", satisfaction: 92.8, responseTime: 2.6 },
    { month: "Feb", satisfaction: 95.2, responseTime: 2.1 },
    { month: "Mar", satisfaction: 94.5, responseTime: 2.3 },
  ];

  return (
    <DataEntryLayout
      title="Customer Satisfaction"
      description="Track client feedback and satisfaction scores"
      breadcrumbs={[
        { label: "Dashboard", href: "/" },
        { label: "Rig Status", href: "/rig-status" },
        { label: "Customer Satisfaction" }
      ]}
      viewContent={
        <div className="space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            <KPICard 
              title="Avg Score" 
              value={kpisLoading ? "..." : `${kpis?.avgScore || 0}/5.0`}
              icon={Star} 
            />
            <KPICard 
              title="Total Surveys" 
              value={kpisLoading ? "..." : kpis?.recordCount || 0}
              icon={SmilePlus} 
            />
            <KPICard 
              title="Satisfaction Rate" 
              value={kpisLoading ? "..." : `${kpis?.satisfactionRate || 0}%`}
              icon={TrendingUp} 
            />
          </div>

          <HistoricalTrendChart
            title="Customer Satisfaction Metrics"
            description="Satisfaction scores over time"
            data={chartLoading ? [] : chartData}
            dataKeys={[
              { key: "score", label: "Satisfaction Score", color: "hsl(var(--primary))" }
            ]}
            xAxisKey="month"
          />

          <DataTableWithDB 
            columns={tableColumns} 
            reportType="customer_satisfaction"
            formatRow={(row) => ({
              ...row,
              satisfactionRate: `${row.satisfaction_score}%`,
              responseTime: '-',
              issuesResolved: '-'
            })}
          />
        </div>
      }
      entryContent={
        <DataEntryForm
          title="Enter Satisfaction Data"
          fields={formFields}
          frequency="daily"
          reportType="customer_satisfaction"
        />
      }
      uploadContent={
        <ExcelUploadZone
          title="Upload Satisfaction Report"
          templateName="satisfaction_template.xlsx"
          reportType="customer_satisfaction"
        />
      }
    />
  );
};

export default CustomerSatisfaction;

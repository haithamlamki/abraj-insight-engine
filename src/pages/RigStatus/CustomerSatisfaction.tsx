import { DataEntryLayout } from "@/components/Reports/DataEntryLayout";
import { DataEntryForm } from "@/components/Reports/DataEntryForm";
import { ExcelUploadZone } from "@/components/Reports/ExcelUploadZone";
import { DataTable } from "@/components/Reports/DataTable";
import { HistoricalTrendChart } from "@/components/Reports/HistoricalTrendChart";
import { KPICard } from "@/components/Dashboard/KPICard";
import { SmilePlus, Star, TrendingUp } from "lucide-react";

const CustomerSatisfaction = () => {
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
            <KPICard title="Avg Rating" value="4.7/5.0" change={6} trend="up" icon={Star} />
            <KPICard title="Total Surveys" value="45" change={12.5} trend="up" icon={SmilePlus} />
            <KPICard title="Satisfaction Rate" value="94%" change={3.2} trend="up" icon={TrendingUp} />
          </div>

          <HistoricalTrendChart
            title="Customer Satisfaction Metrics"
            description="Satisfaction rate and response time trends"
            data={trendData}
            dataKeys={[
              { key: "satisfaction", label: "Satisfaction Rate (%)", color: "hsl(var(--primary))" },
              { key: "responseTime", label: "Avg Response Time (hrs)", color: "hsl(var(--chart-2))" }
            ]}
            xAxisKey="month"
          />

          <DataTable columns={tableColumns} data={sampleData} />
        </div>
      }
      entryContent={
        <DataEntryForm
          title="Enter Satisfaction Data"
          fields={formFields}
          frequency="daily"
        />
      }
      uploadContent={
        <ExcelUploadZone
          title="Upload Satisfaction Report"
          templateName="satisfaction_template.xlsx"
        />
      }
    />
  );
};

export default CustomerSatisfaction;

import { DataEntryLayout } from "@/components/Reports/DataEntryLayout";
import { DataEntryForm } from "@/components/Reports/DataEntryForm";
import { ExcelUploadZone } from "@/components/Reports/ExcelUploadZone";
import { DataTable } from "@/components/Reports/DataTable";
import { HistoricalTrendChart } from "@/components/Reports/HistoricalTrendChart";
import { KPICard } from "@/components/Dashboard/KPICard";
import { SmilePlus, Star, TrendingUp } from "lucide-react";

const CustomerSatisfaction = () => {
  const formFields = [
    { name: "date", label: "Survey Date", type: "date" as const, required: true },
    { name: "clientName", label: "Client Name", type: "text" as const, required: true },
    { name: "rigNumber", label: "Rig Number", type: "text" as const, required: true },
    { name: "rating", label: "Rating (1-5)", type: "number" as const, required: true },
    { name: "feedback", label: "Feedback", type: "text" as const },
  ];

  const tableColumns = [
    { key: "date", label: "Date", sortable: true },
    { key: "clientName", label: "Client", sortable: true },
    { key: "rigNumber", label: "Rig", sortable: true },
    { key: "rating", label: "Rating", sortable: true },
    { key: "feedback", label: "Feedback", sortable: false },
  ];

  const sampleData = [
    { date: "2024-03-15", clientName: "Company A", rigNumber: "Rig-101", rating: "4.8/5", feedback: "Excellent service" },
    { date: "2024-03-14", clientName: "Company B", rigNumber: "Rig-205", rating: "4.5/5", feedback: "Good performance" },
    { date: "2024-03-12", clientName: "Company C", rigNumber: "Rig-102", rating: "4.9/5", feedback: "Outstanding work" },
  ];

  const trendData = [
    { month: "Oct", rating: 4.4 },
    { month: "Nov", rating: 4.5 },
    { month: "Dec", rating: 4.6 },
    { month: "Jan", rating: 4.5 },
    { month: "Feb", rating: 4.7 },
    { month: "Mar", rating: 4.7 },
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
            title="Customer Satisfaction Trend"
            description="Average satisfaction rating over time"
            data={trendData}
            dataKeys={[{ key: "rating", label: "Rating", color: "hsl(var(--success))" }]}
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

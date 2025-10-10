import { DataEntryLayout } from "@/components/Reports/DataEntryLayout";
import { DataEntryForm } from "@/components/Reports/DataEntryForm";
import { ExcelUploadZone } from "@/components/Reports/ExcelUploadZone";
import { DataTableWithDB } from "@/components/Reports/DataTableWithDB";
import { BillingNPTAnalytics } from "@/components/Reports/BillingNPTAnalytics";
import { BillingNPTFilters, FilterState } from "@/components/Reports/BillingNPTFilters";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState, useMemo } from "react";

const BillingNPT = () => {
  const [filters, setFilters] = useState<FilterState>({
    year: "all",
    month: "all",
    rig: "all",
    nptType: "all",
    system: "all",
    billable: "all",
    searchTerm: "",
  });

  // Fetch billing NPT data
  const { data: rawData = [], isLoading } = useQuery({
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

  // Apply filters
  const filteredData = useMemo(() => {
    return rawData.filter((row: any) => {
      if (filters.year !== "all" && row.year?.toString() !== filters.year) return false;
      if (filters.month !== "all" && row.month?.toString() !== filters.month) return false;
      if (filters.rig !== "all" && row.rig !== filters.rig) return false;
      if (filters.nptType !== "all" && row.npt_type !== filters.nptType) return false;
      if (filters.system !== "all" && row.system !== filters.system) return false;
      if (filters.billable !== "all") {
        const isBillable = row.billable === true;
        if (filters.billable === "true" && !isBillable) return false;
        if (filters.billable === "false" && isBillable) return false;
      }
      if (filters.searchTerm) {
        const searchLower = filters.searchTerm.toLowerCase();
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
  }, [rawData, filters]);

  const formFields = [
    { name: "rig", label: "Rig Number", type: "text" as const, required: true },
    { name: "year", label: "Year", type: "number" as const, required: true },
    { name: "month", label: "Month", type: "select" as const, options: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"], required: true },
    { name: "date", label: "Date", type: "date" as const, required: true },
    { name: "hours", label: "Hrs.", type: "number" as const, required: true },
    { name: "nptType", label: "NPT Type", type: "select" as const, options: ["Contractual", "Abraj"], required: true },
    { name: "system", label: "SYSTEM", type: "text" as const, required: true },
    { name: "parentEquipmentFailure", label: "Parent Equipment Failure", type: "text" as const },
    { name: "partEquipmentFailure", label: "Part Equipment Failure", type: "text" as const },
    { name: "contractualProcess", label: "Contractual Process", type: "text" as const },
    { name: "departmentResponsibility", label: "Department Responsibility", type: "text" as const },
    { name: "immediateCause", label: "Immediate Cause of Failure", type: "text" as const },
    { name: "rootCause", label: "Root Cause", type: "text" as const },
    { name: "correctiveAction", label: "Immediate Corrective Action", type: "text" as const },
    { name: "futureAction", label: "Future Action & Improvement", type: "text" as const },
    { name: "actionParty", label: "Action Party", type: "text" as const },
    { name: "notificationNo", label: "Notification Number (N2)", type: "text" as const },
    { name: "failureInvestigationReports", label: "Failure Investigation Reports", type: "text" as const },
  ];

  const tableColumns = [
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
  ];

  const sampleData = [
    { rig: "ADC-225", date: "2024-01-15", system: "Draw Works", equipmentFailure: "Main Brake", rootCause: "Bearing Failure", hours: "12.5" },
    { rig: "ADC-226", date: "2024-01-18", system: "Top Drive", equipmentFailure: "Motor Assembly", rootCause: "Overheating", hours: "8.0" },
    { rig: "ADC-227", date: "2024-01-22", system: "Mud Pumps", equipmentFailure: "Liner Failure", rootCause: "Wear & Tear", hours: "16.5" },
  ];

  const trendData = [
    { month: "Oct", drawWorks: 42, topDrive: 35, mudPumps: 48, bop: 22, power: 28, hydraulics: 16 },
    { month: "Nov", drawWorks: 45, topDrive: 38, mudPumps: 52, bop: 25, power: 30, hydraulics: 18 },
    { month: "Dec", drawWorks: 38, topDrive: 42, mudPumps: 45, bop: 20, power: 28, hydraulics: 22 },
    { month: "Jan", drawWorks: 48, topDrive: 40, mudPumps: 55, bop: 28, power: 32, hydraulics: 20 },
    { month: "Feb", drawWorks: 52, topDrive: 35, mudPumps: 58, bop: 30, power: 35, hydraulics: 25 },
    { month: "Mar", drawWorks: 45, topDrive: 38, mudPumps: 50, bop: 24, power: 30, hydraulics: 19 },
  ];

  return (
    <DataEntryLayout
      title="Billing NPT"
      description="Non-productive time tracking and billing analysis"
      breadcrumbs={[
        { label: "Dashboard", href: "/" },
        { label: "Rig Financials", href: "/rig-financials" },
        { label: "Billing NPT" }
      ]}
      viewContent={
        <div className="space-y-6">
          <BillingNPTFilters data={rawData} onFilterChange={setFilters} />
          
          <Tabs defaultValue="analytics" className="space-y-6">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="data">Data Table</TabsTrigger>
            </TabsList>

            <TabsContent value="analytics" className="space-y-6">
              {isLoading ? (
                <div className="text-center py-12 text-muted-foreground">Loading analytics...</div>
              ) : (
                <BillingNPTAnalytics data={filteredData} />
              )}
            </TabsContent>

            <TabsContent value="data" className="space-y-6">
              <DataTableWithDB 
                columns={tableColumns} 
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
            </TabsContent>
          </Tabs>
        </div>
      }
      entryContent={
        <DataEntryForm
          title="Enter NPT Data"
          fields={formFields}
          frequency="daily"
          reportType="billing_npt"
        />
      }
      uploadContent={
        <ExcelUploadZone
          title="Upload NPT Report"
          templateName="npt_template.xlsx"
          reportType="billing_npt"
        />
      }
    />
  );
};

export default BillingNPT;

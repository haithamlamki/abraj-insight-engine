import { useState } from "react";
import { DashboardLayout } from "@/components/Layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Database, Search, Edit3, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { BulkEditDialog } from "@/components/Admin/BulkEditDialog";
import { useBulkEdit } from "@/hooks/useBulkEdit";
import type { BulkEditFilter } from "@/hooks/useBulkEdit";
import { DataQualityHeatmap } from "@/components/Admin/DataQualityHeatmap";
import { DataQualityTrendChart } from "@/components/Admin/DataQualityTrendChart";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const TABLES = [
  { value: 'revenue', label: 'Revenue' },
  { value: 'utilization', label: 'Utilization' },
  { value: 'billing_npt', label: 'Billing NPT' },
  { value: 'billing_npt_summary', label: 'Billing NPT Summary' },
  { value: 'npt_root_cause', label: 'NPT Root Cause' },
  { value: 'work_orders', label: 'Work Orders' },
  { value: 'fuel_consumption', label: 'Fuel Consumption' },
  { value: 'rig_moves', label: 'Rig Moves' },
  { value: 'well_tracker', label: 'Well Tracker' },
  { value: 'stock_levels', label: 'Stock Levels' },
  { value: 'customer_satisfaction', label: 'Customer Satisfaction' },
];

const YEARS = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i);

const MONTHS = [
  { value: '1', label: 'January' },
  { value: '2', label: 'February' },
  { value: '3', label: 'March' },
  { value: '4', label: 'April' },
  { value: '5', label: 'May' },
  { value: '6', label: 'June' },
  { value: '7', label: 'July' },
  { value: '8', label: 'August' },
  { value: '9', label: 'September' },
  { value: '10', label: 'October' },
  { value: '11', label: 'November' },
  { value: '12', label: 'December' },
];

export default function BulkDataEditor() {
  const [table, setTable] = useState<string>("");
  const [selectedRigs, setSelectedRigs] = useState<string[]>([]);
  const [year, setYear] = useState<string>("");
  const [month, setMonth] = useState<string>("");
  const [previewData, setPreviewData] = useState<any>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);

  const { preview, execute, isPreviewLoading, isExecuting } = useBulkEdit();

  // Fetch available rigs
  const { data: rigs } = useQuery({
    queryKey: ['dim_rig'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dim_rig')
        .select('rig_code, rig_name')
        .eq('active', true)
        .order('rig_name');

      if (error) throw error;
      return data;
    },
  });

  const handlePreview = async () => {
    if (!table) {
      toast.error("Please select a table");
      return;
    }

    const filter: BulkEditFilter = {
      table,
      rigFilter: selectedRigs.length > 0 ? selectedRigs : undefined,
      yearFilter: year ? parseInt(year) : undefined,
      monthFilter: month || undefined,
    };

    try {
      const result = await preview({ filter });
      setPreviewData(result);
      toast.success(`Found ${result.totalRecords} records matching filters`);
    } catch (error: any) {
      toast.error(`Preview failed: ${error.message}`);
    }
  };

  const handleExecute = async (operation: any) => {
    const filter: BulkEditFilter = {
      table,
      rigFilter: selectedRigs.length > 0 ? selectedRigs : undefined,
      yearFilter: year ? parseInt(year) : undefined,
      monthFilter: month || undefined,
    };

    try {
      await execute({ filter, operation });
      setShowEditDialog(false);
      setPreviewData(null);
      // Refresh preview
      handlePreview();
    } catch (error: any) {
      // Error is handled in the hook
    }
  };

  const toggleRig = (rigCode: string) => {
    setSelectedRigs((prev) =>
      prev.includes(rigCode)
        ? prev.filter((r) => r !== rigCode)
        : [...prev, rigCode]
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Database className="h-8 w-8" />
            Bulk Data Editor
          </h1>
          <p className="text-muted-foreground">
            Update multiple records at once to fix common data issues
          </p>
        </div>

        {table && year && (
          <DataQualityHeatmap tableName={table} year={parseInt(year)} />
        )}

        {table && (
          <DataQualityTrendChart tableName={table} />
        )}

        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Important</AlertTitle>
          <AlertDescription>
            Bulk edits are permanent and cannot be undone. All changes are logged in the audit trail.
            Please review the preview carefully before executing any bulk operation.
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle>Filter Records</CardTitle>
            <CardDescription>
              Select the table and apply filters to find records you want to update
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Table Selection */}
            <div className="grid gap-2">
              <Label htmlFor="table">Table</Label>
              <Select value={table} onValueChange={setTable}>
                <SelectTrigger>
                  <SelectValue placeholder="Select table" />
                </SelectTrigger>
                <SelectContent>
                  {TABLES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Rig Selection */}
            <div className="grid gap-2">
              <Label>Rigs (Optional)</Label>
              <div className="flex flex-wrap gap-2">
                {rigs?.map((rig) => (
                  <Badge
                    key={rig.rig_code}
                    variant={selectedRigs.includes(rig.rig_code) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => toggleRig(rig.rig_code)}
                  >
                    {rig.rig_name}
                  </Badge>
                ))}
              </div>
              {selectedRigs.length > 0 && (
                <p className="text-sm text-muted-foreground">
                  Selected: {selectedRigs.join(", ")}
                </p>
              )}
            </div>

            {/* Year and Month Filters */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="year">Year (Optional)</Label>
                <Select value={year} onValueChange={setYear}>
                  <SelectTrigger>
                    <SelectValue placeholder="Any year" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Any year</SelectItem>
                    {YEARS.map((y) => (
                      <SelectItem key={y} value={y.toString()}>
                        {y}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="month">Month (Optional)</Label>
                <Select value={month} onValueChange={setMonth}>
                  <SelectTrigger>
                    <SelectValue placeholder="Any month" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Any month</SelectItem>
                    {MONTHS.map((m) => (
                      <SelectItem key={m.value} value={m.value}>
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Preview Button */}
            <Button
              onClick={handlePreview}
              disabled={!table || isPreviewLoading}
              className="w-full"
            >
              <Search className="mr-2 h-4 w-4" />
              {isPreviewLoading ? "Loading..." : "Preview Records"}
            </Button>
          </CardContent>
        </Card>

        {/* Preview Results */}
        {previewData && (
          <Card>
            <CardHeader>
              <CardTitle>Preview Results</CardTitle>
              <CardDescription>
                Found {previewData.totalRecords} records matching your filters
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {previewData.totalRecords > 0 ? (
                <>
                  <div className="text-sm text-muted-foreground">
                    Showing first {Math.min(previewData.affectedRecords.length, 100)} of{" "}
                    {previewData.totalRecords} records
                  </div>
                  <Button onClick={() => setShowEditDialog(true)}>
                    <Edit3 className="mr-2 h-4 w-4" />
                    Configure Bulk Edit
                  </Button>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No records found matching the selected filters. Try adjusting your criteria.
                </p>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Bulk Edit Dialog */}
      <BulkEditDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        previewData={previewData}
        onExecute={handleExecute}
        isExecuting={isExecuting}
        tableName={TABLES.find((t) => t.value === table)?.label || table}
      />
    </DashboardLayout>
  );
}

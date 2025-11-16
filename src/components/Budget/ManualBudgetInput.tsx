import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface ManualBudgetInputProps {
  versionId: string;
  year: number;
  onComplete?: () => void;
}

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export function ManualBudgetInput({ versionId, year, onComplete }: ManualBudgetInputProps) {
  const [selectedReportId, setSelectedReportId] = useState<string>("");
  const [editedValues, setEditedValues] = useState<Record<string, number>>({});
  const queryClient = useQueryClient();

  const { data: reports, isLoading: reportsLoading } = useQuery({
    queryKey: ["dim_report"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("dim_report")
        .select("*")
        .eq("active", true)
        .order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: ["dim_metric", selectedReportId],
    queryFn: async () => {
      if (!selectedReportId) return [];
      const { data, error } = await supabase
        .from("dim_metric")
        .select("*")
        .eq("report_id", selectedReportId)
        .eq("active", true);
      if (error) throw error;
      return data;
    },
    enabled: !!selectedReportId,
  });

  const { data: rigs, isLoading: rigsLoading } = useQuery({
    queryKey: ["dim_rig"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("dim_rig")
        .select("*")
        .eq("active", true)
        .order("rig_code");
      if (error) throw error;
      return data;
    },
  });

  const { data: existingBudgets } = useQuery({
    queryKey: ["fact_budget", versionId, selectedReportId, year],
    queryFn: async () => {
      if (!selectedReportId) return [];
      const { data, error } = await supabase
        .from("fact_budget")
        .select("*")
        .eq("version_id", versionId)
        .eq("report_id", selectedReportId)
        .eq("year", year);
      if (error) throw error;
      return data;
    },
    enabled: !!selectedReportId && !!versionId,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const budgetRecords = Object.entries(editedValues).map(([key, value]) => {
        const [rigId, metricId, monthStr] = key.split("_");
        const month = parseInt(monthStr);
        
        const existing = existingBudgets?.find(
          b => b.rig_id === rigId && b.metric_id === metricId && b.month === month
        );

        return {
          id: existing?.id,
          version_id: versionId,
          report_id: selectedReportId,
          rig_id: rigId,
          metric_id: metricId,
          year,
          month,
          budget_value: value,
          created_by: user.id,
          updated_by: user.id,
        };
      });

      const { error } = await supabase
        .from("fact_budget")
        .upsert(budgetRecords, { onConflict: "id" });

      if (error) throw error;
      return budgetRecords.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ["fact_budget"] });
      setEditedValues({});
      toast.success(`Saved ${count} budget values`);
      onComplete?.();
    },
    onError: (error) => {
      toast.error(`Failed to save: ${error.message}`);
    },
  });

  const handleValueChange = (rigId: string, metricId: string, month: number, value: string) => {
    const key = `${rigId}_${metricId}_${month}`;
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      setEditedValues(prev => ({ ...prev, [key]: numValue }));
    } else {
      setEditedValues(prev => {
        const newValues = { ...prev };
        delete newValues[key];
        return newValues;
      });
    }
  };

  const getBudgetValue = (rigId: string, metricId: string, month: number): number => {
    const key = `${rigId}_${metricId}_${month}`;
    if (editedValues[key] !== undefined) return editedValues[key];
    
    const existing = existingBudgets?.find(
      b => b.rig_id === rigId && b.metric_id === metricId && b.month === month
    );
    return existing?.budget_value ?? 0;
  };

  if (reportsLoading || rigsLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Select Report Type</Label>
        <Select value={selectedReportId} onValueChange={setSelectedReportId}>
          <SelectTrigger>
            <SelectValue placeholder="Choose a report..." />
          </SelectTrigger>
          <SelectContent>
            {reports?.map((report) => (
              <SelectItem key={report.id} value={report.id}>
                {report.display_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedReportId && !metricsLoading && metrics && metrics.length > 0 && (
        <div className="space-y-6">
          {metrics.map((metric) => (
            <div key={metric.id} className="space-y-2">
              <h3 className="font-semibold text-lg">{metric.display_name}</h3>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-muted">
                      <th className="border border-border p-2 text-left sticky left-0 bg-muted z-10">Rig</th>
                      {MONTHS.map((month, idx) => (
                        <th key={month} className="border border-border p-2 text-center min-w-[100px]">
                          {month}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rigs?.map((rig) => (
                      <tr key={rig.id}>
                        <td className="border border-border p-2 font-medium sticky left-0 bg-background z-10">
                          {rig.rig_name}
                        </td>
                        {MONTHS.map((_, monthIndex) => {
                          const month = monthIndex + 1;
                          const value = getBudgetValue(rig.id, metric.id, month);
                          return (
                            <td key={month} className="border border-border p-1">
                              <Input
                                type="number"
                                step="0.01"
                                value={value || ""}
                                onChange={(e) => handleValueChange(rig.id, metric.id, month, e.target.value)}
                                className="w-full text-center"
                              />
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}

          <div className="flex justify-end gap-2">
            <Button
              onClick={() => saveMutation.mutate()}
              disabled={Object.keys(editedValues).length === 0 || saveMutation.isPending}
            >
              {saveMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes ({Object.keys(editedValues).length})
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface BudgetEditorProps {
  versionId: string;
  reportKey: string;
  year: number;
}

export const BudgetEditor = ({ versionId, reportKey, year }: BudgetEditorProps) => {
  const queryClient = useQueryClient();
  const [editedValues, setEditedValues] = useState<Record<string, number>>({});

  // Fetch budget data
  const { data: budgetData, isLoading } = useQuery({
    queryKey: ['budget-editor', versionId, reportKey, year],
    queryFn: async () => {
      const { data: report } = await supabase
        .from('dim_report')
        .select('id')
        .eq('report_key', reportKey)
        .single();

      if (!report) throw new Error('Report not found');

      const { data: rigs } = await supabase
        .from('dim_rig')
        .select('*')
        .eq('active', true)
        .order('rig_code');

      const { data: metrics } = await supabase
        .from('dim_metric')
        .select('*')
        .eq('report_id', report.id)
        .eq('active', true);

      const { data: budgets } = await supabase
        .from('fact_budget')
        .select('*')
        .eq('version_id', versionId)
        .eq('report_id', report.id)
        .eq('year', year);

      return { rigs: rigs || [], metrics: metrics || [], budgets: budgets || [] };
    },
  });

  // Save budget mutation
  const saveMutation = useMutation({
    mutationFn: async (updates: Array<{ id?: string; rig_id: string; metric_id: string; month: number; value: number }>) => {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) throw new Error('Not authenticated');

      const { data: report } = await supabase
        .from('dim_report')
        .select('id')
        .eq('report_key', reportKey)
        .single();

      const upserts = updates.map(u => ({
        id: u.id,
        version_id: versionId,
        report_id: report!.id,
        rig_id: u.rig_id,
        metric_id: u.metric_id,
        year,
        month: u.month,
        budget_value: u.value,
        updated_by: user.id,
      }));

      const { error } = await supabase
        .from('fact_budget')
        .upsert(upserts);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budget-editor'] });
      setEditedValues({});
      toast.success("Budget saved successfully");
    },
    onError: (error: any) => {
      toast.error(`Failed to save: ${error.message}`);
    },
  });

  const handleValueChange = (key: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    setEditedValues(prev => ({ ...prev, [key]: numValue }));
  };

  const getBudgetValue = (rigId: string, metricId: string, month: number) => {
    const key = `${rigId}-${metricId}-${month}`;
    if (editedValues[key] !== undefined) return editedValues[key];

    const existing = budgetData?.budgets.find(
      b => b.rig_id === rigId && b.metric_id === metricId && b.month === month
    );
    return existing?.budget_value || 0;
  };

  const handleSave = () => {
    const updates = Object.entries(editedValues).map(([key, value]) => {
      const [rigId, metricId, month] = key.split('-');
      const existing = budgetData?.budgets.find(
        b => b.rig_id === rigId && b.metric_id === metricId && b.month === parseInt(month)
      );

      return {
        id: existing?.id,
        rig_id: rigId,
        metric_id: metricId,
        month: parseInt(month),
        value,
      };
    });

    saveMutation.mutate(updates);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Budget Editor - {year}</h3>
          <Button 
            onClick={handleSave} 
            disabled={Object.keys(editedValues).length === 0 || saveMutation.isPending}
          >
            {saveMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Changes
          </Button>
        </div>

        <div className="overflow-x-auto">
          {budgetData?.metrics.map(metric => (
            <div key={metric.id} className="mb-8">
              <h4 className="font-medium mb-3">{metric.display_name}</h4>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-32">Rig</TableHead>
                    {months.map(m => (
                      <TableHead key={m} className="text-center">
                        {new Date(2000, m - 1).toLocaleString('default', { month: 'short' })}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {budgetData?.rigs.map(rig => (
                    <TableRow key={rig.id}>
                      <TableCell className="font-medium">{rig.rig_code}</TableCell>
                      {months.map(month => {
                        const key = `${rig.id}-${metric.id}-${month}`;
                        const value = getBudgetValue(rig.id, metric.id, month);
                        return (
                          <TableCell key={month}>
                            <Input
                              type="number"
                              value={value}
                              onChange={(e) => handleValueChange(key, e.target.value)}
                              className="w-24 text-center"
                              step="0.01"
                            />
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
};

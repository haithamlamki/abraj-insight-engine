import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface BudgetAlert {
  id?: string;
  report_type: string;
  metric_key?: string;
  threshold_percentage: number;
  alert_type: "email" | "in_app" | "both";
  is_active: boolean;
}

export function useBudgetAlerts() {
  const queryClient = useQueryClient();

  const { data: alerts = [], isLoading } = useQuery({
    queryKey: ["budget-alerts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("budget_alerts")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const createAlertMutation = useMutation({
    mutationFn: async (alert: BudgetAlert) => {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("budget_alerts")
        .insert({
          user_id: user.id,
          ...alert,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budget-alerts"] });
      toast.success("Budget alert created");
    },
    onError: (error: any) => {
      toast.error(`Failed to create alert: ${error.message}`);
    },
  });

  const updateAlertMutation = useMutation({
    mutationFn: async ({ id, ...alert }: BudgetAlert & { id: string }) => {
      const { error } = await supabase
        .from("budget_alerts")
        .update(alert)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budget-alerts"] });
      toast.success("Budget alert updated");
    },
    onError: (error: any) => {
      toast.error(`Failed to update alert: ${error.message}`);
    },
  });

  const deleteAlertMutation = useMutation({
    mutationFn: async (alertId: string) => {
      const { error } = await supabase
        .from("budget_alerts")
        .delete()
        .eq("id", alertId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budget-alerts"] });
      toast.success("Budget alert deleted");
    },
    onError: (error: any) => {
      toast.error(`Failed to delete alert: ${error.message}`);
    },
  });

  const triggerAlertCheckMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.functions.invoke("budget-variance-alerts");
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      toast.success("Budget variance check triggered");
    },
    onError: (error: any) => {
      toast.error(`Failed to check variances: ${error.message}`);
    },
  });

  return {
    alerts,
    isLoading,
    createAlert: createAlertMutation.mutate,
    updateAlert: updateAlertMutation.mutate,
    deleteAlert: deleteAlertMutation.mutate,
    triggerCheck: triggerAlertCheckMutation.mutate,
    isTriggering: triggerAlertCheckMutation.isPending,
  };
}

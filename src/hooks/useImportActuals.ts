import { useMutation, useQueryClient } from "@tanstack/react-query";
import { importActualsAs2025Budget } from "@/lib/importActualsAs2025Budget";
import { toast } from "sonner";

export function useImportActuals() {
  const queryClient = useQueryClient();
  
  const mutation = useMutation({
    mutationFn: async (versionId: string) => {
      return await importActualsAs2025Budget(versionId);
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ['budget-versions'] });
      queryClient.invalidateQueries({ queryKey: ['budget-editor'] });
      queryClient.invalidateQueries({ queryKey: ['fact_budget'] });
      toast.success(`Successfully imported ${count} budget records from 2024 actuals`);
    },
    onError: (error: any) => {
      toast.error(`Failed to import actuals: ${error.message}`);
    },
  });

  return {
    importActuals: mutation.mutate,
    isImporting: mutation.isPending,
  };
}

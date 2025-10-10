import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchData, insertData, bulkInsertData, getTableName, getSaveFunction } from "@/lib/supabaseQueries";
import { toast } from "sonner";

/**
 * Hook to fetch report data from database
 */
export function useReportData(reportType: string) {
  const tableName = getTableName(reportType);
  
  return useQuery({
    queryKey: [reportType, tableName],
    queryFn: () => fetchData(tableName),
  });
}

/**
 * Hook to save single report entry
 */
export function useSaveReportData(reportType: string) {
  const queryClient = useQueryClient();
  const tableName = getTableName(reportType);
  const saveFunction = getSaveFunction(reportType);
  
  return useMutation({
    mutationFn: async (data: any) => {
      if (saveFunction) {
        return saveFunction(data);
      }
      return insertData(tableName, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [reportType, tableName] });
      toast.success("Data saved successfully");
    },
    onError: (error: any) => {
      toast.error(`Failed to save data: ${error.message}`);
      console.error('Save error:', error);
    },
  });
}

/**
 * Hook to bulk save report data (from Excel)
 */
export function useBulkSaveReportData(reportType: string) {
  const queryClient = useQueryClient();
  const tableName = getTableName(reportType);
  
  return useMutation({
    mutationFn: async (dataArray: any[]) => {
      return bulkInsertData(tableName, dataArray);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [reportType, tableName] });
      toast.success(`Successfully imported ${data?.length || 0} records`);
    },
    onError: (error: any) => {
      toast.error(`Failed to import data: ${error.message}`);
      console.error('Bulk save error:', error);
    },
  });
}

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ImportStatistic {
  period: string;
  total_imports: number;
  successful_imports: number;
  failed_imports: number;
  total_rows_processed: number;
  total_rows_valid: number;
  total_rows_skipped: number;
  avg_success_rate: number;
}

export interface CommonError {
  error_message: string;
  error_count: number;
  report_types: string[];
}

export interface ImportLog {
  id: string;
  user_email: string;
  report_type: string;
  import_method: 'excel' | 'paste';
  total_rows: number;
  valid_rows: number;
  error_rows: number;
  warning_rows: number;
  skipped_rows: number;
  success: boolean;
  file_name: string | null;
  created_at: string;
}

/**
 * Fetch import statistics over time
 */
export function useImportStatistics(daysBack: number = 30, groupBy: 'day' | 'hour' = 'day') {
  return useQuery({
    queryKey: ['import-statistics', daysBack, groupBy],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_import_statistics', {
        days_back: daysBack,
        group_by: groupBy,
      });

      if (error) throw error;
      return data as ImportStatistic[];
    },
  });
}

/**
 * Fetch most common validation errors
 */
export function useCommonValidationErrors(daysBack: number = 30, limitCount: number = 10) {
  return useQuery({
    queryKey: ['common-validation-errors', daysBack, limitCount],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_common_validation_errors', {
        days_back: daysBack,
        limit_count: limitCount,
      });

      if (error) throw error;
      return data as CommonError[];
    },
  });
}

/**
 * Fetch recent import logs
 */
export function useRecentImportLogs(limit: number = 50) {
  return useQuery({
    queryKey: ['recent-import-logs', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('import_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data as ImportLog[];
    },
  });
}

/**
 * Fetch overall KPI statistics
 */
export function useDataQualityKPIs(daysBack: number = 30) {
  return useQuery({
    queryKey: ['data-quality-kpis', daysBack],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('import_logs')
        .select('*')
        .gte('created_at', new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).toISOString());

      if (error) throw error;

      const logs = data as ImportLog[];
      const totalImports = logs.length;
      const successfulImports = logs.filter(l => l.success).length;
      const totalRows = logs.reduce((sum, l) => sum + l.total_rows, 0);
      const totalValid = logs.reduce((sum, l) => sum + l.valid_rows, 0);
      const totalSkipped = logs.reduce((sum, l) => sum + l.skipped_rows, 0);
      const totalErrors = logs.reduce((sum, l) => sum + l.error_rows, 0);

      return {
        totalImports,
        successfulImports,
        failedImports: totalImports - successfulImports,
        successRate: totalImports > 0 ? (successfulImports / totalImports) * 100 : 0,
        totalRowsProcessed: totalRows,
        totalRowsValid: totalValid,
        totalRowsSkipped: totalSkipped,
        totalRowsWithErrors: totalErrors,
        avgRowsPerImport: totalImports > 0 ? totalRows / totalImports : 0,
        dataQualityScore: totalRows > 0 ? (totalValid / totalRows) * 100 : 0,
      };
    },
  });
}

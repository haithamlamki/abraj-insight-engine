import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface BulkEditFilter {
  table: string;
  rigFilter?: string[];
  yearFilter?: number;
  monthFilter?: string;
  dateRangeFilter?: { start: string; end: string };
}

export interface BulkEditOperation {
  field: string;
  operation: 'replace' | 'find-replace' | 'add' | 'subtract' | 'convert-to-string';
  newValue?: any;
  findValue?: string;
  replaceValue?: string;
  numericValue?: number;
}

export interface BulkEditPreview {
  totalRecords: number;
  affectedRecords: any[];
  fieldType: string;
}

/**
 * Hook for bulk editing operations
 */
export const useBulkEdit = () => {
  const queryClient = useQueryClient();

  // Preview affected records
  const previewMutation = useMutation({
    mutationFn: async ({ filter }: { filter: BulkEditFilter }) => {
      const { data, error } = await supabase
        .rpc('get_filtered_records' as any, {
          p_table: filter.table,
          p_rig_filter: filter.rigFilter || null,
          p_year_filter: filter.yearFilter || null,
          p_month_filter: filter.monthFilter || null,
        } as any)
        .limit(100);

      if (error) {
        // Fallback to direct query if RPC fails
        const tableName = filter.table as any;
        let query: any = supabase.from(tableName).select('*');
        
        if (filter.rigFilter && filter.rigFilter.length > 0) {
          const rigField = filter.table === 'npt_root_cause' ? 'rig_number' : 'rig';
          query = query.in(rigField, filter.rigFilter);
        }
        if (filter.yearFilter) query = query.eq('year', filter.yearFilter);
        if (filter.monthFilter) query = query.eq('month', filter.monthFilter);
        
        const result = await query.limit(100);
        if (result.error) throw result.error;
        
        return {
          totalRecords: result.data?.length || 0,
          affectedRecords: result.data || [],
        };
      }

      return {
        totalRecords: data?.length || 0,
        affectedRecords: data || [],
      };
    },
  });

  // Execute bulk update
  const executeMutation = useMutation({
    mutationFn: async ({
      filter,
      operation,
    }: {
      filter: BulkEditFilter;
      operation: BulkEditOperation;
    }) => {
      // First, fetch all records that match the filter using direct query
      const tableName = filter.table as any;
      let query: any = supabase.from(tableName).select('*');
      
      if (filter.rigFilter && filter.rigFilter.length > 0) {
        const rigField = filter.table === 'npt_root_cause' ? 'rig_number' : 'rig';
        query = query.in(rigField, filter.rigFilter);
      }
      if (filter.yearFilter) query = query.eq('year', filter.yearFilter);
      if (filter.monthFilter) query = query.eq('month', filter.monthFilter);
      if (filter.dateRangeFilter) {
        query = query.gte('date', filter.dateRangeFilter.start).lte('date', filter.dateRangeFilter.end);
      }

      const { data: records, error: fetchError } = await query;

      if (fetchError) throw fetchError;
      if (!records || records.length === 0) {
        throw new Error('No records found matching the filter criteria');
      }

      // Apply the operation to each record
      const updatedRecords = (records as any[]).map((record: any) => {
        const newValue = (() => {
          let val = record[operation.field];

          switch (operation.operation) {
            case 'replace':
              return operation.newValue;

            case 'find-replace':
              if (typeof val === 'string' && operation.findValue && operation.replaceValue) {
                return val.replace(
                  new RegExp(operation.findValue, 'g'),
                  operation.replaceValue
                );
              }
              return val;

            case 'add':
              if (typeof val === 'number' && operation.numericValue) {
                return val + operation.numericValue;
              }
              return val;

            case 'subtract':
              if (typeof val === 'number' && operation.numericValue) {
                return val - operation.numericValue;
              }
              return val;

            case 'convert-to-string':
              return String(val);

            default:
              return val;
          }
        })();

        return {
          ...record,
          [operation.field]: newValue,
        } as any;
      });

      // Update all records in the database
      const { error: updateError } = await supabase
        .from(tableName)
        .upsert(updatedRecords);

      if (updateError) throw updateError;

      return {
        recordsUpdated: updatedRecords.length,
        updatedRecords,
      };
    },
    onSuccess: (data, variables) => {
      toast.success(`Successfully updated ${data.recordsUpdated} records`);
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: [variables.filter.table] });
      queryClient.invalidateQueries({ queryKey: ['audit-logs'] });
    },
    onError: (error: Error) => {
      toast.error(`Bulk update failed: ${error.message}`);
    },
  });

  return {
    preview: previewMutation.mutateAsync,
    execute: executeMutation.mutateAsync,
    isPreviewLoading: previewMutation.isPending,
    isExecuting: executeMutation.isPending,
  };
};


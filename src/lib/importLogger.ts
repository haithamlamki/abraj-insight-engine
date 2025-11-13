import { supabase } from "@/integrations/supabase/client";

export interface ImportLogData {
  reportType: string;
  importMethod: 'excel' | 'paste';
  totalRows: number;
  validRows: number;
  errorRows: number;
  warningRows: number;
  skippedRows: number;
  validationErrors: Array<{
    row?: number;
    column?: string;
    message: string;
    severity?: 'error' | 'warning' | 'info';
  }>;
  fileName?: string;
  success: boolean;
  durationMs?: number;
}

/**
 * Log import statistics to database for quality tracking
 */
export async function logImportStatistics(data: ImportLogData): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.warn('[importLogger] No user found, skipping log');
      return;
    }

    // Aggregate validation errors by message for analytics
    const errorSummary = data.validationErrors.map(err => ({
      message: err.message,
      severity: err.severity || 'error',
      column: err.column,
    }));

    const { error } = await supabase
      .from('import_logs')
      .insert({
        user_id: user.id,
        user_email: user.email,
        report_type: data.reportType,
        import_method: data.importMethod,
        total_rows: data.totalRows,
        valid_rows: data.validRows,
        error_rows: data.errorRows,
        warning_rows: data.warningRows,
        skipped_rows: data.skippedRows,
        validation_errors: errorSummary,
        file_name: data.fileName,
        success: data.success,
        duration_ms: data.durationMs,
      });

    if (error) {
      console.error('[importLogger] Failed to log import statistics:', error);
    } else {
      console.log('[importLogger] Successfully logged import statistics');
    }
  } catch (error) {
    console.error('[importLogger] Error logging import statistics:', error);
  }
}

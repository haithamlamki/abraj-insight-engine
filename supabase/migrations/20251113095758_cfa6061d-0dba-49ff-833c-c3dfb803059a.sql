-- Fix security warnings by setting search_path on functions

-- Drop and recreate get_common_validation_errors with proper search_path
DROP FUNCTION IF EXISTS public.get_common_validation_errors(INTEGER, INTEGER);

CREATE OR REPLACE FUNCTION public.get_common_validation_errors(
  days_back INTEGER DEFAULT 30,
  limit_count INTEGER DEFAULT 10
)
RETURNS TABLE (
  error_message TEXT,
  error_count BIGINT,
  report_types TEXT[]
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    error->>'message' as error_message,
    COUNT(*) as error_count,
    ARRAY_AGG(DISTINCT import_logs.report_type) as report_types
  FROM public.import_logs,
    jsonb_array_elements(validation_errors) as error
  WHERE created_at >= NOW() - (days_back || ' days')::INTERVAL
  GROUP BY error->>'message'
  ORDER BY error_count DESC
  LIMIT limit_count;
END;
$$;

-- Drop and recreate get_import_statistics with proper search_path
DROP FUNCTION IF EXISTS public.get_import_statistics(INTEGER, TEXT);

CREATE OR REPLACE FUNCTION public.get_import_statistics(
  days_back INTEGER DEFAULT 30,
  group_by TEXT DEFAULT 'day'
)
RETURNS TABLE (
  period TEXT,
  total_imports BIGINT,
  successful_imports BIGINT,
  failed_imports BIGINT,
  total_rows_processed BIGINT,
  total_rows_valid BIGINT,
  total_rows_skipped BIGINT,
  avg_success_rate NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF group_by = 'hour' THEN
    RETURN QUERY
    SELECT 
      TO_CHAR(date_trunc('hour', created_at), 'YYYY-MM-DD HH24:00') as period,
      COUNT(*) as total_imports,
      COUNT(*) FILTER (WHERE success = true) as successful_imports,
      COUNT(*) FILTER (WHERE success = false) as failed_imports,
      SUM(total_rows) as total_rows_processed,
      SUM(valid_rows) as total_rows_valid,
      SUM(skipped_rows) as total_rows_skipped,
      ROUND(AVG(CASE WHEN total_rows > 0 THEN (valid_rows::NUMERIC / total_rows::NUMERIC) * 100 ELSE 0 END), 2) as avg_success_rate
    FROM public.import_logs
    WHERE created_at >= NOW() - (days_back || ' days')::INTERVAL
    GROUP BY date_trunc('hour', created_at)
    ORDER BY date_trunc('hour', created_at) DESC;
  ELSE
    RETURN QUERY
    SELECT 
      TO_CHAR(date_trunc('day', created_at), 'YYYY-MM-DD') as period,
      COUNT(*) as total_imports,
      COUNT(*) FILTER (WHERE success = true) as successful_imports,
      COUNT(*) FILTER (WHERE success = false) as failed_imports,
      SUM(total_rows) as total_rows_processed,
      SUM(valid_rows) as total_rows_valid,
      SUM(skipped_rows) as total_rows_skipped,
      ROUND(AVG(CASE WHEN total_rows > 0 THEN (valid_rows::NUMERIC / total_rows::NUMERIC) * 100 ELSE 0 END), 2) as avg_success_rate
    FROM public.import_logs
    WHERE created_at >= NOW() - (days_back || ' days')::INTERVAL
    GROUP BY date_trunc('day', created_at)
    ORDER BY date_trunc('day', created_at) DESC;
  END IF;
END;
$$;
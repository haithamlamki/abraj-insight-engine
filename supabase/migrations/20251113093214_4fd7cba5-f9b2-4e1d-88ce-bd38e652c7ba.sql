-- Create import_logs table to track all data imports
CREATE TABLE IF NOT EXISTS public.import_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  user_email TEXT,
  report_type TEXT NOT NULL,
  import_method TEXT NOT NULL CHECK (import_method IN ('excel', 'paste')),
  total_rows INTEGER NOT NULL DEFAULT 0,
  valid_rows INTEGER NOT NULL DEFAULT 0,
  error_rows INTEGER NOT NULL DEFAULT 0,
  warning_rows INTEGER NOT NULL DEFAULT 0,
  skipped_rows INTEGER NOT NULL DEFAULT 0,
  validation_errors JSONB DEFAULT '[]'::jsonb,
  file_name TEXT,
  success BOOLEAN NOT NULL DEFAULT false,
  duration_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes for efficient querying
CREATE INDEX idx_import_logs_user_id ON public.import_logs(user_id);
CREATE INDEX idx_import_logs_report_type ON public.import_logs(report_type);
CREATE INDEX idx_import_logs_created_at ON public.import_logs(created_at DESC);
CREATE INDEX idx_import_logs_success ON public.import_logs(success);

-- Enable RLS
ALTER TABLE public.import_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own import logs"
  ON public.import_logs
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all import logs"
  ON public.import_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

CREATE POLICY "System can insert import logs"
  ON public.import_logs
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create a function to aggregate common validation errors
CREATE OR REPLACE FUNCTION get_common_validation_errors(
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

-- Create a function to get import statistics over time
CREATE OR REPLACE FUNCTION get_import_statistics(
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

COMMENT ON TABLE public.import_logs IS 'Tracks all data import operations for quality monitoring and auditing';
COMMENT ON FUNCTION get_common_validation_errors IS 'Returns the most common validation errors across all imports';
COMMENT ON FUNCTION get_import_statistics IS 'Returns aggregated import statistics over time for trend analysis';
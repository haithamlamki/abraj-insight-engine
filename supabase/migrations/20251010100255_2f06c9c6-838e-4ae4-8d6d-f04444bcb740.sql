-- Add new columns to utilization table to match Excel structure
ALTER TABLE public.utilization 
ADD COLUMN IF NOT EXISTS npt_type text,
ADD COLUMN IF NOT EXISTS monthly_total_days numeric,
ADD COLUMN IF NOT EXISTS comment text;
-- Add status column to utilization table
ALTER TABLE public.utilization 
ADD COLUMN status TEXT NOT NULL DEFAULT 'Active';

-- Add comment to document the column
COMMENT ON COLUMN public.utilization.status IS 'Rig operational status: Active or Stacked';
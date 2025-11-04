-- Create billing_npt_summary table for aggregated monthly NPT by rate type
CREATE TABLE public.billing_npt_summary (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  year INTEGER NOT NULL,
  month TEXT NOT NULL,
  rig TEXT NOT NULL,
  opr_rate NUMERIC DEFAULT 0,
  reduce_rate NUMERIC DEFAULT 0,
  repair_rate NUMERIC DEFAULT 0,
  zero_rate NUMERIC DEFAULT 0,
  special_rate NUMERIC DEFAULT 0,
  rig_move NUMERIC DEFAULT 0,
  a_maint NUMERIC DEFAULT 0,
  total NUMERIC DEFAULT 0,
  total_npt NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(year, month, rig)
);

-- Add comments
COMMENT ON TABLE public.billing_npt_summary IS 'Monthly aggregated NPT hours by rate type for each rig';
COMMENT ON COLUMN public.billing_npt_summary.opr_rate IS 'NPT hours at operational rate';
COMMENT ON COLUMN public.billing_npt_summary.reduce_rate IS 'NPT hours at reduced rate';
COMMENT ON COLUMN public.billing_npt_summary.repair_rate IS 'NPT hours at repair rate';
COMMENT ON COLUMN public.billing_npt_summary.zero_rate IS 'NPT hours at zero rate';
COMMENT ON COLUMN public.billing_npt_summary.special_rate IS 'NPT hours at special rate';
COMMENT ON COLUMN public.billing_npt_summary.rig_move IS 'NPT hours during rig move';
COMMENT ON COLUMN public.billing_npt_summary.a_maint IS 'Allowable maintenance hours';
COMMENT ON COLUMN public.billing_npt_summary.total IS 'Total of all rate categories';
COMMENT ON COLUMN public.billing_npt_summary.total_npt IS 'Total NPT hours';

-- Enable RLS
ALTER TABLE public.billing_npt_summary ENABLE ROW LEVEL SECURITY;

-- Create policy for all operations
CREATE POLICY "Allow all operations on billing_npt_summary" 
ON public.billing_npt_summary 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Create trigger for updated_at
CREATE TRIGGER update_billing_npt_summary_updated_at
BEFORE UPDATE ON public.billing_npt_summary
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
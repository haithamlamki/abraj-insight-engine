-- Add new columns to billing_npt_summary for more detailed rate tracking
ALTER TABLE public.billing_npt_summary
ADD COLUMN rig_move_reduce numeric DEFAULT 0,
ADD COLUMN a_maint_zero numeric DEFAULT 0;

COMMENT ON COLUMN public.billing_npt_summary.rig_move_reduce IS 'Rig Move hours at reduced rate';
COMMENT ON COLUMN public.billing_npt_summary.a_maint_zero IS 'Allowable Maintenance hours at zero rate';
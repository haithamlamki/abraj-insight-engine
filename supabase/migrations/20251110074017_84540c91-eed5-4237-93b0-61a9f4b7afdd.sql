-- Create NPT root cause tracking table
CREATE TABLE IF NOT EXISTS public.npt_root_cause (
  id BIGSERIAL PRIMARY KEY,
  rig_number TEXT NOT NULL,
  year INTEGER NOT NULL,
  month TEXT NOT NULL,
  date INTEGER NOT NULL,
  hrs NUMERIC(10,2) NOT NULL,
  npt_type TEXT NOT NULL,
  system TEXT NOT NULL,
  parent_equipment_failure TEXT,
  part_equipment_failure TEXT,
  contractual_process TEXT,
  department_responsibility TEXT,
  immediate_cause_of_failure TEXT,
  root_cause TEXT,
  immediate_corrective_action TEXT,
  future_action_improvement TEXT,
  action_party TEXT,
  notification_number TEXT,
  failure_investigation_reports TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.npt_root_cause ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY "Users can view NPT root cause data"
  ON public.npt_root_cause
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert NPT root cause data"
  ON public.npt_root_cause
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update NPT root cause data"
  ON public.npt_root_cause
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Users can delete NPT root cause data"
  ON public.npt_root_cause
  FOR DELETE
  TO authenticated
  USING (true);

-- Create index for better query performance
CREATE INDEX idx_npt_root_cause_rig_year_month ON public.npt_root_cause(rig_number, year, month);
CREATE INDEX idx_npt_root_cause_system ON public.npt_root_cause(system);
CREATE INDEX idx_npt_root_cause_root_cause ON public.npt_root_cause(root_cause);

-- Create trigger for updated_at
CREATE TRIGGER update_npt_root_cause_updated_at
  BEFORE UPDATE ON public.npt_root_cause
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

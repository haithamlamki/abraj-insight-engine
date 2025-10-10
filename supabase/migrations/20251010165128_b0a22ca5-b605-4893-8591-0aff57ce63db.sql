-- Add missing columns to billing_npt table
ALTER TABLE billing_npt 
  ADD COLUMN IF NOT EXISTS year integer,
  ADD COLUMN IF NOT EXISTS month text,
  ADD COLUMN IF NOT EXISTS npt_type text,
  ADD COLUMN IF NOT EXISTS parent_equipment_failure text,
  ADD COLUMN IF NOT EXISTS part_equipment_failure text,
  ADD COLUMN IF NOT EXISTS contractual_process text,
  ADD COLUMN IF NOT EXISTS department_responsibility text,
  ADD COLUMN IF NOT EXISTS immediate_cause text,
  ADD COLUMN IF NOT EXISTS future_action text,
  ADD COLUMN IF NOT EXISTS action_party text,
  ADD COLUMN IF NOT EXISTS failure_investigation_reports text;

-- Rename equipment_failure to match new structure (keeping both for compatibility)
-- We'll keep equipment_failure and add the more specific columns

-- Update comments column to be more clear
COMMENT ON COLUMN billing_npt.comments IS 'General comments or future action improvements';
COMMENT ON COLUMN billing_npt.corrective_action IS 'Immediate corrective action taken';
COMMENT ON COLUMN billing_npt.notification_number IS 'Notification Number (N2)';
COMMENT ON COLUMN billing_npt.equipment_failure IS 'Equipment failure description';
COMMENT ON COLUMN billing_npt.npt_type IS 'Type of NPT (e.g., Contractual, Abraj)';
COMMENT ON COLUMN billing_npt.parent_equipment_failure IS 'Parent equipment that failed';
COMMENT ON COLUMN billing_npt.part_equipment_failure IS 'Specific part that failed';
COMMENT ON COLUMN billing_npt.contractual_process IS 'Contractual process related to NPT';
COMMENT ON COLUMN billing_npt.department_responsibility IS 'Department responsible';
COMMENT ON COLUMN billing_npt.immediate_cause IS 'Immediate cause of failure';
COMMENT ON COLUMN billing_npt.future_action IS 'Future action and improvement plans';
COMMENT ON COLUMN billing_npt.action_party IS 'Party responsible for action';
COMMENT ON COLUMN billing_npt.failure_investigation_reports IS 'Failure investigation report references';
-- Create audit_logs table
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email TEXT,
  old_values JSONB,
  new_values JSONB,
  changed_fields TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  ip_address INET,
  user_agent TEXT
);

-- Create index for faster queries
CREATE INDEX idx_audit_logs_table_name ON public.audit_logs(table_name);
CREATE INDEX idx_audit_logs_record_id ON public.audit_logs(record_id);
CREATE INDEX idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_action ON public.audit_logs(action);

-- Enable RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can view all audit logs"
  ON public.audit_logs
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Analysts can view audit logs"
  ON public.audit_logs
  FOR SELECT
  USING (has_role(auth.uid(), 'analyst'));

-- Generic audit trigger function
CREATE OR REPLACE FUNCTION public.audit_trigger_func()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_email_var TEXT;
  changed_fields_array TEXT[];
  old_json JSONB;
  new_json JSONB;
BEGIN
  -- Get user email
  SELECT email INTO user_email_var FROM auth.users WHERE id = auth.uid();
  
  -- Prepare old and new values as JSONB
  IF TG_OP = 'DELETE' THEN
    old_json := to_jsonb(OLD);
    new_json := NULL;
  ELSIF TG_OP = 'INSERT' THEN
    old_json := NULL;
    new_json := to_jsonb(NEW);
  ELSE -- UPDATE
    old_json := to_jsonb(OLD);
    new_json := to_jsonb(NEW);
    
    -- Detect changed fields
    SELECT ARRAY_AGG(key)
    INTO changed_fields_array
    FROM jsonb_each(old_json) old_kv
    WHERE old_kv.value IS DISTINCT FROM (new_json -> old_kv.key);
  END IF;
  
  -- Insert audit log
  INSERT INTO public.audit_logs (
    table_name,
    record_id,
    action,
    user_id,
    user_email,
    old_values,
    new_values,
    changed_fields
  ) VALUES (
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    TG_OP,
    auth.uid(),
    user_email_var,
    old_json,
    new_json,
    changed_fields_array
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Apply audit triggers to all data tables
CREATE TRIGGER audit_revenue_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.revenue
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

CREATE TRIGGER audit_utilization_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.utilization
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

CREATE TRIGGER audit_billing_npt_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.billing_npt
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

CREATE TRIGGER audit_billing_npt_summary_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.billing_npt_summary
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

CREATE TRIGGER audit_work_orders_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.work_orders
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

CREATE TRIGGER audit_stock_levels_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.stock_levels
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

CREATE TRIGGER audit_customer_satisfaction_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.customer_satisfaction
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

CREATE TRIGGER audit_rig_moves_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.rig_moves
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

CREATE TRIGGER audit_well_tracker_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.well_tracker
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

CREATE TRIGGER audit_fuel_consumption_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.fuel_consumption
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

CREATE TRIGGER audit_npt_root_cause_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.npt_root_cause
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();
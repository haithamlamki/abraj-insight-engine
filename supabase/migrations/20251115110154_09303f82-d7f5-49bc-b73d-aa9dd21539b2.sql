-- Drop existing audit trigger function and recreate with type handling
DROP FUNCTION IF EXISTS public.audit_trigger_func() CASCADE;

CREATE OR REPLACE FUNCTION public.audit_trigger_func()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  user_email_var TEXT;
  changed_fields_array TEXT[];
  old_json JSONB;
  new_json JSONB;
  record_id_val UUID;
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
  
  -- Handle record_id conversion - convert bigint/int to UUID or use existing UUID
  BEGIN
    IF TG_OP = 'DELETE' THEN
      -- Try to cast OLD.id to UUID, if it fails, generate a new UUID
      record_id_val := COALESCE(OLD.id::UUID, gen_random_uuid());
    ELSE
      -- Try to cast NEW.id to UUID, if it fails, generate a new UUID
      record_id_val := COALESCE(NEW.id::UUID, gen_random_uuid());
    END IF;
  EXCEPTION WHEN OTHERS THEN
    -- If casting fails (e.g., bigint to UUID), generate a deterministic UUID from the table name and id
    IF TG_OP = 'DELETE' THEN
      record_id_val := uuid_generate_v5(uuid_nil(), TG_TABLE_NAME || '_' || OLD.id::TEXT);
    ELSE
      record_id_val := uuid_generate_v5(uuid_nil(), TG_TABLE_NAME || '_' || NEW.id::TEXT);
    END IF;
  END;
  
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
    record_id_val,
    TG_OP,
    auth.uid(),
    user_email_var,
    old_json,
    new_json,
    changed_fields_array
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$function$;
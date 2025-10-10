-- Promote haithamlamki@gmail.com to admin (idempotent)
DO $$
DECLARE
  uid uuid;
BEGIN
  SELECT id INTO uid
  FROM auth.users
  WHERE email = 'haithamlamki@gmail.com'
  ORDER BY created_at DESC
  LIMIT 1;

  IF uid IS NULL THEN
    RAISE NOTICE 'User not found. Please sign up first.';
  ELSE
    -- Add admin role if not present
    INSERT INTO public.user_roles (user_id, role)
    VALUES (uid, 'admin')
    ON CONFLICT DO NOTHING;

    -- Optional: ensure no duplicate conflicting roles state (keep viewer too is fine)
    RAISE NOTICE 'User % promoted to admin (or already admin).', uid;
  END IF;
END $$;
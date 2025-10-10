-- Set haithamlamki@gmail.com as admin
-- First check if user exists and get their ID
DO $$
DECLARE
  user_uuid uuid;
BEGIN
  -- Get the user ID from auth.users
  SELECT id INTO user_uuid
  FROM auth.users
  WHERE email = 'haithamlamki@gmail.com';

  -- If user exists, update their role
  IF user_uuid IS NOT NULL THEN
    UPDATE public.user_roles
    SET role = 'admin'
    WHERE user_id = user_uuid;
    
    RAISE NOTICE 'User haithamlamki@gmail.com has been promoted to admin';
  ELSE
    RAISE NOTICE 'User haithamlamki@gmail.com does not exist yet. Please sign up first.';
  END IF;
END $$;
-- Delete the old user and recreate with fresh password
-- First, delete from user_roles
DELETE FROM public.user_roles 
WHERE user_id = 'b18191fc-bb5c-44ee-99b8-d8f296c0a89a';

-- Delete from profiles
DELETE FROM public.profiles 
WHERE id = 'b18191fc-bb5c-44ee-99b8-d8f296c0a89a';

-- Delete from auth.users (this will cascade)
DELETE FROM auth.users 
WHERE id = 'b18191fc-bb5c-44ee-99b8-d8f296c0a89a';
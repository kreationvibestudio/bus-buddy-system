-- ============================================================================
-- CREATE ADMIN USER
-- ============================================================================
-- Run this AFTER setting up the schema to create your first admin user.
-- 
-- IMPORTANT: Replace the values below with your actual admin credentials!
-- ============================================================================

-- Step 1: First, sign up through your app's UI or Supabase Auth UI
-- Go to: https://supabase.com/dashboard/project/YOUR_PROJECT_ID/auth/users
-- Click "Add user" and create a user with email confirmation

-- Step 2: After the user is created, run this SQL to upgrade them to admin:
-- Replace 'your-admin-email@example.com' with the actual email

/*
-- Find the user ID
SELECT id, email FROM auth.users WHERE email = 'your-admin-email@example.com';

-- Then update their role to admin (replace USER_ID_HERE with the actual UUID)
UPDATE public.user_roles 
SET role = 'admin' 
WHERE user_id = 'USER_ID_HERE';

-- Verify the update
SELECT ur.*, p.full_name, p.email 
FROM public.user_roles ur 
JOIN public.profiles p ON p.user_id = ur.user_id 
WHERE ur.role = 'admin';
*/

-- ============================================================================
-- ALTERNATIVE: Create admin user directly (if you have service role access)
-- ============================================================================
-- This requires running in Supabase Dashboard SQL Editor with elevated permissions

-- Example: Upgrade existing user to admin
-- UPDATE public.user_roles SET role = 'admin' WHERE user_id = (SELECT id FROM auth.users WHERE email = 'admin@example.com');



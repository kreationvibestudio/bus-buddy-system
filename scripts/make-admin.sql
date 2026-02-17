-- Make akin.anenih@sdkoncept.com an admin
-- Run this in your Supabase SQL Editor: https://supabase.com/dashboard/project/YOUR_PROJECT/sql/new

-- Step 1: Check if the user exists and get their current role
SELECT 
    au.id as user_id,
    au.email,
    p.full_name,
    ur.role as current_role
FROM auth.users au
LEFT JOIN public.profiles p ON p.user_id = au.id
LEFT JOIN public.user_roles ur ON ur.user_id = au.id
WHERE au.email = 'akin.anenih@sdkoncept.com';

-- Step 2: Delete existing role if any, then insert admin role
DELETE FROM public.user_roles 
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'akin.anenih@sdkoncept.com');

INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role
FROM auth.users 
WHERE email = 'akin.anenih@sdkoncept.com';

-- Step 3: Verify the update
SELECT 
    au.email,
    p.full_name,
    ur.role
FROM auth.users au
JOIN public.user_roles ur ON ur.user_id = au.id
LEFT JOIN public.profiles p ON p.user_id = au.id
WHERE au.email = 'akin.anenih@sdkoncept.com';

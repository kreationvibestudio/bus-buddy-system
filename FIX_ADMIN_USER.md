# Fix Admin User Login - Step by Step Guide

## ⚠️ IMPORTANT: Database Schema Must Be Set Up First!

**If you get the error:** `relation "public.user_roles" does not exist`

**You need to run the database schema first!** See `SETUP_DATABASE_FIRST.md` for instructions.

The schema file is at: `bus-buddy-system/supabase/setup/01_complete_schema.sql`

---

## Your Admin Credentials
- **Email:** `akin.anenih@sdkoncept.com`
- **Password:** `!1Jason2013`

## Quick Fix Options

### Option 1: Use the Fix Script (Recommended)

1. **Set environment variables:**
   ```powershell
   $env:VITE_SUPABASE_URL="your-supabase-url"
   $env:SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
   ```

2. **Run the fix script:**
   ```bash
   cd bus-buddy-system
   node scripts/fix-admin-user.js
   ```

   This script will:
   - Check if the user exists
   - Create the user if missing
   - Set/update the admin role
   - Update the password
   - Verify everything is correct

### Option 2: Fix via Supabase Dashboard (Manual)

#### Step 1: Check if User Exists

1. Go to **Supabase Dashboard** → Your Project
2. Go to **Authentication** → **Users**
3. Search for: `akin.anenih@sdkoncept.com`
4. Check if the user exists

#### Step 2A: If User Doesn't Exist - Create User

1. Click **"Add user"** → **"Create new user"**
2. Enter:
   - **Email:** `akin.anenih@sdkoncept.com`
   - **Password:** `!1Jason2013`
   - ✅ Check **"Auto Confirm User"**
3. Click **"Create user"**

#### Step 2B: If User Exists - Update Password

1. Find the user in the list
2. Click on the user
3. Click **"Reset Password"** or **"Update"**
4. Set password to: `!1Jason2013`
5. Save

#### Step 3: Set Admin Role (SQL)

1. Go to **SQL Editor** in Supabase Dashboard
2. Click **"New query"**
3. Run this SQL:

```sql
-- First, find the user ID
SELECT id, email FROM auth.users WHERE email = 'akin.anenih@sdkoncept.com';

-- Then set admin role (replace USER_ID with the ID from above, or use this one-liner):
UPDATE public.user_roles 
SET role = 'admin' 
WHERE user_id = (
  SELECT id FROM auth.users 
  WHERE email = 'akin.anenih@sdkoncept.com'
);

-- Verify the role was set
SELECT 
  u.email,
  ur.role,
  p.full_name
FROM auth.users u
LEFT JOIN public.user_roles ur ON ur.user_id = u.id
LEFT JOIN public.profiles p ON p.user_id = u.id
WHERE u.email = 'akin.anenih@sdkoncept.com';
```

#### Step 4: Verify Everything

After running the SQL, you should see:
- ✅ Email: `akin.anenih@sdkoncept.com`
- ✅ Role: `admin`
- ✅ Full name: (should be set)

### Option 3: Create User via SQL (Advanced)

If you have service role access, you can create everything via SQL:

```sql
-- This requires service role permissions
-- Create user in auth.users (if not exists)
-- Then set role
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'
FROM auth.users
WHERE email = 'akin.anenih@sdkoncept.com'
ON CONFLICT (user_id) DO UPDATE SET role = 'admin';
```

## Common Issues and Solutions

### Issue: "User not found" when logging in

**Possible causes:**
1. User doesn't exist in Supabase
2. Email is not confirmed
3. Wrong email address

**Solution:**
- Create the user via Supabase Dashboard
- Make sure "Auto Confirm User" is checked
- Verify the email is exactly: `akin.anenih@sdkoncept.com`

### Issue: "Invalid login credentials"

**Possible causes:**
1. Wrong password
2. Password was changed
3. User account is disabled

**Solution:**
- Reset password in Supabase Dashboard
- Set it to: `!1Jason2013`
- Make sure user is active

### Issue: "Access denied" after login

**Possible causes:**
1. User doesn't have admin role
2. Role is set to something else (passenger, staff, etc.)

**Solution:**
- Run the SQL command above to set admin role
- Verify with the SELECT query

### Issue: User exists but no role

**Solution:**
```sql
-- Create the role entry
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'
FROM auth.users
WHERE email = 'akin.anenih@sdkoncept.com';
```

## Verification Checklist

After fixing, verify:

- [ ] User exists in Supabase Auth → Users
- [ ] User email is: `akin.anenih@sdkoncept.com`
- [ ] User is confirmed (no email confirmation needed)
- [ ] Profile exists in `profiles` table
- [ ] Role is set to `admin` in `user_roles` table
- [ ] Password is: `!1Jason2013`
- [ ] Can log in to the app
- [ ] Can access admin-only pages

## Quick SQL Commands

### Check User Status
```sql
SELECT 
  u.id,
  u.email,
  u.email_confirmed_at,
  ur.role,
  p.full_name
FROM auth.users u
LEFT JOIN public.user_roles ur ON ur.user_id = u.id
LEFT JOIN public.profiles p ON p.user_id = u.id
WHERE u.email = 'akin.anenih@sdkoncept.com';
```

### Set Admin Role
```sql
UPDATE public.user_roles 
SET role = 'admin' 
WHERE user_id = (
  SELECT id FROM auth.users 
  WHERE email = 'akin.anenih@sdkoncept.com'
);
```

### Create Role if Missing
```sql
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'
FROM auth.users
WHERE email = 'akin.anenih@sdkoncept.com'
ON CONFLICT (user_id) DO UPDATE SET role = 'admin';
```

## Test Login

After fixing:

1. Go to your app: `https://bus-management-system-odx5dox3p-sdkoncepts-projects-29b2d379.vercel.app/auth`
2. Enter:
   - Email: `akin.anenih@sdkoncept.com`
   - Password: `!1Jason2013`
3. Click "Sign In"
4. You should be redirected to `/dashboard`
5. You should have access to admin-only pages like `/users`, `/fleet`, `/drivers`

## Still Not Working?

If login still fails:

1. **Check Supabase logs:**
   - Go to Supabase Dashboard → Logs → Auth Logs
   - Look for failed login attempts

2. **Check browser console:**
   - Open browser DevTools (F12)
   - Check Console tab for errors
   - Check Network tab for failed requests

3. **Verify environment variables:**
   - Make sure `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` are set in Vercel
   - Redeploy after adding variables

4. **Try resetting password:**
   - Use "Forgot Password" in the app
   - Or reset via Supabase Dashboard

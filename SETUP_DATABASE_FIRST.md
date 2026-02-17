# ⚠️ Database Schema Setup Required

The error `relation "public.user_roles" does not exist` means you need to set up the database schema first.

## Quick Setup Steps

### Step 1: Open Supabase SQL Editor

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project (project ref: `ccvjtchhcjzpiefrgbmk`)
3. Click **SQL Editor** in the left sidebar
4. Click **"New query"**

### Step 2: Run the Complete Schema

1. Open the file: `bus-buddy-system/supabase/setup/01_complete_schema.sql`
2. **Copy the ENTIRE file contents** (it's ~1100 lines)
3. Paste into the SQL Editor
4. Click **"Run"** (or press `Ctrl+Enter` / `Cmd+Enter`)
5. Wait for completion (30-60 seconds)

### Step 3: Verify Schema is Created

Run this query to verify tables exist:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('user_roles', 'profiles', 'buses', 'drivers')
ORDER BY table_name;
```

You should see:
- `buses`
- `drivers`
- `profiles`
- `user_roles`

### Step 4: Create Admin User

After the schema is set up, you can create the admin user:

#### Option A: Via Supabase Dashboard

1. Go to **Authentication** → **Users**
2. Click **"Add user"** → **"Create new user"**
3. Enter:
   - **Email:** `akin.anenih@sdkoncept.com`
   - **Password:** `!1Jason2013`
   - ✅ Check **"Auto Confirm User"**
4. Click **"Create user"**

#### Option B: Via SQL (if user already exists)

```sql
-- First, check if user exists
SELECT id, email, email_confirmed_at 
FROM auth.users 
WHERE email = 'akin.anenih@sdkoncept.com';

-- If user exists, set admin role:
UPDATE public.user_roles 
SET role = 'admin' 
WHERE user_id = (
  SELECT id FROM auth.users 
  WHERE email = 'akin.anenih@sdkoncept.com'
);

-- If user doesn't exist, create via Dashboard first, then run the UPDATE above
```

### Step 5: Verify Admin User

```sql
SELECT 
  u.email,
  u.email_confirmed_at,
  ur.role,
  p.full_name
FROM auth.users u
LEFT JOIN public.user_roles ur ON ur.user_id = u.id
LEFT JOIN public.profiles p ON p.user_id = u.id
WHERE u.email = 'akin.anenih@sdkoncept.com';
```

Expected result:
- ✅ Email: `akin.anenih@sdkoncept.com`
- ✅ Email confirmed: (should have a timestamp)
- ✅ Role: `admin`
- ✅ Full name: (should be set)

## Important Notes

1. **Run the schema FIRST** - Don't try to create users or set roles before running `01_complete_schema.sql`
2. **The schema creates:**
   - All tables (profiles, user_roles, buses, drivers, etc.)
   - All triggers (including `handle_new_user` which auto-creates profiles)
   - All functions and permissions
3. **After schema setup**, the `handle_new_user` trigger will automatically:
   - Create a profile when a user signs up
   - Set default role to 'passenger'
   - You then need to UPDATE the role to 'admin' manually

## Troubleshooting

### "relation does not exist" errors
- ✅ Make sure you ran `01_complete_schema.sql` completely
- ✅ Check for any errors in the SQL Editor output
- ✅ Verify tables exist with the SELECT query above

### "permission denied" errors
- ✅ Make sure you're running SQL in the Supabase Dashboard SQL Editor (has full permissions)
- ✅ Don't try to run admin SQL from the app - use Dashboard

### User created but no role
- ✅ The trigger creates a default 'passenger' role
- ✅ Run the UPDATE query to change it to 'admin'

## Next Steps After Setup

1. ✅ Schema is set up
2. ✅ Admin user is created
3. ✅ Admin role is set
4. ✅ Test login at: `https://bms.sdkoncept.com/auth`
   - Email: `akin.anenih@sdkoncept.com`
   - Password: `!1Jason2013`

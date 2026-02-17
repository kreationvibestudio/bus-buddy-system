# Supabase Database Setup

This folder contains SQL scripts to set up your Supabase database for the EagleLine Bus Buddy System.

## Setup Instructions

### Step 1: Create a New Supabase Project

1. Go to [https://supabase.com](https://supabase.com) and sign in
2. Click **"New Project"**
3. Fill in:
   - **Name**: `eagleline` (or your preferred name)
   - **Database Password**: Create a strong password (save this!)
   - **Region**: Choose the closest to your users
4. Click **"Create new project"** and wait for setup (~2 minutes)

### Step 2: Get Your API Keys

1. In your project dashboard, go to **Settings > API**
2. Copy these values:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public** key → `VITE_SUPABASE_PUBLISHABLE_KEY`
   - **service_role** key → Keep this secret (for Edge Functions)

### Step 3: Run the Database Schema

1. Go to **SQL Editor** in your Supabase dashboard
2. Click **"New query"**
3. Copy the entire contents of `01_complete_schema.sql`
4. Paste it into the SQL Editor
5. Click **"Run"** (or press Ctrl/Cmd + Enter)
6. Wait for completion (this may take 30-60 seconds)

### Step 4: Create Your Admin User

1. Go to **Authentication > Users** in your dashboard
2. Click **"Add user"** > **"Create new user"**
3. Enter:
   - Email: Your admin email
   - Password: A strong password
   - Check "Auto Confirm User"
4. Click **"Create user"**
5. Go back to **SQL Editor**
6. Run this query (replace the email):

```sql
UPDATE public.user_roles 
SET role = 'admin' 
WHERE user_id = (
  SELECT id FROM auth.users 
  WHERE email = 'your-admin-email@example.com'
);
```

### Step 5: Deploy Edge Functions (Optional)

If you want to use the Edge Functions (for driver creation, etc.):

1. Install Supabase CLI: `npm install -g supabase`
2. Login: `supabase login`
3. Link project: `supabase link --project-ref YOUR_PROJECT_REF`
4. Deploy functions: `supabase functions deploy`

### Step 6: Set Edge Function Secrets

For Mapbox maps and other features, set secrets:

```bash
# Mapbox (for maps)
supabase secrets set MAPBOX_PUBLIC_TOKEN=your-mapbox-token

# These are auto-configured:
# SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
```

Or set them in Dashboard: **Settings > Edge Functions > Secrets**

### Step 7: Update Your .env.local

Create a `.env.local` file in the project root:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key-here
```

### Verification

After setup, verify everything works:

1. Start the dev server: `npm run dev`
2. Open http://localhost:8080
3. Try logging in with your admin account
4. Check that the dashboard loads correctly

## Troubleshooting

### "relation does not exist" errors
- Make sure you ran `01_complete_schema.sql` completely
- Check the SQL Editor output for any errors

### Authentication issues
- Verify your `.env.local` has the correct Supabase URL and key
- Check that your user exists in Authentication > Users

### Permission denied errors
- Check that the user has the correct role in `user_roles` table
- Run: `SELECT * FROM user_roles WHERE user_id = 'YOUR_USER_ID';`

### Edge Functions not working
- Make sure functions are deployed: `supabase functions list`
- Check function logs: `supabase functions logs FUNCTION_NAME`

## Database Tables Overview

| Table | Description |
|-------|-------------|
| `profiles` | User profile information |
| `user_roles` | User role assignments |
| `buses` | Fleet vehicles |
| `drivers` | Driver records |
| `routes` | Bus routes |
| `schedules` | Route schedules |
| `trips` | Trip instances |
| `bookings` | Passenger bookings |
| `stations` | Bus stations |
| `states` | Nigerian states |
| `inventory_items` | Spare parts inventory |
| `maintenance_records` | Vehicle maintenance |
| `job_cards` | Mechanic work orders |
| `complaints` | Customer complaints |
| `notifications` | User notifications |



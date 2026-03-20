# How to Deploy and Run the Comprehensive Seed Data Function

## Quick Start (Using Supabase Dashboard - Easiest)

### Step 1: Deploy the Function

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: **ccvjtchhcjzpiefrgbmk**
3. Navigate to **Edge Functions** in the left sidebar
4. Click **"Create a new function"** or **"New Function"**
5. Fill in:
   - **Function Name**: `seed-comprehensive-data`
   - **Function Code**: Copy the entire contents of `supabase/functions/seed-comprehensive-data/index.ts`
6. Click **"Deploy"**

### Step 2: Run the Function

1. After deployment, find **seed-comprehensive-data** in the Edge Functions list
2. Click on it to open the function details
3. Click the **"Invoke"** button
4. The function will run and populate your database with sample data

---

## Alternative: Using Supabase CLI

### Step 1: Login to Supabase

```bash
npx supabase login
```

This will open your browser for authentication.

### Step 2: Link Your Project

```bash
npx supabase link --project-ref ccvjtchhcjzpiefrgbmk
```

### Step 3: Deploy the Function

```bash
npx supabase functions deploy seed-comprehensive-data
```

### Step 4: Invoke the Function

After deployment, you can invoke it via:

**Option A: Using Supabase Dashboard (Easiest)**
1. Go to the function details page
2. Click the **"Invoke"** button

**Option B: Using curl/HTTP request**
```bash
curl -X POST https://ccvjtchhcjzpiefrgbmk.supabase.co/functions/v1/seed-comprehensive-data \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json"
```

Get your service_role key from: **Dashboard > Settings > API > service_role key**

---

## What the Function Creates

After running the function, your database will be populated with:

- ✅ **11 Test Users** with different roles:
  - admin@eagleline.com (Admin123!)
  - staff@eagleline.com (Staff123!)
  - driver1@eagleline.com, driver2@eagleline.com, driver3@eagleline.com (Driver123!)
  - passenger1@eagleline.com, passenger2@eagleline.com (Pass123!)
  - mechanic1@eagleline.com, mechanic2@eagleline.com (Mech123!)
  - storekeeper@eagleline.com (Store123!)
  - accounts@eagleline.com (Acct123!)

- ✅ **Driver Profiles** with license information
- ✅ **20+ Bookings** with payments
- ✅ **Maintenance Records** and work orders
- ✅ **Stock Requests** for inventory
- ✅ **Financial Transactions**
- ✅ **Customer Complaints**
- ✅ **Driver Incidents**
- ✅ **User Notifications**

---

## Verification

After running the function, verify the data was created:

1. Go to **Authentication > Users** - You should see 11 new users
2. Go to **Table Editor > bookings** - You should see multiple bookings
3. Go to **Table Editor > drivers** - You should see driver profiles
4. Go to **Table Editor > maintenance_records** - You should see maintenance records

---

## Troubleshooting

### Function Not Found
- Make sure you deployed the function first
- Check that the function name is exactly `seed-comprehensive-data`

### Permission Errors
- The function uses the service role key internally, so it should have all permissions
- Make sure your database schema is set up (run `01_complete_schema.sql` first)

### No Data Created
- Check the function logs in the Supabase Dashboard
- Look for error messages in the function execution logs
- Make sure the database schema is complete and all tables exist

### Users Already Exist
- The function will update existing users instead of creating duplicates
- This is safe to run multiple times

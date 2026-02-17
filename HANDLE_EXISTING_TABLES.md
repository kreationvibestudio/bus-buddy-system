# Handling "Table Already Exists" Error

If you get the error: `relation "stations" already exists` (or any other table), you have two options:

## Option 1: Fresh Start (Recommended for New Setup)

**This will DELETE ALL DATA** but gives you a clean database.

### Steps:

1. **Drop all existing tables:**
   - Open Supabase SQL Editor
   - Copy and run: `supabase/setup/00_drop_all_tables.sql`
   - This will remove all tables, functions, and types

2. **Recreate everything:**
   - Run: `supabase/setup/01_complete_schema.sql`
   - This creates all tables fresh

3. **Create admin user:**
   - Go to Authentication → Users
   - Create user: `akin.anenih@sdkoncept.com` / `!1Jason2013`
   - Set admin role via SQL (see below)

## Option 2: Check What's Missing (Preserve Data)

If you have important data, check what tables are missing:

### Step 1: Check Existing Tables

Run this SQL to see what tables exist:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

### Step 2: Check Missing Tables

Compare with the expected tables. The schema should create these tables:

- `profiles`
- `user_roles`
- `states`
- `stations`
- `buses`
- `drivers`
- `driver_leaves`
- `routes`
- `route_stops`
- `route_stations`
- `seats`
- `schedules`
- `trips`
- `bookings`
- `payments`
- `bus_locations`
- `inventory_categories`
- `inventory_items`
- `stock_requests`
- `suppliers`
- `maintenance_records`
- `job_cards`
- `vehicle_inspections`
- `work_orders`
- `transactions`
- `payroll`
- `complaints`
- `incidents`
- `notifications`

### Step 3: Create Missing Tables Only

If only some tables are missing, you can:

1. **Skip the error** - Continue running the schema. PostgreSQL will skip tables that already exist if you use `CREATE TABLE IF NOT EXISTS`, but the current schema doesn't use that.

2. **Manual fix** - Comment out the `CREATE TABLE` statements for tables that already exist, then run the rest.

3. **Use the safe version** - I've created `01_complete_schema_safe.sql` which uses `IF NOT EXISTS`, but it's incomplete. For a full safe version, you'd need to modify all CREATE statements.

## Recommended Solution: Fresh Start

Since you're setting up the database, I recommend **Option 1 (Fresh Start)**:

1. Run `00_drop_all_tables.sql` to clean everything
2. Run `01_complete_schema.sql` to create everything fresh
3. Create your admin user

This ensures:
- ✅ All tables are created correctly
- ✅ All relationships are set up properly
- ✅ All triggers and functions work
- ✅ No conflicts or missing dependencies

## After Schema Setup

Once the schema is complete, create your admin user:

```sql
-- Check if user exists
SELECT id, email FROM auth.users WHERE email = 'akin.anenih@sdkoncept.com';

-- If user exists, set admin role:
UPDATE public.user_roles 
SET role = 'admin' 
WHERE user_id = (
  SELECT id FROM auth.users 
  WHERE email = 'akin.anenih@sdkoncept.com'
);

-- If user doesn't exist, create via Dashboard first, then run UPDATE above
```

## Quick Commands

### Drop Everything (Fresh Start)
```sql
-- Run: supabase/setup/00_drop_all_tables.sql
```

### Recreate Everything
```sql
-- Run: supabase/setup/01_complete_schema.sql
```

### Verify Setup
```sql
SELECT COUNT(*) as table_count
FROM information_schema.tables 
WHERE table_schema = 'public';
-- Should return ~29 tables
```

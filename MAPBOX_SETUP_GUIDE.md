# Mapbox Setup Guide - Fix "Map Not Available" Issue

## Problem
The live tracking map shows "Map unavailable" because the Mapbox token is not configured in Supabase.

## Solution: Set Up Mapbox Token

### Step 1: Get a Mapbox Token

1. Go to [Mapbox Account](https://account.mapbox.com/)
2. Sign in or create a free account
3. Go to **Tokens** section
4. Copy your **Default Public Token** (starts with `pk.`)
   - Or create a new token with public scopes

**Note**: Free tier includes 50,000 map loads per month - enough for development and small deployments.

### Step 2: Add Token to Supabase Secrets

#### Option A: Using Supabase Dashboard (Easiest)

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: **ccvjtchhcjzpiefrgbmk**
3. Navigate to **Project Settings** → **Edge Functions** → **Secrets**
4. Click **"Add a new secret"**
5. Fill in:
   - **Name**: `MAPBOX_PUBLIC_TOKEN`
   - **Value**: Your Mapbox token (e.g., `pk.eyJ1Ijoi...`)
6. Click **"Save"**

#### Option B: Using Supabase CLI

```bash
npx supabase secrets set MAPBOX_PUBLIC_TOKEN=your-mapbox-token-here
```

### Step 3: Verify the Function is Deployed

1. Go to **Edge Functions** in Supabase Dashboard
2. Check if `get-mapbox-token` function exists
3. If not, deploy it (the code is already in `supabase/functions/get-mapbox-token/index.ts`)

### Step 4: Test the Map

1. Refresh your application
2. Go to the **Tracking** page (`/tracking`)
3. The map should now load correctly

---

## Troubleshooting

### Still Showing "Map Not Available"

1. **Check Browser Console**:
   - Open Developer Tools (F12)
   - Look for errors related to Mapbox token
   - Check Network tab for failed requests to `get-mapbox-token`

2. **Verify Token is Set**:
   - Go to Supabase Dashboard → Edge Functions → Secrets
   - Confirm `MAPBOX_PUBLIC_TOKEN` exists
   - The value should start with `pk.`

3. **Check Function Logs**:
   - Go to Edge Functions → `get-mapbox-token`
   - Check the logs for errors
   - Should show "Successfully retrieved Mapbox token" if working

4. **Test Function Directly**:
   ```bash
   curl https://ccvjtchhcjzpiefrgbmk.supabase.co/functions/v1/get-mapbox-token
   ```
   Should return: `{"token":"pk.eyJ1Ijoi..."}`

### Map Loads But No Buses Showing

- This is normal if no buses have GPS tracking enabled
- Buses need to have their GPS tracking started from the Driver App
- Check that drivers have started trips and enabled GPS tracking

### Token Invalid Errors

- Verify your Mapbox token is valid at [Mapbox Account](https://account.mapbox.com/)
- Make sure you're using a **Public Token** (starts with `pk.`)
- Check that the token hasn't expired or been revoked

---

## Quick Reference

- **Mapbox Account**: https://account.mapbox.com/
- **Get Token**: https://account.mapbox.com/access-tokens/
- **Supabase Secrets**: Dashboard → Project Settings → Edge Functions → Secrets
- **Function Name**: `MAPBOX_PUBLIC_TOKEN`
- **Token Format**: `pk.eyJ1Ijoi...` (Public token, safe for frontend use)

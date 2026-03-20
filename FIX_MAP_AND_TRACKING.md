# Fix: Map Not Available & Live Tracking Issues

## Quick Summary

**Problem**: Live tracking map shows "Map not available"

**Solution**: Mapbox token needs to be configured in Supabase secrets

---

## Step-by-Step Fix

### 1. Get Mapbox Token

1. Go to [Mapbox Account](https://account.mapbox.com/)
2. Sign in (or create free account)
3. Go to **Access Tokens**
4. Copy your **Default Public Token** (starts with `pk.`)

**Free tier**: 50,000 map loads/month - perfect for development!

### 2. Add Token to Supabase

1. Go to [Supabase Dashboard](https://supabase.com/dashboard/project/ccvjtchhcjzpiefrgbmk/settings/functions)
2. Navigate to **Project Settings** → **Edge Functions** → **Secrets**
3. Click **"Add a new secret"**
4. Enter:
   - **Name**: `MAPBOX_PUBLIC_TOKEN`
   - **Value**: Your Mapbox token (paste the `pk.` token)
5. Click **Save**

### 3. Verify Function is Deployed

1. Go to **Edge Functions** in Supabase Dashboard
2. Check if `get-mapbox-token` function exists
3. If missing, you need to deploy it (code is in `supabase/functions/get-mapbox-token/index.ts`)

### 4. Test the Map

1. Refresh your application
2. Navigate to `/tracking` page
3. Map should now load! 🎉

---

## Why Live Tracking Shows No Buses

**Normal behavior** if:
- No drivers have started trips yet
- GPS tracking hasn't been enabled from the Driver App
- No buses have active trips

**To see buses on map**:
1. Log in as a driver (e.g., `driver1@eagleline.com` / `Driver123!`)
2. Go to Driver App (`/driver-app`)
3. Start a trip
4. Enable GPS tracking
5. Buses will appear on the tracking map

---

## Troubleshooting

### Still "Map Not Available"?

1. **Check browser console** (F12):
   - Look for errors about Mapbox token
   - Check Network tab for `get-mapbox-token` requests

2. **Verify token in Supabase**:
   - Dashboard → Edge Functions → Secrets
   - Should see `MAPBOX_PUBLIC_TOKEN` with value starting with `pk.`

3. **Test function directly**:
   ```bash
   curl https://ccvjtchhcjzpiefrgbmk.supabase.co/functions/v1/get-mapbox-token
   ```
   Should return: `{"token":"pk.eyJ1Ijoi..."}`

### Map Loads But Empty?

- This is normal! Buses only appear when:
  - Drivers start trips from Driver App
  - GPS tracking is enabled
  - Buses have active trips with locations

---

## Quick Links

- **Mapbox Account**: https://account.mapbox.com/
- **Get Token**: https://account.mapbox.com/access-tokens/
- **Supabase Secrets**: Dashboard → Settings → Edge Functions → Secrets
- **Detailed Guide**: See `MAPBOX_SETUP_GUIDE.md`

# Deploy get-mapbox-token Edge Function

## Problem
CORS error when calling `get-mapbox-token` from Vercel deployment. The function needs to be deployed to Supabase.

## Solution: Deploy the Function

### Option 1: Using Supabase Dashboard (Easiest)

1. **Go to Supabase Dashboard**:
   - https://supabase.com/dashboard/project/ccvjtchhcjzpiefrgbmk/functions

2. **Create/Update the Function**:
   - Click **"Create a new function"** or find `get-mapbox-token` if it exists
   - Function name: `get-mapbox-token`
   - Copy the code from `supabase/functions/get-mapbox-token/index.ts`

3. **Add the Secret**:
   - Go to **Settings → Edge Functions → Secrets**
   - Add secret:
     - Name: `MAPBOX_PUBLIC_TOKEN`
     - Value: `your-mapbox-token-here`
   - Click **Save**

4. **Configure Function**:
   - Go to **Edge Functions → get-mapbox-token**
   - In settings, ensure `verify_jwt` is set to `false` (or check `supabase/config.toml`)

### Option 2: Using Supabase CLI

```bash
# Install Supabase CLI (if not installed)
npm install -g supabase

# Login to Supabase
npx supabase login

# Link to your project
npx supabase link --project-ref ccvjtchhcjzpiefrgbmk

# Set the secret
npx supabase secrets set MAPBOX_PUBLIC_TOKEN=your-mapbox-token-here

# Deploy the function
npx supabase functions deploy get-mapbox-token
```

### Option 3: Manual Deployment via Dashboard

1. **Copy the Function Code**:
   - Open `supabase/functions/get-mapbox-token/index.ts`
   - Copy all the code

2. **Create Function in Dashboard**:
   - Go to: https://supabase.com/dashboard/project/ccvjtchhcjzpiefrgbmk/functions
   - Click **"New Function"**
   - Name: `get-mapbox-token`
   - Paste the code
   - Click **Deploy**

3. **Set Secret** (see Option 1, step 3)

## Verify Deployment

After deploying, test the function:

```bash
curl https://ccvjtchhcjzpiefrgbmk.supabase.co/functions/v1/get-mapbox-token
```

Should return:
```json
{"token":"your-mapbox-token-here"}
```

Or test in browser:
- Go to: https://ccvjtchhcjzpiefrgbmk.supabase.co/functions/v1/get-mapbox-token
- Should see the JSON response

## Current Function Code

The function code is located at:
- `supabase/functions/get-mapbox-token/index.ts`

It handles CORS properly and returns the Mapbox token from Supabase secrets.

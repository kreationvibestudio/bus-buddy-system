# Vercel Environment Variables Guide

## Required Environment Variables for Your Project

Your Bus Buddy System needs **2 required environment variables** in Vercel:

### 1. `VITE_SUPABASE_URL`
- **Type**: String
- **Required**: Yes
- **Description**: Your Supabase project URL
- **Format**: `https://your-project-id.supabase.co`
- **Example**: `https://abcdefghijklmnop.supabase.co`

### 2. `VITE_SUPABASE_PUBLISHABLE_KEY`
- **Type**: String
- **Required**: Yes
- **Description**: Your Supabase anon/public key (safe to expose in frontend)
- **Format**: Long alphanumeric string
- **Example**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

## How to Get Your Supabase Credentials

1. **Go to Supabase Dashboard:**
   - Visit: https://supabase.com/dashboard
   - Select your project

2. **Navigate to Settings → API:**
   - Click "Settings" in the left sidebar
   - Click "API" under Project Settings

3. **Copy the values:**
   - **Project URL** → Use for `VITE_SUPABASE_URL`
   - **anon public** key → Use for `VITE_SUPABASE_PUBLISHABLE_KEY`

## How to Add Environment Variables in Vercel

### Step 1: Go to Project Settings
1. Open your Vercel dashboard: https://vercel.com/dashboard
2. Click on your project: **bus-management-system**
3. Click **"Settings"** in the top menu
4. Click **"Environment Variables"** in the left sidebar

### Step 2: Add Each Variable
For each variable:

1. Click **"Add New"** or **"Add"** button
2. Enter the variable name (e.g., `VITE_SUPABASE_URL`)
3. Enter the variable value
4. Select environments:
   - ✅ **Production** (for live site)
   - ✅ **Preview** (for preview deployments)
   - ✅ **Development** (optional, for local dev)
5. Click **"Save"**

### Step 3: Repeat for Second Variable
Add `VITE_SUPABASE_PUBLISHABLE_KEY` following the same steps.

## Important Notes

### ⚠️ Variable Names Must Start with `VITE_`
- ✅ Correct: `VITE_SUPABASE_URL`
- ❌ Wrong: `SUPABASE_URL` (won't work in Vite)

### 🔒 Security
- `VITE_SUPABASE_PUBLISHABLE_KEY` is safe to expose (it's public)
- These variables are embedded in your build, so they're visible in the browser
- Never use your Supabase **service_role** key here (that's secret!)

### 🔄 After Adding Variables
1. **Redeploy your project** for changes to take effect
2. Go to **Deployments** tab
3. Click **"Redeploy"** on the latest deployment
4. Or push a new commit to trigger a new build

## Variables You DON'T Need

Based on your screenshot, you have these variables that are **NOT needed** for this Vite/React app:

- ❌ `DATABASE_URL` - Not used (Supabase handles this)
- ❌ `FRONTEND_URL` - Not needed
- ❌ `JWT_SECRET` - Not needed (Supabase handles auth)
- ❌ `PORT` - Not needed (Vercel handles this)
- ❌ `NODE_ENV` - Not needed (Vercel sets this automatically)

**You can remove these** if they're not used elsewhere, or keep them if you have other services that need them.

## Complete Setup Checklist

- [ ] Get Supabase Project URL from Supabase Dashboard
- [ ] Get Supabase anon/public key from Supabase Dashboard
- [ ] Add `VITE_SUPABASE_URL` to Vercel Environment Variables
- [ ] Add `VITE_SUPABASE_PUBLISHABLE_KEY` to Vercel Environment Variables
- [ ] Set both variables for Production, Preview, and Development
- [ ] Redeploy the project to apply changes
- [ ] Verify the app connects to Supabase correctly

## Testing Your Environment Variables

After adding the variables and redeploying:

1. **Check the build logs** - Should not show errors about missing env vars
2. **Visit your deployed site** - Should load without errors
3. **Try logging in** - Should connect to Supabase
4. **Check browser console** - Should not show Supabase connection errors

## Troubleshooting

### Issue: "Supabase URL is not defined"
**Solution:** 
- Check variable name is exactly `VITE_SUPABASE_URL` (case-sensitive)
- Ensure it's set for the correct environment (Production/Preview)
- Redeploy after adding the variable

### Issue: "Invalid API key"
**Solution:**
- Verify you're using the **anon public** key, not service_role key
- Check the key is copied completely (no spaces)
- Ensure variable name is exactly `VITE_SUPABASE_PUBLISHABLE_KEY`

### Issue: Variables not updating
**Solution:**
- Redeploy the project (variables are baked into the build)
- Clear Vercel build cache
- Check you're editing the correct project

## Quick Reference

| Variable Name | Where to Get It | Required |
|--------------|----------------|----------|
| `VITE_SUPABASE_URL` | Supabase Dashboard → Settings → API → Project URL | ✅ Yes |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase Dashboard → Settings → API → anon public key | ✅ Yes |

## Example Vercel Environment Variables Setup

```
VITE_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYzODk2NzI5MCwiZXhwIjoxOTU0NTQzMjkwfQ.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Note:** Replace with your actual Supabase credentials!

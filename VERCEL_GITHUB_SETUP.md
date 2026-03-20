# Fix Vercel Auto-Deployment from GitHub

## Problem
When you push to GitHub, Vercel doesn't automatically redeploy. You have to manually run `vercel --prod`.

## Solution: Connect GitHub Integration

### Step 1: Check Current Vercel Project Settings

1. **Go to Vercel Dashboard:**
   - Visit: https://vercel.com/dashboard
   - Log in to your account

2. **Find Your Project:**
   - Look for "bus-management-system" or "bus-buddy-system"
   - Click on the project

3. **Go to Settings → Git:**
   - Click "Settings" in the top menu
   - Click "Git" in the left sidebar
   - Check what's currently connected

### Step 2: Connect GitHub Repository

If GitHub is NOT connected, or connected to the wrong repo:

1. **In Vercel Dashboard → Settings → Git:**
   - Click "Connect Git Repository" or "Change Git Repository"
   - Select "GitHub"
   - Authorize Vercel to access your GitHub account (if prompted)
   - Find and select: `sdkoncept/bus-buddy-system`
   - Click "Connect"

2. **Configure Production Branch:**
   - Make sure "Production Branch" is set to `main`
   - Click "Save"

### Step 3: Verify Webhook is Set Up

1. **Check GitHub Webhooks:**
   - Go to: https://github.com/sdkoncept/bus-buddy-system/settings/hooks
   - You should see a webhook from Vercel
   - It should show recent deliveries when you push

2. **If No Webhook Exists:**
   - Vercel should create it automatically when you connect
   - If not, you may need to reconnect the integration

### Step 4: Test Auto-Deployment

After connecting:

1. **Make a small change:**
   ```bash
   echo "# Test auto-deploy" >> README.md
   git add README.md
   git commit -m "Test Vercel auto-deployment"
   git push origin main
   ```

2. **Check Vercel Dashboard:**
   - Go to Deployments tab
   - You should see a new deployment start automatically
   - It should show "Triggered by GitHub push"

## Alternative: Use Vercel CLI with GitHub Integration

If you prefer using CLI but want auto-deployment:

1. **Link Project:**
   ```bash
   vercel link
   ```
   - Select your existing project
   - This links your local project to Vercel

2. **Set Up Git Integration:**
   ```bash
   vercel git connect
   ```
   - This connects your Git repository to Vercel
   - Follow the prompts

## Troubleshooting

### Issue: GitHub Integration Not Available

**Solution:**
- Make sure you're logged into Vercel with the correct account
- Check that you have access to the `sdkoncept` GitHub organization
- Try disconnecting and reconnecting the integration

### Issue: Webhook Not Working

**Solution:**
1. Go to GitHub → Settings → Webhooks
2. Check if Vercel webhook exists
3. If it exists but not working, try:
   - Disconnect GitHub in Vercel
   - Reconnect GitHub in Vercel
   - This will recreate the webhook

### Issue: Wrong Repository Connected

**Solution:**
1. In Vercel → Settings → Git
2. Click "Disconnect" or "Change Git Repository"
3. Connect to the correct repository: `sdkoncept/bus-buddy-system`

### Issue: Deployments Not Triggering

**Check:**
1. **Branch Settings:**
   - Settings → Git → Production Branch = `main`
   - Settings → Git → Preview Branches = All branches (or specific ones)

2. **Build Settings:**
   - Settings → General
   - Framework Preset = Vite
   - Build Command = `npm run build`
   - Output Directory = `dist`
   - Install Command = `npm install`

3. **Environment Variables:**
   - Make sure all required env vars are set
   - Settings → Environment Variables

## Quick Fix: Reconnect GitHub

The fastest way to fix auto-deployment:

1. **In Vercel Dashboard:**
   - Go to your project
   - Settings → Git
   - Click "Disconnect" (if connected)
   - Click "Connect Git Repository"
   - Select GitHub → `sdkoncept/bus-buddy-system`
   - Confirm Production Branch = `main`

2. **Test:**
   - Push a commit to GitHub
   - Check Vercel dashboard - should auto-deploy

## Verify It's Working

After setup, when you push to GitHub:

1. **GitHub:**
   - Commit shows in: https://github.com/sdkoncept/bus-buddy-system/commits/main

2. **Vercel:**
   - New deployment appears automatically
   - Shows "Triggered by GitHub push"
   - Build starts within seconds

3. **Build Log:**
   - Should show: "Cloning github.com/sdkoncept/bus-buddy-system"
   - Should show your latest commit hash

## Current Project Info

- **Vercel Project:** bus-management-system
- **GitHub Repo:** sdkoncept/bus-buddy-system
- **Branch:** main
- **Vercel URL:** https://bus-management-system-odx5dox3p-sdkoncepts-projects-29b2d379.vercel.app

## Next Steps

1. ✅ Connect GitHub integration in Vercel dashboard
2. ✅ Verify webhook is created
3. ✅ Test with a push to GitHub
4. ✅ Confirm auto-deployment works

Once connected, you won't need to run `vercel --prod` manually anymore!

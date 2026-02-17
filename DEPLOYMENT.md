# Deployment Guide - Fixing 404 Errors

## Problem: 404 Error After Login

When you log in from `bms.sdkoncept.com`, you get a 404 error because the web server doesn't know how to handle client-side routing. After login, the app redirects to `/dashboard`, but the server looks for a file at that path instead of serving `index.html`.

## Solution: Configure Server for SPA Routing

The app needs to be configured so that **all routes serve `index.html`** (except for actual static files). This allows React Router to handle routing on the client side.

## Quick Fix Instructions

### For Apache Servers (cPanel, shared hosting)

1. Copy the `.htaccess` file to your `dist/` folder after building
2. Make sure your hosting supports `.htaccess` files
3. The `.htaccess` file is already configured in the project root

**After building:**
```bash
npm run build
# Copy .htaccess to dist folder
cp .htaccess dist/
```

### For Nginx Servers

1. Copy the `nginx.conf` configuration to your server
2. Update the `root` path to point to your `dist/` folder
3. Reload nginx: `sudo nginx -s reload`

**Example deployment:**
```bash
# Build the app
npm run build

# Copy files to server
scp -r dist/* user@bms.sdkoncept.com:/var/www/html/

# On server, update nginx config
sudo cp nginx.conf /etc/nginx/sites-available/bms.sdkoncept.com
sudo ln -s /etc/nginx/sites-available/bms.sdkoncept.com /etc/nginx/sites-enabled/
sudo nginx -t  # Test configuration
sudo systemctl reload nginx
```

### For Vercel

The `vercel.json` file is already configured. Just deploy:
```bash
vercel --prod
```

### For Netlify

The `netlify.toml` file is already configured. Just deploy:
```bash
netlify deploy --prod
```

## Testing the Fix

After deploying with the correct configuration:

1. Visit `vercel --prod
https://bms.sdkoncept.com`
2. Log in with your credentials
3. You should be redirected to `/dashboard` without a 404 error
4. Try navigating to other routes like `/fleet`, `/drivers`, etc. - they should all work

## Common Issues

### Issue: Still getting 404 after configuration

**Solution:**
- Make sure you've rebuilt the app: `npm run build`
- Clear your browser cache
- Check that the configuration file (`.htaccess`, `nginx.conf`, etc.) is in the correct location
- Verify the server has restarted/reloaded after configuration changes

### Issue: Static assets (CSS, JS) not loading

**Solution:**
- Check that the `try_files` directive in nginx or rewrite rules in Apache don't interfere with static files
- Verify file permissions on the server
- Check browser console for 404 errors on specific assets

### Issue: Routes work but refresh gives 404

**Solution:**
- This is the exact problem we're fixing - make sure the server configuration is applied
- For Apache: Ensure `.htaccess` is in the `dist/` folder
- For Nginx: Ensure `try_files $uri $uri/ /index.html;` is in the location block

## Build and Deploy Script

You can create a simple deploy script:

```bash
#!/bin/bash
# deploy.sh

echo "Building application..."
npm run build

echo "Copying .htaccess to dist..."
cp .htaccess dist/

echo "Deployment files ready in dist/ folder"
echo "Upload dist/ folder contents to your server"
```

Make it executable:
```bash
chmod +x deploy.sh
./deploy.sh
```

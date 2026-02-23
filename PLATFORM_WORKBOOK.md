# FleetMaster Bus Management – Platform Workbook & SOP

**A step-by-step guide to run and manage the platform. Written in simple language.**

---

## Table of Contents

1. [What This Platform Does](#1-what-this-platform-does)
1a. [First-Time Setup (From Scratch)](#1a-first-time-setup-from-scratch)
2. [Words You Need to Know](#2-words-you-need-to-know)
3. [Programming Languages & Tools Used](#3-programming-languages--tools-used)
4. [Where Everything Lives](#4-where-everything-lives)
5. [Passwords & Secrets – Where to Find Them](#5-passwords--secrets--where-to-find-them)
6. [How to Log In as Admin](#6-how-to-log-in-as-admin)
7. [Daily Admin Tasks](#7-daily-admin-tasks)
8. [Adding a New Bus](#8-adding-a-new-bus)
9. [Setting Up GPS Tracking for a Bus](#9-setting-up-gps-tracking-for-a-bus)
10. [Adding a New User](#10-adding-a-new-user)
11. [When Something Breaks](#11-when-something-breaks)
12. [Pushing Updates (Deploying)](#12-pushing-updates-deploying)
13. [Quick Reference – Important URLs](#13-quick-reference--important-urls)
- [Appendix A: What Each Page Does](#appendix-a-what-each-page-does)
- [Appendix B: Environment Variables Checklist](#appendix-b-environment-variables-checklist)
- [Appendix C: Useful Commands](#appendix-c-useful-commands)
- [Appendix D: Flow Diagrams & Screenshots](#appendix-d-flow-diagrams--screenshots)

---

## 1. What This Platform Does

FleetMaster helps you:

- **Track buses** – See where your buses are on a map in real time
- **Sell tickets** – Passengers can book seats on trips
- **Manage drivers** – Keep driver info, licenses, and trips
- **Plan routes** – Set up routes (e.g. Benin City → Lagos)
- **Schedule trips** – Decide when each bus runs
- **Maintain buses** – Record repairs and maintenance
- **Manage inventory** – Track spare parts
- **Handle money** – Payments, payroll, reports

---

## 1a. First-Time Setup (From Scratch)

If you are setting up the platform for the first time, follow these steps in order:

### Step 1: Get the Code

1. Go to https://github.com/kreationvibestudio/bus-buddy-system
2. Clone or download the code to your computer
3. Open a terminal in the project folder
4. Run: `npm install`

### Step 2: Create a Supabase Project

1. Go to https://supabase.com and sign up or log in
2. Click **New Project**
3. Name it (e.g. "FleetMaster")
4. Set a database password (save it in your password manager!)
5. Wait for the project to be created
6. Go to **Settings** → **API** and copy:
   - Project URL
   - anon public key
   - service_role key (keep this secret!)

### Step 3: Run Database Migrations

1. In the project folder, run: `npx supabase link --project-ref YOUR_PROJECT_REF`
2. Run: `npx supabase db push` (or apply migrations from the Supabase Dashboard)

### Step 4: Create an Admin User

1. Go to Supabase → Authentication → Users → **Add user**
2. Enter email and password
3. Go to **Table Editor** → `user_roles` → Insert row
4. Set `user_id` = the new user's ID, `role` = 'admin'
5. Go to **Table Editor** → `profiles` → Insert row
6. Set `user_id` = same ID, `full_name` = your name

### Step 5: Deploy to Vercel

1. Go to https://vercel.com and sign up or log in
2. Click **Add New** → **Project**
3. Import the GitHub repo: kreationvibestudio/bus-buddy-system
4. Add environment variables:
   - `VITE_SUPABASE_URL` = your Supabase Project URL
   - `VITE_SUPABASE_PUBLISHABLE_KEY` = your anon key
   - `VITE_MAPBOX_TOKEN` = your Mapbox token (get from mapbox.com)
5. Click **Deploy**

### Step 6: Deploy Edge Functions

1. Run: `npm run deploy:webhook`
2. Run: `npm run deploy:system-status`
3. In Supabase → Edge Functions → Secrets, add:
   - `TRACCAR_WEBHOOK_SECRET` = a simple token (e.g. traccar-2024)
   - `MAPBOX_PUBLIC_TOKEN` = your Mapbox token

### Step 7: Set Up Traccar (If Using GPS)

1. Install Traccar on your server or PC
2. Follow [Section 9](#9-setting-up-gps-tracking-for-a-bus) and `TRACCAR_SUPABASE_SETUP.md`

---

## 2. Words You Need to Know

| Word | Meaning |
|------|---------|
| **Admin** | The main person who can do everything in the system |
| **Supabase** | The online database and backend (stores users, buses, bookings, etc.) |
| **Vercel** | The place where the website is hosted (bms.sdkoncept.com) |
| **Traccar** | The GPS system that sends bus locations to the platform |
| **Edge Function** | A small program that runs on Supabase (e.g. receives GPS data) |
| **GitHub** | Where the code is stored; pushing code here can trigger a new deployment |
| **Migration** | A file that changes the database (adds tables, columns, etc.) |
| **Deploy** | Publish new code so it goes live on the website |

---

## 3. Programming Languages & Tools Used

### Main Languages

| Language | Where It's Used |
|----------|-----------------|
| **TypeScript** | Most of the app (pages, components, logic) |
| **SQL** | Database structure and migrations |
| **JavaScript** | Some scripts and config files |

### Frameworks & Libraries

| Tool | Purpose |
|------|---------|
| **React** | Builds the user interface (buttons, forms, pages) |
| **Vite** | Builds and runs the app during development |
| **Tailwind CSS** | Styles the app (colors, spacing, layout) |
| **Supabase** | Database, user login, real-time updates |
| **Mapbox** | Shows the map and bus locations |
| **TanStack Query** | Fetches and caches data from the database |

### Where the Code Lives

- **Frontend (what users see):** `src/` folder – pages, components, hooks
- **Database changes:** `supabase/migrations/` – SQL files
- **Backend logic:** `supabase/functions/` – Edge Functions (e.g. traccar-webhook)

---

## 4. Where Everything Lives

### Important Folders

```
bus-buddy-system/
├── src/                    ← All the app code (pages, components)
│   ├── pages/              ← Each page (Dashboard, Fleet, Bookings, etc.)
│   ├── components/         ← Reusable pieces (buttons, forms, layout)
│   ├── hooks/              ← Data fetching (buses, routes, bookings)
│   └── contexts/           ← Auth (who is logged in)
├── supabase/
│   ├── migrations/         ← Database changes (tables, columns)
│   └── functions/          ← Edge Functions (traccar-webhook, etc.)
├── public/                 ← Images, icons
├── scripts/                ← Helper scripts (test webhook, etc.)
└── PLATFORM_WORKBOOK.md    ← This file
```

### Important Files

| File | What It Does |
|------|--------------|
| `package.json` | Lists all dependencies and scripts (dev, build, deploy) |
| `vite.config.ts` | Build configuration |
| `vercel.json` | Tells Vercel how to deploy |
| `supabase/config.toml` | Supabase project and function settings |
| `.env.example` | Example of env variables (copy to `.env.local` for local dev) |

---

## 5. Passwords & Secrets – Where to Find Them

**Important:** Never put real passwords in this document. Store them in a password manager.

### Supabase (Database & Auth)

| What | Where to Find It |
|------|------------------|
| **Project URL** | Supabase Dashboard → Settings → API → Project URL |
| **Anon key** | Supabase Dashboard → Settings → API → anon public |
| **Service role key** | Supabase Dashboard → Settings → API → service_role (keep secret!) |

### Vercel (Website Hosting)

| What | Where to Find It |
|------|------------------|
| **Deployments** | Vercel Dashboard → Your Project → Deployments |
| **Environment variables** | Vercel Dashboard → Your Project → Settings → Environment Variables |

### Traccar (GPS)

| What | Where to Find It |
|------|------------------|
| **Webhook secret** | You create it: e.g. `traccar-eagleline-2024`. Set in Supabase Edge Function Secrets and in `traccar.xml` |
| **Traccar login** | Your Traccar server – you set this when you install Traccar |
| **Traccar public URL** | If using Cloudflare Tunnel: `http://supabase.sdkoncept.com` or `https://supabase.sdkoncept.com` (set in Supabase Edge Function Secrets as `TRACCAR_SERVER_URL`) |

### Mapbox (Maps)

| What | Where to Find It |
|------|------------------|
| **Public token** | Mapbox account → Access tokens → Create token (pk. prefix) |

### GitHub (Code)

| What | Where to Find It |
|------|------------------|
| **Repo** | https://github.com/kreationvibestudio/bus-buddy-system |
| **Login** | Your GitHub account |

---

## 6. How to Log In as Admin

1. Go to **https://bms.sdkoncept.com** (or your local URL if testing)
2. Click **Sign In** or go to `/auth`
3. Enter the **admin email** and **password**
4. You will see the full sidebar (Dashboard, Fleet, Drivers, etc.)

**If you forgot the admin password:**

1. Go to Supabase Dashboard → Authentication → Users
2. Find the admin user by email
3. Click the three dots → **Send password reset**
4. Or use the script: `node scripts/update-password.js` (see script for usage)

**Test users (from seed):** Check `SEED_FUNCTION_GUIDE.md` or `scripts/create-test-users` for default test accounts. Change these passwords in production.

---

## 7. Daily Admin Tasks

### Check System Status

1. Log in as admin
2. Click **System Status** in the sidebar
3. Check that Supabase, Vercel, GitHub, and Traccar show green (OK)
4. Check **GPS Tracker Status** – buses should show Online or Offline

### Check Live Tracking

1. Click **Live Tracking**
2. Buses on trips should appear on the map
3. If a bus shows "Awaiting GPS" – see [Section 9](#9-setting-up-gps-tracking-for-a-bus)

### Check Bookings

1. Click **Bookings**
2. Review today's trips and bookings
3. Cancel or adjust if needed

### Check Maintenance Alerts

1. Click **Maintenance**
2. Review buses due for maintenance
3. Create work orders if needed

### Routes and Trips (optional)

- **Routes:** Set **Buses per day** per route; click **Regenerate upcoming trips** so new counts apply to future dates.
- **Schedules:** Set **Fare (₦) per seat** when creating or editing a trip to override the route base fare for that trip.

**Flow:** See [FLOW_DIAGRAMS.md](../FLOW_DIAGRAMS.md) → "Admin Route & Trip Management" for a visual guide.

---

## 8. Adding a New Bus

1. Log in as admin
2. Go to **Fleet Management**
3. Click **Add Bus**
4. Fill in:
   - **Registration Number** (e.g. AB-007-EGL)
   - **Model** (e.g. Hiace Commuter)
   - **Manufacturer** (e.g. Toyota)
   - **Capacity** (number of seats)
   - **Fuel Type** (diesel, electric, etc.)
   - **Status** (active, maintenance, out_of_service)
5. Leave **Traccar Device ID** empty for now (add later when GPS is set up)
6. Click **Add Bus** or **Save**

---

## 9. Setting Up GPS Tracking for a Bus

### Step 1: Get the Traccar Device ID

1. Open your **Traccar** server (e.g. http://100.x.x.x or your Traccar URL)
2. Go to **Settings** → **Devices**
3. Click the device for that bus
4. Note the **ID** (a number like 1, 2, 3) – **not** the uniqueId/IMEI

### Step 2: Map the Bus in FleetMaster

1. Log in as admin
2. Go to **Fleet Management**
3. Find the bus → Click **Edit**
4. Set **Traccar Device ID** to the number from Step 1
5. Save

### Step 3: Make Sure Traccar Forwards to Supabase

1. Edit `traccar.xml` on your Traccar server
2. Add (or check) these lines:

```xml
<entry key='forward.enable'>true</entry>
<entry key='forward.url'>https://ccvjtchhcjzpiefrgbmk.supabase.co/functions/v1/traccar-webhook</entry>
<entry key='forward.type'>json</entry>
<entry key='forward.header'>Authorization: Bearer YOUR_TRACCAR_WEBHOOK_SECRET</entry>
```

3. Replace `YOUR_TRACCAR_WEBHOOK_SECRET` with the secret you set in Supabase (Edge Functions → Secrets → TRACCAR_WEBHOOK_SECRET)
4. Restart Traccar

**Full guide:** See `TRACCAR_SUPABASE_SETUP.md`

**Visual Guide:** See [FLOW_DIAGRAMS.md](../FLOW_DIAGRAMS.md) → "GPS Tracking Flow" for a diagram showing how GPS data flows from device → Traccar → Supabase → Live Tracking map.

### Step 4: (Optional) Expose Traccar Publicly for System Status Check

If Traccar is on a private IP (e.g. `192.168.x.x`) or Tailscale hostname (e.g. `tail250831.ts.net`), the System Status page cannot check if Traccar is online. **GPS tracking still works** — this is only for the status check.

To make the System Status Traccar check pass, expose Traccar publicly:

**Option A: Cloudflare Tunnel** (recommended)

**Using Cloudflare Dashboard:**
1. Go to Cloudflare Dashboard → **Zero Trust** → **Networks** → **Tunnels**
2. Create or select your tunnel → **Configure** → **Public Hostname** → **Add a public hostname**
3. Configure:
   - **Subdomain:** `supabase` (or your choice)
   - **Domain:** `sdkoncept.com`
   - **Path:** Leave **empty** (to route all traffic to Traccar)
   - **Service URL:** `http://localhost:8082`
4. Click **Save** (DNS is created automatically)
5. In Supabase → Edge Functions → Secrets, set `TRACCAR_SERVER_URL` = `http://supabase.sdkoncept.com` (or `https://` if HTTPS is enabled)

**Using Config File (Alternative):**
1. Install `cloudflared`: `curl -L --output cloudflared.deb https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb && sudo dpkg -i cloudflared.deb`
2. Log in: `cloudflared tunnel login`
3. Create tunnel: `cloudflared tunnel create traccar`
4. Create config `~/.cloudflared/config.yml`:
   ```yaml
   tunnel: <TUNNEL_ID>
   credentials-file: /home/YOUR_USER/.cloudflared/<TUNNEL_ID>.json
   ingress:
     - hostname: supabase.sdkoncept.com
       service: http://localhost:8082
     - service: http_status:404
   ```
5. Add DNS CNAME: `supabase` → `<TUNNEL_ID>.cfargotunnel.com` (Proxy ON)
6. Run: `cloudflared tunnel run traccar` (or install as service)
7. In Supabase → Edge Functions → Secrets, set `TRACCAR_SERVER_URL` = `http://supabase.sdkoncept.com`

**Important:** If you set a Path in Cloudflare (e.g. `^/blog`), only URLs matching that path route to Traccar. For Traccar to work, leave Path empty or add a root path rule.

**Option B: Tailscale Funnel**
- Run: `tailscale funnel --bg 8082`
- Use the public URL (e.g. `https://tail250831.ts.net:8082`) in `TRACCAR_SERVER_URL`

**Full guide:** See `TRACCAR_SUPABASE_SETUP.md` → "Exposing Traccar Publicly"

---

## 10. Adding a New User

### Option A: From the App (Admin)

1. Log in as admin
2. Go to **User Management**
3. Click **Add User** (or similar)
4. Enter email, name, role
5. Set a temporary password and share it securely
6. User signs in and can change password in Settings

### Option B: For Drivers (Link to Existing Account)

1. Go to **Drivers**
2. Edit the driver
3. Use **Link Account** to connect an existing user to that driver

### User Roles

| Role | Can Do |
|------|--------|
| **admin** | Everything |
| **staff** | Routes, schedules, bookings, customer service (no Stations) |
| **driver** | View trips, passengers, report incidents |
| **passenger** | Book tickets, view bookings, track bus, profile (→ Settings) |
| **mechanic** | Job cards, work orders, maintenance |
| **storekeeper** | Inventory, parts requests |
| **accounts** | Transactions, payroll, reports |

---

## 11. When Something Breaks

### Website Won't Load (bms.sdkoncept.com)

1. Check **Vercel** dashboard – any failed deployments?
2. Check **Vercel Environment Variables** – are `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` set?
3. Redeploy: Vercel → Deployments → Redeploy

### Can't Log In

1. Check Supabase Dashboard → Authentication → Users – is the user there?
2. Try password reset (Supabase → Users → Send password reset)
3. Check that `user_roles` has a row for that user with the correct role

### GPS Not Showing for a Bus

1. Go to **System Status** → check Traccar Server (green?)
2. Go to **Fleet Management** – does the bus have **Traccar Device ID** set?
3. In Traccar, check that the device is sending positions (Replay or Reports)
4. Check Supabase → Edge Functions → traccar-webhook → Logs – any errors?
5. See `TRACCAR_SUPABASE_SETUP.md` for full troubleshooting

### Maps Not Loading

1. Check **Vercel** – is `VITE_MAPBOX_TOKEN` set?
2. Or check Supabase → Edge Functions → get-mapbox-token – is `MAPBOX_PUBLIC_TOKEN` set?
3. Deploy the function: `npm run deploy:webhook` (or deploy get-mapbox-token)

### "Failed to Fetch" or Connection Errors

1. Check your internet connection
2. Check Supabase status: https://status.supabase.com
3. Check Vercel status
4. Try in a different browser or incognito

### System Status: Supabase Shows 401

1. The System Status page checks Supabase using the anon key. A 401 means the key is wrong or missing.
2. Go to **Supabase Dashboard** → **Project Settings** → **API** – copy the **anon public** key
3. Go to **Edge Functions** → **system-status** → **Secrets** (or **Project Settings** → **Edge Functions** → Secrets)
4. Add or update: `ANON_KEY` or `SUPABASE_ANON_KEY` = your anon key (Supabase CLI may block `SUPABASE_*`; use `ANON_KEY` if needed)
5. Redeploy the function: `npm run deploy:system-status`

### System Status: Traccar Shows "Connection Timed Out" or "Private IP"

1. **If the message says "Private IP cannot be reached from cloud":**
   - Your Traccar server is on a local/private IP (e.g. 100.x.x.x, 192.168.x.x) or Tailscale hostname (e.g. tail250831.ts.net). Supabase runs in the cloud and cannot reach it.
   - **Fix:** Expose Traccar publicly using:
     - **Cloudflare Tunnel** (recommended) — see Section 9 Step 4 or `TRACCAR_SUPABASE_SETUP.md`
     - **Tailscale Funnel** — run `tailscale funnel --bg 8082` and use the public URL
     - **ngrok** — run `ngrok http 8082` and use the HTTPS URL
     - **VPS** — install Traccar on a server with a public IP
   - **Note:** GPS tracking still works! Traccar sends data *to* Supabase (webhook). The System Status check only fails because it tries to reach Traccar *from* the cloud.

2. **If the message says "Connection timed out":**
   - Traccar might be offline, or behind a firewall that blocks incoming connections.
   - Check that Traccar is running and reachable from the internet (try opening the Traccar URL in a browser from another network).
   - Set `TRACCAR_SERVER_URL` in Supabase Edge Function secrets to your **Cloudflare Tunnel URL** (e.g. `http://supabase.sdkoncept.com` or `https://supabase.sdkoncept.com`).
   - Ensure `TRACCAR_API_USER` and `TRACCAR_API_PASS` are set correctly.

---

## 12. Pushing Updates (Deploying)

### When You Change Code

1. Save your changes
2. Open a terminal in the project folder
3. Run:
   ```bash
   git add -A
   git commit -m "Describe what you changed"
   git push origin main
   ```
4. Vercel will automatically build and deploy (if connected to GitHub)

### When You Change Database (Migrations)

1. Create or edit a file in `supabase/migrations/`
2. Run: `npx supabase db push` (or apply via Supabase Dashboard)
3. Push code as above

### When You Change Edge Functions

1. Edit files in `supabase/functions/`
2. Deploy:
   ```bash
   npm run deploy:webhook          # Just traccar-webhook
   npm run deploy:system-status   # system-status + test-traccar-webhook
   # Or deploy all:
   npx supabase functions deploy --project-ref ccvjtchhcjzpiefrgbmk
   ```

---

## 13. Quick Reference – Important URLs

| What | URL |
|------|-----|
| **Live site** | https://bms.sdkoncept.com |
| **Supabase Dashboard** | https://supabase.com/dashboard/project/ccvjtchhcjzpiefrgbmk |
| **Vercel Dashboard** | https://vercel.com/dashboard |
| **GitHub repo** | https://github.com/kreationvibestudio/bus-buddy-system |
| **Traccar webhook** | https://ccvjtchhcjzpiefrgbmk.supabase.co/functions/v1/traccar-webhook |

### Project IDs

- **Supabase project:** `ccvjtchhcjzpiefrgbmk`
- **GitHub repo:** `kreationvibestudio/bus-buddy-system`

---

## Appendix A: What Each Page Does

| Page | Who Can See It | What It Does |
|------|----------------|--------------|
| **Dashboard** | Everyone | Overview: stats, quick links; passengers see Upcoming Trips (links to My Bookings with upcoming filter) |
| **Profile** | Everyone | Redirects to Settings (profile info) |
| **Settings** | Everyone | Edit name, phone; profile info |
| **User Management** | Admin | Add, edit, delete users and roles |
| **Fleet Management** | Admin | Add, edit buses; set Traccar Device ID |
| **Drivers** | Admin | Manage drivers, link to user accounts |
| **Stations** | Admin only | Bus stops and stations (passengers and staff do not see this) |
| **Routes** | Admin, Staff | Routes (origin/destination, base fare, **daily bus count**); "Regenerate upcoming trips" applies bus counts |
| **Schedules** | Admin, Staff, Driver | When each bus runs; admin can set **trip fare** per trip (override route base fare) |
| **Bookings** | Admin, Staff | View and manage all bookings |
| **Live Tracking** | Admin, Staff, Passenger | Map with bus locations (Traccar) |
| **Maintenance** | Admin, Staff, Mechanic | Maintenance records, work orders |
| **Inventory** | Admin, Staff, Storekeeper, Mechanic | Parts and stock |
| **Accounts** | Admin, Accounts | Transactions, payroll |
| **Customer Service** | Admin, Staff | Complaints and support |
| **Reports** | Admin | Charts and reports |
| **System Status** | Admin | Check Supabase (anon key), Traccar (public URL); set ANON_KEY or SUPABASE_ANON_KEY in Edge secrets |
| **Book Ticket** | Passenger (and admin/staff) | Search route/date, select trip(s), pick seats, confirm; pay at terminal or later from My Bookings |
| **My Bookings** | Passenger | View all bookings (pending/confirmed/paid); **View details** for any booking; `?filter=upcoming` shows only future trips |
| **Driver Trips** | Admin, Driver | Driver sees their trips |

---

## Appendix B: Environment Variables Checklist

### For Vercel (Website)

- [ ] `VITE_SUPABASE_URL`
- [ ] `VITE_SUPABASE_PUBLISHABLE_KEY`
- [ ] `VITE_MAPBOX_TOKEN` (optional if using Edge Function)

### For Supabase Edge Functions

- [ ] `TRACCAR_WEBHOOK_SECRET` (for Traccar to send GPS)
- [ ] `MAPBOX_PUBLIC_TOKEN` (for maps)
- [ ] `TRACCAR_SERVER_URL` (optional, for System Status check – **must be public URL**, e.g. `http://supabase.sdkoncept.com` or `https://supabase.sdkoncept.com` via Cloudflare Tunnel)
- [ ] `TRACCAR_API_USER` (optional, Traccar login email)
- [ ] `TRACCAR_API_PASS` (optional, Traccar password)
- [ ] `ANON_KEY` or `SUPABASE_ANON_KEY` (for system-status function – set manually if Supabase check shows 401)

---

## Appendix C: Useful Commands

```bash
# Run the app locally
npm run dev

# Build for production
npm run build

# Test Traccar webhook
npm run test:traccar

# Deploy Traccar webhook
npm run deploy:webhook

# Deploy system status functions
npm run deploy:system-status
```

---

## Appendix D: Flow Diagrams & Screenshots

### Flow Diagrams

See **[FLOW_DIAGRAMS.md](../FLOW_DIAGRAMS.md)** for visual flowcharts showing:
- Passenger booking process (search → select trip → seats → confirm)
- Admin route and trip management (daily bus count, trip fare, regenerate)
- GPS tracking flow (Traccar → webhook → database → map)
- Payment flow (pending → paid → completed)
- Driver trip management (start → in progress → complete)
- System architecture (frontend, backend, external services)
- User role access flow
- Booking status lifecycle

### Screenshots

See **[SCREENSHOTS_GUIDE.md](../SCREENSHOTS_GUIDE.md)** for:
- Complete checklist of all pages to screenshot
- Folder structure (`screenshots/admin/`, `screenshots/passenger/`, etc.)
- How to capture screenshots (browser tools, extensions, OS shortcuts)
- Tips for good screenshots (consistent sizing, hiding sensitive data)
- How to add screenshots to documentation

**Screenshot examples** (add when captured):
<!-- 
![Admin Dashboard](./screenshots/admin/dashboard.png)
![Passenger Booking](./screenshots/passenger/book-ticket-search.png)
![Routes Management](./screenshots/admin/routes.png)
-->

---

*Last updated: February 2026. Keep this document in a safe place and update it when you change the platform.*

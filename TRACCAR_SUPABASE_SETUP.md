# Traccar → Supabase Setup (Why Nothing Shows Up)

Your Traccar app is receiving data (as shown in Replay), but **Traccar does not automatically send data to Supabase**. You must configure **position forwarding** in Traccar.

## Step 1: Configure Traccar Position Forwarding

Traccar must be told to forward each position update to your Supabase Edge Function.

### Find your Traccar config file

- **Linux**: `/etc/traccar/traccar.xml`
- **Docker**: The config file you mount (e.g. `-v ./traccar.xml:/etc/traccar/traccar.xml`)
- **Windows**: In your Traccar install folder, `conf/traccar.xml`

### Add these entries to `traccar.xml`

```xml
<!-- Position forwarding to Supabase -->
<entry key='forward.enable'>true</entry>
<entry key='forward.url'>https://ccvjtchhcjzpiefrgbmk.supabase.co/functions/v1/traccar-webhook</entry>
<entry key='forward.type'>json</entry>
<entry key='forward.header'>Authorization: Bearer YOUR_WEBHOOK_SECRET</entry>
```

**Note:** Some Traccar versions require `forward.enable` to be explicitly set.

**For `YOUR_WEBHOOK_SECRET`** — **use Option B (custom secret)** to avoid 401:

- **Option A**: Supabase **service_role** key — often fails because the long JWT can break in XML (e.g. `&` must be `&amp;`). Not recommended for Traccar.
- **Option B (recommended)**: A simple custom secret — see below.

### Set webhook secret (fixes 401 Unauthorized)

1. Supabase Dashboard → **Edge Functions** → select `traccar-webhook` → **Secrets** (or Project Settings → Edge Functions → Secrets)
2. Add secret: Name = `TRACCAR_WEBHOOK_SECRET`, Value = a simple token (e.g. `traccar-eagleline-2024` or `my-secret-123`)
3. In `traccar.xml`, use that exact value:
   ```xml
   <entry key='forward.header'>Authorization: Bearer traccar-eagleline-2024</entry>
   ```
4. Restart Traccar

**Important:** No spaces before/after the token. The token in traccar.xml must match the secret exactly.

### Restart Traccar

After editing the config, restart the Traccar service so it picks up the new settings.

---

## Step 2: Map Your Device to a Bus

The webhook only accepts data for devices that are **mapped to a bus** in your fleet.

1. **Get your Traccar device ID**
   - In Traccar: **Settings** → **Devices** → select the device for that bus
   - Use the **ID** (integer, e.g. `1`, `2`, `42`) — **not** the uniqueId/IMEI

2. **Map it in Fleet Management**
   - Go to **Fleet Management** → find the bus (e.g. LG-004-EGL) → click **Edit**
   - Set **Traccar Device ID** to that number (e.g. `42`)
   - Save

If no bus has that `traccar_device_id`, the webhook returns 404 and does not store the position.

**Buses without Traccar Device ID** show an amber alert on the Fleet Management page.

---

## Step 3: Deploy the Edge Function

Ensure the webhook is deployed:

```bash
supabase functions deploy traccar-webhook
```

---

## Diagnostic: Still No Data?

If you've done everything above and still see no GPS data:

### 1. Confirm requests reach Supabase

- Supabase Dashboard → **Edge Functions** → `traccar-webhook` → **Logs**
- **No log entries at all** → Traccar is not reaching Supabase:
  - Add `forward.enable` = `true` to traccar.xml
  - Verify `forward.url` exactly: `https://ccvjtchhcjzpiefrgbmk.supabase.co/functions/v1/traccar-webhook`
  - Restart Traccar: `sudo systemctl restart traccar` (or your method)
  - Check firewall: Traccar server must make outbound HTTPS to Supabase

### 2. Interpret log entries

- `[traccar-webhook] Received` with `deviceId`, `lat`, `lng` → Request parsed; check for 404 below
- `401` → Wrong `forward.header`. Use TRACCAR_WEBHOOK_SECRET (see "Set webhook secret" above). Avoid service_role key in XML—it often breaks.
- `404 Bus not mapped` → Device ID in payload doesn't match any bus. In Traccar: Devices → your device → note the **ID** (integer). In Fleet Management → Edit bus → set **Traccar Device ID** to that exact number
- `400` with `received` object → Payload format issue. The response shows what was received; share with support

### 3. Test with curl

```bash
# Replace DEVICE_ID with your bus's Traccar Device ID, AUTH with service_role key
curl -X POST "https://ccvjtchhcjzpiefrgbmk.supabase.co/functions/v1/traccar-webhook" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -d '{"deviceId": DEVICE_ID, "latitude": 6.335, "longitude": 5.627}'
```

If this returns `200` and a row appears in `bus_locations`, the webhook works. The issue is Traccar not forwarding.

### 4. Traccar server logs

- Check Traccar logs for forward errors: `journalctl -u traccar -f` or `docker logs -f traccar`
- Look for HTTP errors when forwarding (4xx, 5xx)

---

## Verify It Works

1. **Check Supabase Edge Function logs** (most important)
   - Supabase Dashboard → **Edge Functions** → `traccar-webhook` → **Logs**
   - If you see **no requests at all** → Traccar is not reaching Supabase (check forward.url, restart Traccar, or network/firewall)
   - If you see `[traccar-webhook] Received` → Request arrived; check for 401/404/400 below
   - If you see `401 Unauthorized` → Wrong or missing `forward.header` (check service role key, no extra spaces)
   - If you see `404 Bus not mapped` → Device ID in Traccar doesn't match any bus's Traccar Device ID in Fleet Management
   - If you see `400 Missing deviceId/latitude/longitude` → Payload format issue (webhook was updated to handle more formats)

2. **Check `bus_locations` table**
   - Supabase Dashboard → **Table Editor** → `bus_locations`
   - New rows should appear when your phone sends positions

3. **Traccar running locally (localhost:8082)?**
   - Traccar makes outbound requests to Supabase. Ensure your machine can reach the internet.
   - If Traccar is in Docker, ensure the container has network access.

---

## Test Data Receipt

Run the test script to simulate a Traccar position:

```bash
# With your webhook secret (or service_role key):
TRACCAR_WEBHOOK_SECRET=your-secret npm run test:traccar

# Or pass as argument:
npm run test:traccar -- your-secret
```

Ensure a bus has **Traccar Device ID** = `86509103` in Fleet Management first.

---

## Troubleshooting: Bus "On Trip" but "Awaiting GPS"

When a bus (e.g. AB-006-EGL) shows **On Trip** but **Awaiting GPS** with no GPS signal quality:

### 1. Map the bus to a Traccar device

- Go to **Fleet Management** → find the bus (e.g. AB-006-EGL) → **Edit**
- In **Traccar**: Settings → Devices → find the device on that bus → note its **ID** (e.g. `42`)
- Set **Traccar Device ID** on the bus to that number → **Save**

If Traccar Device ID is empty or wrong, the webhook will return 404 and no data is stored.

### 2. Confirm Traccar is forwarding to Supabase

- Check `traccar.xml` has `forward.url`, `forward.type`, `forward.header`
- Restart Traccar after any config change
- Supabase Dashboard → **Edge Functions** → `traccar-webhook` → **Logs**
  - **No requests** → Traccar is not forwarding (config or network)
  - **401** → Wrong `forward.header` (Bearer token)
  - **404 Bus not mapped** → Device ID mismatch (see step 1)

### 3. Confirm the device is sending positions

- In Traccar: **Replay** or **Reports** → verify the device has recent positions
- If Traccar has no data, the GPS hardware or SIM/network on the bus is the issue

---

## Quick Checklist

- [ ] `forward.enable` = `true` in traccar.xml
- [ ] `forward.url`, `forward.type`, `forward.header` added to traccar.xml
- [ ] Service role key is correct (no extra spaces, full key)
- [ ] Traccar restarted after config change
- [ ] Device ID from Traccar set on a bus in Fleet Management
- [ ] `traccar-webhook` Edge Function deployed

---

## Exposing Traccar Publicly (For System Status Check)

The System Status page tries to check if Traccar is reachable. If Traccar is on a **private IP** (e.g. `192.168.x.x`, `100.x.x.x`) or **Tailscale hostname** (e.g. `tail250831.ts.net`), Supabase Edge Functions (running in the cloud) cannot reach it.

**Important:** GPS tracking still works! Traccar sends data **to** Supabase via webhook. The System Status check only fails because it tries to reach Traccar **from** the cloud.

If you want the System Status Traccar check to pass, expose Traccar publicly using one of these methods:

### Real-World Example Configuration

**Current Setup (sdkoncept.com):**
- **Hostname:** `supabase.sdkoncept.com`
- **Service URL:** `http://localhost:8082` (Traccar running locally)
- **Path:** (should be empty for Traccar to work at root, or include `/api` for API access)
- **Supabase Config:** `TRACCAR_SERVER_URL` = `http://supabase.sdkoncept.com`

### Option 1: Cloudflare Tunnel (Recommended)

Cloudflare Tunnel exposes your local Traccar to the internet via a public URL, so Supabase can reach it.

#### Step 1: Install Cloudflared

**Linux (Debian/Ubuntu):**
```bash
curl -L --output cloudflared.deb https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared.deb
```

**Other OS:** https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/

#### Step 2: Log in and Create Tunnel

```bash
cloudflared tunnel login
```
Opens browser; select your domain (e.g. `sdkoncept.com`).

```bash
cloudflared tunnel create traccar
```
Note the tunnel ID printed.

#### Step 3: Configure Tunnel

**Option A: Using Cloudflare Dashboard (Recommended)**

1. Go to Cloudflare Dashboard → **Zero Trust** → **Networks** → **Tunnels**
2. Click your tunnel → **Configure** → **Public Hostname** → **Add a public hostname**
3. Configure:
   - **Subdomain:** `supabase` (or your choice)
   - **Domain:** `sdkoncept.com` (or your domain)
   - **Path:** Leave **empty** (to route all traffic to Traccar) or use `^/api` if Traccar API is at `/api`
   - **Service URL:** `http://localhost:8082` (Traccar's local port)
4. Click **Save**

**Option B: Using Config File**

Create config file: `~/.cloudflared/config.yml` (or `/etc/cloudflared/config.yml`):

```yaml
tunnel: <YOUR_TUNNEL_ID>
credentials-file: /home/YOUR_USER/.cloudflared/<TUNNEL_ID>.json

ingress:
  - hostname: supabase.sdkoncept.com
    service: http://localhost:8082
  - service: http_status:404
```

**Important:** 
- If you set a **Path** (e.g. `^/blog`), only URLs matching that path will route to Traccar. For Traccar to work, either:
  - **Leave Path empty** (routes all traffic to Traccar), OR
  - **Add a separate ingress rule** for root path: `hostname: supabase.sdkoncept.com` with no path, placed BEFORE the path-specific rule
- Replace `8082` with Traccar's actual port (usually **8082**)

#### Step 4: Create DNS Record (If Not Auto-Created)

If using Cloudflare Dashboard (Option A above), DNS is usually created automatically. If using config file (Option B), create DNS manually:

In Cloudflare Dashboard → your domain → **DNS**:

- Type: **CNAME**
- Name: `supabase` (or your subdomain)
- Target: `<TUNNEL_ID>.cfargotunnel.com`
- Proxy: **ON** (orange cloud)

**Example Configuration (Actual Setup):**
- **Hostname:** `supabase.sdkoncept.com`
- **Path:** (empty - routes all traffic) OR specific path if needed
- **Service URL:** `http://localhost:8082`

#### Step 5: Run Tunnel

**Once (foreground):**
```bash
cloudflared tunnel run traccar
```

**As a service (starts on boot):**
```bash
sudo cloudflared service install
sudo systemctl start cloudflared
sudo systemctl enable cloudflared
```

#### Step 6: Configure Supabase

In Supabase → Edge Functions → Secrets, set:
- `TRACCAR_SERVER_URL` = your Cloudflare Tunnel URL (e.g. `http://supabase.sdkoncept.com` or `https://supabase.sdkoncept.com`)
  - **Note:** Cloudflare Tunnel typically provides HTTPS automatically. Use `https://` if available, otherwise `http://` works.
- `TRACCAR_API_USER` = your Traccar login email
- `TRACCAR_API_PASS` = your Traccar password

**Example:** If your Cloudflare Tunnel exposes Traccar at `http://supabase.sdkoncept.com`, set:
- `TRACCAR_SERVER_URL` = `http://supabase.sdkoncept.com`

**Important Path Configuration Note:**
- If your Cloudflare Tunnel has a **Path** set (e.g. `^/blog`), only URLs matching that path will route to Traccar
- For Traccar to work properly, you need either:
  1. **No path** (empty) - routes all traffic from `supabase.sdkoncept.com` to Traccar, OR
  2. **Root path rule** - add an ingress rule with `hostname: supabase.sdkoncept.com` and no path, placed BEFORE path-specific rules
- The System Status check calls `/api/server`, so ensure that path is accessible (either no path restriction, or include `/api` in your path rules)

**Note:** Tailscale can still run on the same machine. Cloudflare Tunnel only forwards the Traccar port; Tailscale is separate.

### Option 2: Tailscale Funnel

If you use Tailscale, you can expose Traccar via **Tailscale Funnel**:

```bash
tailscale funnel --bg 8082
```

This gives you a public URL like `https://tail250831.ts.net:8082`. Use this URL in `TRACCAR_SERVER_URL`.

**Note:** Tailscale Funnel URLs expire when you restart Tailscale. For permanent access, use Cloudflare Tunnel.

### Option 3: Other Tunnels

- **ngrok**: `ngrok http 8082` → use the HTTPS URL
- **Cloudflare Tunnel** (see Option 1 above)
- **VPS with public IP**: Install Traccar on a VPS with a public IP

---

## System Status Page (Admin)

Admins can monitor GPS trackers and service connections at **System Status** (sidebar).

- **GPS Tracker Status**: Shows each bus, Traccar Device ID, and last update (online/offline)
- **Service Connections**: Supabase, Vercel (bms.sdkoncept.com), GitHub, Traccar Server
- **Test Traccar Webhook**: Sends a test position (requires password verification)

To enable **Traccar Server** status check, add Edge Function secrets:
- `TRACCAR_SERVER_URL` — **Public URL** via Cloudflare Tunnel (e.g. `http://supabase.sdkoncept.com` or `https://supabase.sdkoncept.com`)
  - **Private IPs** (e.g. `http://100.x.x.x`) won't work — Supabase can't reach them
  - **Tailscale hostnames** (e.g. `http://tail250831.ts.net`) won't work unless using Tailscale Funnel
  - Cloudflare Tunnel typically provides HTTPS automatically; use `https://` if available
- `TRACCAR_API_USER` — Traccar login email
- `TRACCAR_API_PASS` — Traccar password

If **Supabase** shows 401 on System Status, add the anon key as a secret: `ANON_KEY` or `SUPABASE_ANON_KEY` = your Supabase anon public key (from Project Settings → API).

Deploy the system-status functions: `npm run deploy:system-status`

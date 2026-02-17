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
<entry key='forward.url'>https://ccvjtchhcjzpiefrgbmk.supabase.co/functions/v1/traccar-webhook</entry>
<entry key='forward.type'>json</entry>
<entry key='forward.header'>Authorization: Bearer YOUR_WEBHOOK_SECRET</entry>
```

**For `YOUR_WEBHOOK_SECRET`**, use either:
- **Option A**: Supabase **service_role** key (Settings → API → service_role)
- **Option B**: A custom secret you set (see "Set webhook secret" below)

### Restart Traccar

After editing the config, restart the Traccar service so it picks up the new settings.

### Set webhook secret (optional, for easier testing)

If the service_role key gives "Unauthorized", use a custom secret:

1. Supabase Dashboard → **Edge Functions** → **Secrets** (or Project Settings)
2. Add secret: `TRACCAR_WEBHOOK_SECRET` = `your-chosen-secret` (e.g. `traccar-eagleline-2024`)
3. Use that same value in Traccar: `Authorization: Bearer your-chosen-secret`
4. For the **Test** button: add header `Authorization: Bearer your-chosen-secret`

---

## Step 2: Map Your Device to a Bus

The webhook only accepts data for devices that are **mapped to a bus** in your fleet.

1. **Get your Traccar device ID**
   - In Traccar: **Settings** → **Devices** → select "techno"
   - The **ID** is shown (e.g. `1`, `2`, `42`)

2. **Map it in EagleLine**
   - Go to **Fleet Management** → Edit a bus (or create a test bus)
   - Set **Traccar Device ID** to that number (e.g. `1`)
   - Save

If no bus has that `traccar_device_id`, the webhook returns 404 and does not store the position.

---

## Step 3: Deploy the Edge Function

Ensure the webhook is deployed:

```bash
supabase functions deploy traccar-webhook
```

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

## Quick Checklist

- [ ] `forward.url`, `forward.type`, `forward.header` added to traccar.xml
- [ ] Service role key is correct (no extra spaces, full key)
- [ ] Traccar restarted after config change
- [ ] Device ID from Traccar set on a bus in Fleet Management
- [ ] `traccar-webhook` Edge Function deployed

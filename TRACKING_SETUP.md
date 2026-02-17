# Live Tracking Setup Guide

## GPS Data Sources

Bus locations come from **two sources**:

### 1. Traccar (Hardware GPS)
- Traccar devices on buses send positions to the `traccar-webhook` Edge Function
- Each bus must have its **Traccar Device ID** set in **Fleet Management** → Edit Bus → "Traccar Device ID"
- Only buses with a mapped `traccar_device_id` receive data from Traccar

### 2. Driver App (Phone GPS)
- When a driver is on an active trip and enables GPS in the Driver App, their phone sends location via `update-bus-location`
- This uses the driver's device GPS (Capacitor/Geolocation API)
- **LG-001-EGL** showing live data with only 2 Traccar devices means: a driver with LG-001-EGL assigned is on an active trip with GPS enabled (phone-based tracking)

## Fixing Wrong Bus Locations

If buses show in the wrong city (e.g. Lagos instead of Benin City):

1. **Check Traccar device mapping** in Fleet Management:
   - Ensure each bus's Traccar Device ID matches the physical device on that bus
   - If Device A is on the bus in Benin but mapped to a different bus, locations will be wrong

2. **Delete stale/incorrect data** (optional):
   - In Supabase Dashboard → Table Editor → `bus_locations`
   - Delete rows with wrong coordinates (or for specific bus_ids)
   - New data from Traccar/Driver App will replace them

3. **Benin City coordinates**: lat 6.3350, lng 5.6270 (Edo state)

## Production Checklist

- [ ] Add `VITE_MAPBOX_TOKEN` to Vercel Environment Variables (required for maps)
- [ ] Map each bus to its Traccar Device ID in Fleet Management
- [ ] Configure Traccar `forward.url` and `forward.header` (see README)

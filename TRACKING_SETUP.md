# Live Tracking Setup Guide

## GPS Data Source: Traccar Only

All tracking data comes from **Traccar** hardware devices installed on buses:

- Traccar devices send positions to the `traccar-webhook` Edge Function
- Each bus must have its **Traccar Device ID** set in **Fleet Management** → Edit Bus → "Traccar Device ID"
- Only buses with a mapped `traccar_device_id` receive data from Traccar

### Data from Traccar

The webhook receives and stores:
- **Position**: latitude, longitude
- **Speed**: km/h (converted from knots)
- **Direction**: heading/course (0–360°)
- **Odometer**: total distance in km (from `totalDistance` or `distance` in attributes)
- **Geofence**: current geofence name when device is inside one

These are displayed on the Live Tracking page and Dashboard.

## Fixing Wrong Bus Locations

If buses show in the wrong city (e.g. Lagos instead of Benin City):

1. **Check Traccar device mapping** in Fleet Management:
   - Ensure each bus's Traccar Device ID matches the physical device on that bus
   - If Device A is on the bus in Benin but mapped to a different bus, locations will be wrong

2. **Delete stale/incorrect data** (optional):
   - In Supabase Dashboard → Table Editor → `bus_locations`
   - Delete rows with wrong coordinates (or for specific bus_ids)
   - New data from Traccar will replace them

3. **Benin City coordinates**: lat 6.3350, lng 5.6270 (Edo state)

## Production Checklist

- [ ] Add `VITE_MAPBOX_TOKEN` to Vercel Environment Variables (required for maps)
- [ ] Map each bus to its Traccar Device ID in Fleet Management
- [ ] Configure Traccar `forward.url` and `forward.header` (see README)

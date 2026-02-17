-- Add odometer and geofence to bus_locations for Traccar data
ALTER TABLE public.bus_locations
  ADD COLUMN IF NOT EXISTS odometer_km DECIMAL(12,2),
  ADD COLUMN IF NOT EXISTS geofence_name TEXT;

COMMENT ON COLUMN public.bus_locations.odometer_km IS 'Total distance in km from Traccar (totalDistance/1000 or odometer)';
COMMENT ON COLUMN public.bus_locations.geofence_name IS 'Current geofence name when device is inside one';

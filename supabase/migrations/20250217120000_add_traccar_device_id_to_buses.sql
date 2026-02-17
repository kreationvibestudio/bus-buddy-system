-- Add Traccar device mapping to buses for GPS forwarding integration
-- Traccar deviceId (integer) maps to bus for position forwarding
ALTER TABLE public.buses ADD COLUMN IF NOT EXISTS traccar_device_id INTEGER UNIQUE;

COMMENT ON COLUMN public.buses.traccar_device_id IS 'Traccar device ID for GPS position forwarding. Set in Traccar server and Fleet Management.';

-- Allow admin to set a custom fare per trip. When null, use the route's base_fare.
ALTER TABLE public.trips
ADD COLUMN IF NOT EXISTS fare DECIMAL(10,2);

COMMENT ON COLUMN public.trips.fare IS 'Override fare for this trip (per seat). When null, route.base_fare is used.';

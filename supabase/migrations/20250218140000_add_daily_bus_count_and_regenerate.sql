-- Allow admin/staff to set how many buses run each route per day
ALTER TABLE public.routes
ADD COLUMN IF NOT EXISTS daily_bus_count INTEGER NOT NULL DEFAULT 3;

COMMENT ON COLUMN public.routes.daily_bus_count IS 'Number of trip departures per day on this route (used when regenerating upcoming trips)';

-- Regenerate upcoming trips for the next 60 days based on each route's daily_bus_count.
-- Deletes trips with trip_date >= today, then inserts new ones with staggered times (06:00 to 18:00).
CREATE OR REPLACE FUNCTION public.regenerate_upcoming_trips()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  inserted_count INTEGER := 0;
  r RECORD;
  bus_id_val UUID;
  bus_cap INT;
  driver_id_val UUID;
  n INT;
  slot INT;
  dep_time TIME;
  arr_time TIME;
  day_offset INT;
  trip_date_val DATE;
BEGIN
  DELETE FROM public.trips WHERE trip_date >= CURRENT_DATE;

  SELECT id, COALESCE(capacity, 40) INTO bus_id_val, bus_cap
  FROM public.buses WHERE status = 'active' LIMIT 1;
  IF bus_id_val IS NULL THEN
    RETURN 0;
  END IF;

  SELECT id INTO driver_id_val FROM public.drivers WHERE status = 'active' LIMIT 1;

  FOR r IN
    SELECT id AS route_id, COALESCE(daily_bus_count, 3) AS n_trips,
           COALESCE(estimated_duration_minutes, 180) AS duration_min
    FROM public.routes
    WHERE is_active = true
  LOOP
    n := GREATEST(1, LEAST(r.n_trips, 12));

    FOR day_offset IN 0..59 LOOP
      trip_date_val := CURRENT_DATE + (day_offset || ' days')::interval;

      FOR slot IN 0..(n - 1) LOOP
        IF n = 1 THEN
          dep_time := '09:00'::time;
        ELSE
          dep_time := '06:00'::time + ((720.0 / (n - 1) * slot) || ' minutes')::interval;
        END IF;
        arr_time := dep_time + (r.duration_min || ' minutes')::interval;

        INSERT INTO public.trips (route_id, bus_id, driver_id, trip_date, departure_time, arrival_time, status, available_seats)
        VALUES (r.route_id, bus_id_val, driver_id_val, trip_date_val, dep_time, arr_time, 'scheduled', bus_cap);
        inserted_count := inserted_count + 1;
      END LOOP;
    END LOOP;
  END LOOP;

  RETURN inserted_count;
END;
$$;

-- Allow authenticated users with admin or staff role to run it
GRANT EXECUTE ON FUNCTION public.regenerate_upcoming_trips() TO authenticated;
GRANT EXECUTE ON FUNCTION public.regenerate_upcoming_trips() TO service_role;

COMMENT ON FUNCTION public.regenerate_upcoming_trips() IS 'Deletes trips from today onwards and recreates them for the next 60 days based on routes.daily_bus_count. Call after changing daily_bus_count.';

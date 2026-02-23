-- Generate daily trips for all active routes so passengers can book (buses ply every day).
-- For each route: 3 departures per day (06:00, 12:00, 18:00) for the next 60 days.

WITH
first_bus AS (
  SELECT id AS bus_id, COALESCE(capacity, 40) AS capacity
  FROM public.buses WHERE status = 'active' LIMIT 1
),
active_routes AS (
  SELECT id AS route_id, COALESCE(estimated_duration_minutes, 180) AS duration_min
  FROM public.routes WHERE is_active = true
),
days AS (
  SELECT generate_series(0, 59) AS day_offset
),
slots AS (
  SELECT * FROM (VALUES ('06:00'::time), ('12:00'::time), ('18:00'::time)) AS t(departure_time)
),
combos AS (
  SELECT
    ar.route_id,
    fb.bus_id,
    (SELECT id FROM public.drivers WHERE status = 'active' LIMIT 1) AS driver_id,
    (CURRENT_DATE + (d.day_offset || ' days')::interval)::date AS trip_date,
    s.departure_time,
    (s.departure_time + (ar.duration_min || ' minutes')::interval)::time AS arrival_time,
    fb.capacity AS available_seats
  FROM active_routes ar
  CROSS JOIN first_bus fb
  CROSS JOIN days d
  CROSS JOIN slots s
)
INSERT INTO public.trips (route_id, bus_id, driver_id, trip_date, departure_time, arrival_time, status, available_seats)
SELECT route_id, bus_id, driver_id, trip_date, departure_time, arrival_time, 'scheduled', available_seats
FROM combos
WHERE trip_date >= CURRENT_DATE
  AND NOT EXISTS (
    SELECT 1 FROM public.trips t
    WHERE t.route_id = combos.route_id AND t.trip_date = combos.trip_date AND t.departure_time = combos.departure_time
  );

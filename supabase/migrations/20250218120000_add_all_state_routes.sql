-- All possible routes between major cities in: Lagos, Edo, Port Harcourt (Rivers), Delta, FCT, Ibadan (Oyo), Anambra, Imo, Enugu, Bayelsa, Osun, Kaduna
-- Cities used: Lagos, Benin City (Edo), Port Harcourt, Warri & Asaba (Delta), Abuja (FCT), Ibadan, Awka & Onitsha (Anambra), Owerri (Imo), Enugu, Yenagoa (Bayelsa), Osogbo (Osun), Kaduna

WITH cities AS (
  SELECT * FROM (VALUES
    ('Lagos', 'Lagos'),
    ('Benin City', 'Edo'),
    ('Port Harcourt', 'Rivers'),
    ('Warri', 'Delta'),
    ('Asaba', 'Delta'),
    ('Abuja', 'FCT'),
    ('Ibadan', 'Oyo'),
    ('Awka', 'Anambra'),
    ('Onitsha', 'Anambra'),
    ('Owerri', 'Imo'),
    ('Enugu', 'Enugu'),
    ('Yenagoa', 'Bayelsa'),
    ('Osogbo', 'Osun'),
    ('Kaduna', 'Kaduna')
  ) AS t(city, state_name)
),
-- Approximate road distances (km) between city pairs - symmetric
distances AS (
  SELECT * FROM (VALUES
    ('Lagos','Benin City',312), ('Lagos','Port Harcourt',450), ('Lagos','Warri',450), ('Lagos','Asaba',500),
    ('Lagos','Abuja',700), ('Lagos','Ibadan',130), ('Lagos','Awka',500), ('Lagos','Onitsha',480),
    ('Lagos','Owerri',520), ('Lagos','Enugu',550), ('Lagos','Yenagoa',450), ('Lagos','Osogbo',230),
    ('Lagos','Kaduna',900),
    ('Benin City','Port Harcourt',230), ('Benin City','Warri',120), ('Benin City','Asaba',80),
    ('Benin City','Abuja',380), ('Benin City','Ibadan',280), ('Benin City','Awka',100), ('Benin City','Onitsha',120),
    ('Benin City','Owerri',150), ('Benin City','Enugu',220), ('Benin City','Yenagoa',180), ('Benin City','Osogbo',230),
    ('Benin City','Kaduna',550),
    ('Port Harcourt','Warri',120), ('Port Harcourt','Asaba',250), ('Port Harcourt','Abuja',550),
    ('Port Harcourt','Ibadan',520), ('Port Harcourt','Awka',280), ('Port Harcourt','Onitsha',260),
    ('Port Harcourt','Owerri',50), ('Port Harcourt','Enugu',350), ('Port Harcourt','Yenagoa',120),
    ('Port Harcourt','Osogbo',520), ('Port Harcourt','Kaduna',800),
    ('Warri','Asaba',100), ('Warri','Abuja',500), ('Warri','Ibadan',450), ('Warri','Awka',180),
    ('Warri','Onitsha',160), ('Warri','Owerri',170), ('Warri','Enugu',300), ('Warri','Yenagoa',80),
    ('Warri','Osogbo',440), ('Warri','Kaduna',750),
    ('Asaba','Abuja',450), ('Asaba','Ibadan',350), ('Asaba','Awka',50), ('Asaba','Onitsha',25),
    ('Asaba','Owerri',180), ('Asaba','Enugu',180), ('Asaba','Yenagoa',200), ('Asaba','Osogbo',320),
    ('Asaba','Kaduna',600),
    ('Abuja','Ibadan',550), ('Abuja','Awka',380), ('Abuja','Onitsha',400), ('Abuja','Owerri',450),
    ('Abuja','Enugu',400), ('Abuja','Yenagoa',600), ('Abuja','Osogbo',520), ('Abuja','Kaduna',190),
    ('Ibadan','Awka',420), ('Ibadan','Onitsha',400), ('Ibadan','Owerri',450), ('Ibadan','Enugu',450),
    ('Ibadan','Yenagoa',520), ('Ibadan','Osogbo',100), ('Ibadan','Kaduna',750),
    ('Awka','Onitsha',40), ('Awka','Owerri',100), ('Awka','Enugu',100), ('Awka','Yenagoa',280),
    ('Awka','Osogbo',320), ('Awka','Kaduna',600),
    ('Onitsha','Owerri',80), ('Onitsha','Enugu',120), ('Onitsha','Yenagoa',260), ('Onitsha','Osogbo',310),
    ('Onitsha','Kaduna',620),
    ('Owerri','Enugu',150), ('Owerri','Yenagoa',170), ('Owerri','Osogbo',440), ('Owerri','Kaduna',650),
    ('Enugu','Yenagoa',350), ('Enugu','Osogbo',420), ('Enugu','Kaduna',550),
    ('Yenagoa','Osogbo',500), ('Yenagoa','Kaduna',800),
    ('Osogbo','Kaduna',720)
  ) AS d(orig, dest, dist_km)
),
-- Build both directions and compute fare/duration (fare ~ 2000 + 30*km, duration ~ 0.7*km min)
routes_both AS (
  SELECT orig AS origin, dest AS destination, dist_km,
         ROUND(dist_km * 0.7)::INTEGER AS dur_min,
         (2000 + ROUND(dist_km * 30))::NUMERIC(10,2) AS fare
  FROM distances
  UNION ALL
  SELECT dest, orig, dist_km, ROUND(dist_km * 0.7)::INTEGER, (2000 + ROUND(dist_km * 30))::NUMERIC(10,2)
  FROM distances
),
routes_final AS (
  SELECT (origin || ' - ' || destination) AS name, origin, destination, dist_km AS distance_km,
         dur_min AS estimated_duration_minutes, fare AS base_fare
  FROM routes_both
)
INSERT INTO public.routes (name, origin, destination, distance_km, estimated_duration_minutes, base_fare, is_active)
SELECT name, origin, destination, distance_km, estimated_duration_minutes, base_fare, true
FROM routes_final
WHERE NOT EXISTS (
  SELECT 1 FROM public.routes r
  WHERE r.origin = routes_final.origin AND r.destination = routes_final.destination
);

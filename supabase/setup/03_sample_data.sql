-- ============================================================================
-- SAMPLE DATA FOR EAGLELINE BUS BUDDY SYSTEM
-- ============================================================================
-- This script creates:
-- - Stations in all 37 Nigerian states
-- - Routes connecting major cities
-- - 10 Buses (18 seats each)
-- - 10 Sienna Cars (8 seats each)
-- - Schedules and Trips
-- ============================================================================

-- ============================================================================
-- PART 1: STATIONS (One per state)
-- ============================================================================

INSERT INTO public.stations (name, code, city, state_id, address, latitude, longitude, is_active) 
SELECT 
  s.name || ' Central Terminal',
  s.code || '-CT',
  CASE s.code
    WHEN 'LA' THEN 'Lagos'
    WHEN 'AB' THEN 'Umuahia'
    WHEN 'AD' THEN 'Yola'
    WHEN 'AK' THEN 'Uyo'
    WHEN 'AN' THEN 'Awka'
    WHEN 'BA' THEN 'Bauchi'
    WHEN 'BY' THEN 'Yenagoa'
    WHEN 'BE' THEN 'Makurdi'
    WHEN 'BO' THEN 'Maiduguri'
    WHEN 'CR' THEN 'Calabar'
    WHEN 'DE' THEN 'Asaba'
    WHEN 'EB' THEN 'Abakaliki'
    WHEN 'ED' THEN 'Benin City'
    WHEN 'EK' THEN 'Ado Ekiti'
    WHEN 'EN' THEN 'Enugu'
    WHEN 'FCT' THEN 'Abuja'
    WHEN 'GO' THEN 'Gombe'
    WHEN 'IM' THEN 'Owerri'
    WHEN 'JI' THEN 'Dutse'
    WHEN 'KD' THEN 'Kaduna'
    WHEN 'KN' THEN 'Kano'
    WHEN 'KT' THEN 'Katsina'
    WHEN 'KB' THEN 'Birnin Kebbi'
    WHEN 'KO' THEN 'Lokoja'
    WHEN 'KW' THEN 'Ilorin'
    WHEN 'NA' THEN 'Lafia'
    WHEN 'NI' THEN 'Minna'
    WHEN 'OG' THEN 'Abeokuta'
    WHEN 'ON' THEN 'Akure'
    WHEN 'OS' THEN 'Osogbo'
    WHEN 'OY' THEN 'Ibadan'
    WHEN 'PL' THEN 'Jos'
    WHEN 'RI' THEN 'Port Harcourt'
    WHEN 'SO' THEN 'Sokoto'
    WHEN 'TA' THEN 'Jalingo'
    WHEN 'YO' THEN 'Damaturu'
    WHEN 'ZA' THEN 'Gusau'
    ELSE s.name
  END,
  s.id,
  'Central Motor Park, ' || s.name || ' State',
  CASE s.code
    WHEN 'LA' THEN 6.5244
    WHEN 'FCT' THEN 9.0765
    WHEN 'KN' THEN 12.0022
    WHEN 'RI' THEN 4.8156
    WHEN 'OY' THEN 7.3775
    WHEN 'EN' THEN 6.4584
    WHEN 'KD' THEN 10.5105
    ELSE 9.0820
  END,
  CASE s.code
    WHEN 'LA' THEN 3.3792
    WHEN 'FCT' THEN 7.3986
    WHEN 'KN' THEN 8.5919
    WHEN 'RI' THEN 7.0498
    WHEN 'OY' THEN 3.9470
    WHEN 'EN' THEN 7.5464
    WHEN 'KD' THEN 7.4165
    ELSE 8.6753
  END,
  true
FROM public.states s
ON CONFLICT (code) DO NOTHING;

-- ============================================================================
-- PART 2: BUSES (10 buses, 18 seats each)
-- ============================================================================

INSERT INTO public.buses (registration_number, model, manufacturer, year, capacity, status, fuel_type, mileage, notes) VALUES
('LG-001-EGL', 'Hiace Commuter', 'Toyota', 2022, 18, 'active', 'diesel', 45000, 'Premium 18-seater bus'),
('LG-002-EGL', 'Hiace Commuter', 'Toyota', 2022, 18, 'active', 'diesel', 52000, 'Premium 18-seater bus'),
('LG-003-EGL', 'Hiace Commuter', 'Toyota', 2021, 18, 'active', 'diesel', 78000, 'Standard 18-seater bus'),
('LG-004-EGL', 'Hiace Commuter', 'Toyota', 2021, 18, 'active', 'diesel', 65000, 'Standard 18-seater bus'),
('LG-005-EGL', 'Hiace Commuter', 'Toyota', 2023, 18, 'active', 'diesel', 12000, 'New 18-seater bus'),
('AB-006-EGL', 'Hiace Commuter', 'Toyota', 2022, 18, 'active', 'diesel', 38000, 'Premium 18-seater bus'),
('AB-007-EGL', 'Hiace Commuter', 'Toyota', 2021, 18, 'active', 'diesel', 82000, 'Standard 18-seater bus'),
('KN-008-EGL', 'Hiace Commuter', 'Toyota', 2022, 18, 'active', 'diesel', 41000, 'Premium 18-seater bus'),
('KN-009-EGL', 'Hiace Commuter', 'Toyota', 2023, 18, 'active', 'diesel', 8000, 'New 18-seater bus'),
('PH-010-EGL', 'Hiace Commuter', 'Toyota', 2022, 18, 'active', 'diesel', 55000, 'Premium 18-seater bus');

-- ============================================================================
-- PART 3: SIENNA CARS (10 cars, 8 seats each)
-- ============================================================================

INSERT INTO public.buses (registration_number, model, manufacturer, year, capacity, status, fuel_type, mileage, notes) VALUES
('LG-101-EGL', 'Sienna XLE', 'Toyota', 2022, 8, 'active', 'petrol', 25000, 'Executive 8-seater Sienna'),
('LG-102-EGL', 'Sienna XLE', 'Toyota', 2022, 8, 'active', 'petrol', 32000, 'Executive 8-seater Sienna'),
('LG-103-EGL', 'Sienna LE', 'Toyota', 2021, 8, 'active', 'petrol', 48000, 'Standard 8-seater Sienna'),
('LG-104-EGL', 'Sienna LE', 'Toyota', 2021, 8, 'active', 'petrol', 55000, 'Standard 8-seater Sienna'),
('LG-105-EGL', 'Sienna XLE', 'Toyota', 2023, 8, 'active', 'petrol', 8000, 'New Executive 8-seater Sienna'),
('AB-106-EGL', 'Sienna XLE', 'Toyota', 2022, 8, 'active', 'petrol', 28000, 'Executive 8-seater Sienna'),
('AB-107-EGL', 'Sienna LE', 'Toyota', 2021, 8, 'active', 'petrol', 62000, 'Standard 8-seater Sienna'),
('KN-108-EGL', 'Sienna XLE', 'Toyota', 2022, 8, 'active', 'petrol', 35000, 'Executive 8-seater Sienna'),
('KN-109-EGL', 'Sienna XLE', 'Toyota', 2023, 8, 'active', 'petrol', 5000, 'New Executive 8-seater Sienna'),
('PH-110-EGL', 'Sienna XLE', 'Toyota', 2022, 8, 'active', 'petrol', 42000, 'Executive 8-seater Sienna');

-- ============================================================================
-- PART 4: ROUTES (Major inter-state routes)
-- ============================================================================

INSERT INTO public.routes (name, origin, destination, distance_km, estimated_duration_minutes, base_fare, is_active) VALUES
-- Lagos Routes
('Lagos - Abuja Express', 'Lagos', 'Abuja', 750, 540, 25000.00, true),
('Lagos - Ibadan', 'Lagos', 'Ibadan', 128, 120, 5000.00, true),
('Lagos - Benin City', 'Lagos', 'Benin City', 312, 240, 12000.00, true),
('Lagos - Port Harcourt', 'Lagos', 'Port Harcourt', 590, 420, 20000.00, true),
('Lagos - Enugu', 'Lagos', 'Enugu', 530, 390, 18000.00, true),
('Lagos - Owerri', 'Lagos', 'Owerri', 490, 360, 17000.00, true),
('Lagos - Abeokuta', 'Lagos', 'Abeokuta', 77, 60, 3000.00, true),
('Lagos - Ilorin', 'Lagos', 'Ilorin', 300, 240, 10000.00, true),

-- Abuja Routes
('Abuja - Lagos Express', 'Abuja', 'Lagos', 750, 540, 25000.00, true),
('Abuja - Kano', 'Abuja', 'Kano', 480, 360, 15000.00, true),
('Abuja - Kaduna', 'Abuja', 'Kaduna', 180, 120, 6000.00, true),
('Abuja - Jos', 'Abuja', 'Jos', 290, 210, 8000.00, true),
('Abuja - Enugu', 'Abuja', 'Enugu', 320, 240, 10000.00, true),
('Abuja - Port Harcourt', 'Abuja', 'Port Harcourt', 580, 420, 18000.00, true),
('Abuja - Lokoja', 'Abuja', 'Lokoja', 180, 120, 5000.00, true),
('Abuja - Minna', 'Abuja', 'Minna', 135, 90, 4000.00, true),

-- Kano Routes
('Kano - Lagos', 'Kano', 'Lagos', 1100, 780, 35000.00, true),
('Kano - Abuja', 'Kano', 'Abuja', 480, 360, 15000.00, true),
('Kano - Kaduna', 'Kano', 'Kaduna', 210, 150, 7000.00, true),
('Kano - Katsina', 'Kano', 'Katsina', 165, 120, 5000.00, true),
('Kano - Sokoto', 'Kano', 'Sokoto', 420, 300, 12000.00, true),

-- Port Harcourt Routes
('Port Harcourt - Lagos', 'Port Harcourt', 'Lagos', 590, 420, 20000.00, true),
('Port Harcourt - Abuja', 'Port Harcourt', 'Abuja', 580, 420, 18000.00, true),
('Port Harcourt - Owerri', 'Port Harcourt', 'Owerri', 100, 75, 4000.00, true),
('Port Harcourt - Calabar', 'Port Harcourt', 'Calabar', 250, 180, 8000.00, true),
('Port Harcourt - Enugu', 'Port Harcourt', 'Enugu', 240, 180, 8000.00, true),
('Port Harcourt - Uyo', 'Port Harcourt', 'Uyo', 140, 105, 5000.00, true),

-- Enugu Routes
('Enugu - Lagos', 'Enugu', 'Lagos', 530, 390, 18000.00, true),
('Enugu - Abuja', 'Enugu', 'Abuja', 320, 240, 10000.00, true),
('Enugu - Port Harcourt', 'Enugu', 'Port Harcourt', 240, 180, 8000.00, true),
('Enugu - Owerri', 'Enugu', 'Owerri', 110, 90, 4000.00, true),
('Enugu - Onitsha', 'Enugu', 'Onitsha', 100, 75, 3500.00, true),

-- Ibadan Routes
('Ibadan - Lagos', 'Ibadan', 'Lagos', 128, 120, 5000.00, true),
('Ibadan - Abuja', 'Ibadan', 'Abuja', 540, 390, 18000.00, true),
('Ibadan - Ilorin', 'Ibadan', 'Ilorin', 160, 120, 5000.00, true),
('Ibadan - Abeokuta', 'Ibadan', 'Abeokuta', 80, 60, 3000.00, true),
('Ibadan - Osogbo', 'Ibadan', 'Osogbo', 88, 75, 3000.00, true);

-- ============================================================================
-- PART 5: ROUTE STATIONS (Link routes to stations)
-- ============================================================================

-- Lagos - Abuja Route Stations
INSERT INTO public.route_stations (route_id, station_id, stop_order, distance_from_origin_km, fare_from_origin, estimated_time_minutes)
SELECT 
  r.id,
  s.id,
  CASE st.code 
    WHEN 'LA' THEN 1
    WHEN 'OG' THEN 2
    WHEN 'OY' THEN 3
    WHEN 'KW' THEN 4
    WHEN 'NI' THEN 5
    WHEN 'FCT' THEN 6
  END,
  CASE st.code 
    WHEN 'LA' THEN 0
    WHEN 'OG' THEN 77
    WHEN 'OY' THEN 128
    WHEN 'KW' THEN 300
    WHEN 'NI' THEN 550
    WHEN 'FCT' THEN 750
  END,
  CASE st.code 
    WHEN 'LA' THEN 0
    WHEN 'OG' THEN 3000
    WHEN 'OY' THEN 5000
    WHEN 'KW' THEN 10000
    WHEN 'NI' THEN 18000
    WHEN 'FCT' THEN 25000
  END,
  CASE st.code 
    WHEN 'LA' THEN 0
    WHEN 'OG' THEN 60
    WHEN 'OY' THEN 120
    WHEN 'KW' THEN 240
    WHEN 'NI' THEN 400
    WHEN 'FCT' THEN 540
  END
FROM public.routes r
CROSS JOIN public.stations s
JOIN public.states st ON s.state_id = st.id
WHERE r.name = 'Lagos - Abuja Express'
AND st.code IN ('LA', 'OG', 'OY', 'KW', 'NI', 'FCT')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- PART 6: SCHEDULES (Daily schedules for popular routes)
-- ============================================================================

-- Get some bus IDs for schedules
DO $$
DECLARE
  v_bus_id UUID;
  v_route_id UUID;
  v_departure TIME;
BEGIN
  -- Lagos - Abuja schedules
  FOR v_bus_id IN (SELECT id FROM public.buses WHERE registration_number LIKE 'LG-00%' LIMIT 3)
  LOOP
    SELECT id INTO v_route_id FROM public.routes WHERE name = 'Lagos - Abuja Express' LIMIT 1;
    IF v_route_id IS NOT NULL THEN
      INSERT INTO public.schedules (route_id, bus_id, departure_time, arrival_time, days_of_week, is_active)
      VALUES 
        (v_route_id, v_bus_id, '06:00', '15:00', '{1,2,3,4,5,6,0}', true),
        (v_route_id, v_bus_id, '22:00', '07:00', '{1,2,3,4,5,6,0}', true)
      ON CONFLICT DO NOTHING;
    END IF;
  END LOOP;

  -- Lagos - Ibadan schedules
  FOR v_bus_id IN (SELECT id FROM public.buses WHERE registration_number LIKE 'LG-10%' LIMIT 2)
  LOOP
    SELECT id INTO v_route_id FROM public.routes WHERE name = 'Lagos - Ibadan' LIMIT 1;
    IF v_route_id IS NOT NULL THEN
      INSERT INTO public.schedules (route_id, bus_id, departure_time, arrival_time, days_of_week, is_active)
      VALUES 
        (v_route_id, v_bus_id, '07:00', '09:00', '{1,2,3,4,5,6,0}', true),
        (v_route_id, v_bus_id, '10:00', '12:00', '{1,2,3,4,5,6,0}', true),
        (v_route_id, v_bus_id, '14:00', '16:00', '{1,2,3,4,5,6,0}', true),
        (v_route_id, v_bus_id, '18:00', '20:00', '{1,2,3,4,5,6,0}', true)
      ON CONFLICT DO NOTHING;
    END IF;
  END LOOP;

  -- Lagos - Port Harcourt schedules
  FOR v_bus_id IN (SELECT id FROM public.buses WHERE registration_number LIKE 'PH-%' LIMIT 2)
  LOOP
    SELECT id INTO v_route_id FROM public.routes WHERE name = 'Lagos - Port Harcourt' LIMIT 1;
    IF v_route_id IS NOT NULL THEN
      INSERT INTO public.schedules (route_id, bus_id, departure_time, arrival_time, days_of_week, is_active)
      VALUES 
        (v_route_id, v_bus_id, '06:00', '13:00', '{1,2,3,4,5,6,0}', true),
        (v_route_id, v_bus_id, '21:00', '04:00', '{1,2,3,4,5,6,0}', true)
      ON CONFLICT DO NOTHING;
    END IF;
  END LOOP;

  -- Abuja - Kano schedules
  FOR v_bus_id IN (SELECT id FROM public.buses WHERE registration_number LIKE 'KN-%' LIMIT 2)
  LOOP
    SELECT id INTO v_route_id FROM public.routes WHERE name = 'Abuja - Kano' LIMIT 1;
    IF v_route_id IS NOT NULL THEN
      INSERT INTO public.schedules (route_id, bus_id, departure_time, arrival_time, days_of_week, is_active)
      VALUES 
        (v_route_id, v_bus_id, '06:00', '12:00', '{1,2,3,4,5,6,0}', true),
        (v_route_id, v_bus_id, '14:00', '20:00', '{1,2,3,4,5,6,0}', true)
      ON CONFLICT DO NOTHING;
    END IF;
  END LOOP;
END $$;

-- ============================================================================
-- PART 7: TRIPS (Create trips for the next 14 days)
-- ============================================================================

INSERT INTO public.trips (schedule_id, route_id, bus_id, trip_date, departure_time, arrival_time, status, available_seats)
SELECT 
  s.id,
  s.route_id,
  s.bus_id,
  CURRENT_DATE + (n || ' days')::interval,
  s.departure_time,
  s.arrival_time,
  'scheduled',
  b.capacity
FROM public.schedules s
JOIN public.buses b ON s.bus_id = b.id
CROSS JOIN generate_series(0, 13) n
WHERE s.is_active = true
ON CONFLICT DO NOTHING;

-- ============================================================================
-- PART 8: INVENTORY CATEGORIES
-- ============================================================================

INSERT INTO public.inventory_categories (name, description) VALUES
('Engine Parts', 'Engine components and accessories'),
('Brake System', 'Brake pads, discs, and related parts'),
('Electrical', 'Batteries, alternators, starters, lights'),
('Tires & Wheels', 'Tires, rims, and wheel accessories'),
('Suspension', 'Shock absorbers, springs, bushings'),
('Filters', 'Oil, air, fuel, and cabin filters'),
('Fluids', 'Engine oil, brake fluid, coolant, transmission fluid'),
('Body Parts', 'Mirrors, bumpers, windows, doors'),
('Interior', 'Seats, upholstery, dashboard components'),
('AC System', 'Compressors, condensers, refrigerant')
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- PART 9: INVENTORY ITEMS
-- ============================================================================

INSERT INTO public.inventory_items (category_id, name, sku, description, quantity, min_quantity, unit, unit_cost, location) 
SELECT 
  c.id,
  item.name,
  item.sku,
  item.description,
  item.quantity,
  item.min_quantity,
  item.unit,
  item.unit_cost,
  item.location
FROM (VALUES
  ('Engine Parts', 'Engine Oil Filter', 'ENG-001', 'Toyota genuine oil filter', 50, 10, 'piece', 2500.00, 'Rack A1'),
  ('Engine Parts', 'Spark Plugs Set', 'ENG-002', 'Iridium spark plugs (4 pack)', 30, 5, 'set', 8000.00, 'Rack A2'),
  ('Engine Parts', 'Timing Belt', 'ENG-003', 'Timing belt for Hiace', 15, 3, 'piece', 15000.00, 'Rack A3'),
  ('Engine Parts', 'Water Pump', 'ENG-004', 'Engine water pump', 10, 2, 'piece', 25000.00, 'Rack A4'),
  ('Brake System', 'Front Brake Pads', 'BRK-001', 'Front brake pad set', 40, 8, 'set', 12000.00, 'Rack B1'),
  ('Brake System', 'Rear Brake Pads', 'BRK-002', 'Rear brake pad set', 35, 8, 'set', 10000.00, 'Rack B2'),
  ('Brake System', 'Brake Disc Front', 'BRK-003', 'Front brake disc', 20, 4, 'piece', 18000.00, 'Rack B3'),
  ('Brake System', 'Brake Fluid', 'BRK-004', 'DOT 4 brake fluid 1L', 25, 5, 'bottle', 3500.00, 'Rack B4'),
  ('Electrical', 'Battery 12V', 'ELC-001', '12V 75Ah car battery', 12, 3, 'piece', 45000.00, 'Rack C1'),
  ('Electrical', 'Alternator', 'ELC-002', 'Alternator for Hiace', 8, 2, 'piece', 55000.00, 'Rack C2'),
  ('Electrical', 'Headlight Bulb', 'ELC-003', 'H4 headlight bulb pair', 30, 6, 'pair', 5000.00, 'Rack C3'),
  ('Electrical', 'Fuse Set', 'ELC-004', 'Assorted fuse kit', 20, 5, 'set', 2000.00, 'Rack C4'),
  ('Tires & Wheels', 'Tire 195/70R15', 'TIR-001', 'All-season tire', 24, 8, 'piece', 35000.00, 'Rack D1'),
  ('Tires & Wheels', 'Tire 215/65R16', 'TIR-002', 'All-season tire for Sienna', 16, 4, 'piece', 42000.00, 'Rack D2'),
  ('Tires & Wheels', 'Wheel Nut Set', 'TIR-003', 'Chrome wheel nut set', 15, 3, 'set', 8000.00, 'Rack D3'),
  ('Filters', 'Air Filter', 'FLT-001', 'Engine air filter', 45, 10, 'piece', 4500.00, 'Rack E1'),
  ('Filters', 'Fuel Filter', 'FLT-002', 'Fuel filter', 35, 8, 'piece', 3500.00, 'Rack E2'),
  ('Filters', 'Cabin Filter', 'FLT-003', 'Cabin air filter', 30, 6, 'piece', 5000.00, 'Rack E3'),
  ('Fluids', 'Engine Oil 5W-30', 'FLD-001', '5W-30 synthetic oil 5L', 40, 10, 'can', 12000.00, 'Rack F1'),
  ('Fluids', 'Coolant', 'FLD-002', 'Engine coolant 4L', 25, 5, 'can', 6000.00, 'Rack F2'),
  ('Fluids', 'Transmission Fluid', 'FLD-003', 'ATF transmission fluid 4L', 20, 5, 'can', 8000.00, 'Rack F3'),
  ('AC System', 'AC Compressor', 'AC-001', 'AC compressor for Hiace', 6, 2, 'piece', 85000.00, 'Rack G1'),
  ('AC System', 'Refrigerant R134a', 'AC-002', 'R134a refrigerant 500g', 30, 8, 'can', 5000.00, 'Rack G2'),
  ('Suspension', 'Front Shock Absorber', 'SUS-001', 'Front shock absorber pair', 12, 4, 'pair', 35000.00, 'Rack H1'),
  ('Suspension', 'Rear Shock Absorber', 'SUS-002', 'Rear shock absorber pair', 12, 4, 'pair', 30000.00, 'Rack H2')
) AS item(category, name, sku, description, quantity, min_quantity, unit, unit_cost, location)
JOIN public.inventory_categories c ON c.name = item.category
ON CONFLICT (sku) DO NOTHING;

-- ============================================================================
-- PART 10: SUPPLIERS
-- ============================================================================

INSERT INTO public.suppliers (name, contact_person, email, phone, address, is_active) VALUES
('Toyota Nigeria Ltd', 'Chukwudi Okonkwo', 'procurement@toyota.ng', '+234 1 234 5678', '1 Toyota Avenue, Victoria Island, Lagos', true),
('Coscharis Motors', 'Adebayo Williams', 'parts@coscharis.com', '+234 1 345 6789', '15 Akin Adesola Street, Victoria Island, Lagos', true),
('Elizade Motors', 'Funke Adeyemi', 'spares@elizade.com', '+234 1 456 7890', '23 Western Avenue, Surulere, Lagos', true),
('Autochek Nigeria', 'Ibrahim Mohammed', 'inventory@autochek.ng', '+234 9 567 8901', '5 Herbert Macaulay Way, Yaba, Lagos', true),
('Mikano Motors', 'Emeka Nwosu', 'parts@mikano.com', '+234 1 678 9012', '12 Apapa-Oshodi Expressway, Lagos', true)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- DONE! 
-- ============================================================================
-- Summary of data created:
-- - 37 Stations (one per state)
-- - 37 Routes (connecting major cities)
-- - 10 Buses (18 seats each)
-- - 10 Sienna Cars (8 seats each)
-- - Multiple schedules per route
-- - 14 days of trips
-- - 10 inventory categories
-- - 25 inventory items
-- - 5 suppliers
-- ============================================================================



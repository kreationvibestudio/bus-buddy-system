import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const results: string[] = [];

    // Get all states for reference
    const { data: states } = await supabase.from('states').select('*');
    if (!states || states.length === 0) {
      return new Response(JSON.stringify({ error: 'No states found. Please run schema first.' }), 
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 });
    }

    // Create stations for each state with coordinates
    const stateCapitalsWithCoords: Record<string, { city: string; lat: number; lng: number }> = {
      'AB': { city: 'Umuahia', lat: 5.5320, lng: 7.4860 },
      'AD': { city: 'Yola', lat: 9.2035, lng: 12.4954 },
      'AK': { city: 'Uyo', lat: 5.0377, lng: 7.9128 },
      'AN': { city: 'Awka', lat: 6.2108, lng: 7.0742 },
      'BA': { city: 'Bauchi', lat: 10.3158, lng: 9.8442 },
      'BY': { city: 'Yenagoa', lat: 4.9267, lng: 6.2676 },
      'BE': { city: 'Makurdi', lat: 7.7337, lng: 8.5212 },
      'BO': { city: 'Maiduguri', lat: 11.8311, lng: 13.1510 },
      'CR': { city: 'Calabar', lat: 4.9517, lng: 8.3220 },
      'DE': { city: 'Asaba', lat: 6.1983, lng: 6.7289 },
      'EB': { city: 'Abakaliki', lat: 6.3249, lng: 8.1137 },
      'ED': { city: 'Benin City', lat: 6.3350, lng: 5.6270 },
      'EK': { city: 'Ado Ekiti', lat: 7.6211, lng: 5.2215 },
      'EN': { city: 'Enugu', lat: 6.4584, lng: 7.5464 },
      'FCT': { city: 'Abuja', lat: 9.0579, lng: 7.4951 },
      'GO': { city: 'Gombe', lat: 10.2897, lng: 11.1673 },
      'IM': { city: 'Owerri', lat: 5.4836, lng: 7.0334 },
      'JI': { city: 'Dutse', lat: 11.7561, lng: 9.3390 },
      'KD': { city: 'Kaduna', lat: 10.5222, lng: 7.4383 },
      'KN': { city: 'Kano', lat: 12.0022, lng: 8.5920 },
      'KT': { city: 'Katsina', lat: 13.0059, lng: 7.6000 },
      'KB': { city: 'Birnin Kebbi', lat: 12.4539, lng: 4.1975 },
      'KO': { city: 'Lokoja', lat: 7.7969, lng: 6.7433 },
      'KW': { city: 'Ilorin', lat: 8.4799, lng: 4.5418 },
      'LA': { city: 'Lagos', lat: 6.5244, lng: 3.3792 },
      'NA': { city: 'Lafia', lat: 8.4966, lng: 8.5150 },
      'NI': { city: 'Minna', lat: 9.6139, lng: 6.5569 },
      'OG': { city: 'Abeokuta', lat: 7.1475, lng: 3.3619 },
      'ON': { city: 'Akure', lat: 7.2526, lng: 5.1931 },
      'OS': { city: 'Osogbo', lat: 7.7827, lng: 4.5418 },
      'OY': { city: 'Ibadan', lat: 7.3775, lng: 3.9470 },
      'PL': { city: 'Jos', lat: 9.8965, lng: 8.8583 },
      'RI': { city: 'Port Harcourt', lat: 4.8156, lng: 7.0498 },
      'SO': { city: 'Sokoto', lat: 13.0059, lng: 5.2476 },
      'TA': { city: 'Jalingo', lat: 8.8933, lng: 11.3683 },
      'YO': { city: 'Damaturu', lat: 11.7470, lng: 11.9608 },
      'ZA': { city: 'Gusau', lat: 12.1628, lng: 6.6642 }
    };

    const stations = states.map(state => {
      const capitalInfo = stateCapitalsWithCoords[state.code] || { city: state.name, lat: 9.0820, lng: 8.6753 };
      return {
        name: `${state.name} Central Terminal`,
        code: `${state.code}-CT`,
        city: capitalInfo.city,
        state_id: state.id,
        address: `Central Motor Park, ${state.name} State`,
        latitude: capitalInfo.lat,
        longitude: capitalInfo.lng,
        is_active: true
      };
    });

    const { error: stationError } = await supabase.from('stations').upsert(stations, { onConflict: 'code' });
    results.push(stationError ? `Stations: Error - ${stationError.message}` : `Stations: Created ${stations.length} stations`);

    // Create buses (18 seats)
    const buses = [
      { registration_number: 'LG-001-EGL', model: 'Hiace Commuter', manufacturer: 'Toyota', year: 2022, capacity: 18, status: 'active', fuel_type: 'diesel', mileage: 45000, notes: 'Premium 18-seater bus' },
      { registration_number: 'LG-002-EGL', model: 'Hiace Commuter', manufacturer: 'Toyota', year: 2022, capacity: 18, status: 'active', fuel_type: 'diesel', mileage: 52000, notes: 'Premium 18-seater bus' },
      { registration_number: 'LG-003-EGL', model: 'Hiace Commuter', manufacturer: 'Toyota', year: 2021, capacity: 18, status: 'active', fuel_type: 'diesel', mileage: 78000, notes: 'Standard 18-seater bus' },
      { registration_number: 'LG-004-EGL', model: 'Hiace Commuter', manufacturer: 'Toyota', year: 2021, capacity: 18, status: 'active', fuel_type: 'diesel', mileage: 65000, notes: 'Standard 18-seater bus' },
      { registration_number: 'LG-005-EGL', model: 'Hiace Commuter', manufacturer: 'Toyota', year: 2023, capacity: 18, status: 'active', fuel_type: 'diesel', mileage: 12000, notes: 'New 18-seater bus' },
      { registration_number: 'AB-006-EGL', model: 'Hiace Commuter', manufacturer: 'Toyota', year: 2022, capacity: 18, status: 'active', fuel_type: 'diesel', mileage: 38000, notes: 'Premium 18-seater bus' },
      { registration_number: 'AB-007-EGL', model: 'Hiace Commuter', manufacturer: 'Toyota', year: 2021, capacity: 18, status: 'active', fuel_type: 'diesel', mileage: 82000, notes: 'Standard 18-seater bus' },
      { registration_number: 'KN-008-EGL', model: 'Hiace Commuter', manufacturer: 'Toyota', year: 2022, capacity: 18, status: 'active', fuel_type: 'diesel', mileage: 41000, notes: 'Premium 18-seater bus' },
      { registration_number: 'KN-009-EGL', model: 'Hiace Commuter', manufacturer: 'Toyota', year: 2023, capacity: 18, status: 'active', fuel_type: 'diesel', mileage: 8000, notes: 'New 18-seater bus' },
      { registration_number: 'PH-010-EGL', model: 'Hiace Commuter', manufacturer: 'Toyota', year: 2022, capacity: 18, status: 'active', fuel_type: 'diesel', mileage: 55000, notes: 'Premium 18-seater bus' },
    ];

    // Create Sienna cars (8 seats)
    const siennas = [
      { registration_number: 'LG-101-EGL', model: 'Sienna XLE', manufacturer: 'Toyota', year: 2022, capacity: 8, status: 'active', fuel_type: 'petrol', mileage: 25000, notes: 'Executive 8-seater Sienna' },
      { registration_number: 'LG-102-EGL', model: 'Sienna XLE', manufacturer: 'Toyota', year: 2022, capacity: 8, status: 'active', fuel_type: 'petrol', mileage: 32000, notes: 'Executive 8-seater Sienna' },
      { registration_number: 'LG-103-EGL', model: 'Sienna LE', manufacturer: 'Toyota', year: 2021, capacity: 8, status: 'active', fuel_type: 'petrol', mileage: 48000, notes: 'Standard 8-seater Sienna' },
      { registration_number: 'LG-104-EGL', model: 'Sienna LE', manufacturer: 'Toyota', year: 2021, capacity: 8, status: 'active', fuel_type: 'petrol', mileage: 55000, notes: 'Standard 8-seater Sienna' },
      { registration_number: 'LG-105-EGL', model: 'Sienna XLE', manufacturer: 'Toyota', year: 2023, capacity: 8, status: 'active', fuel_type: 'petrol', mileage: 8000, notes: 'New Executive 8-seater Sienna' },
      { registration_number: 'AB-106-EGL', model: 'Sienna XLE', manufacturer: 'Toyota', year: 2022, capacity: 8, status: 'active', fuel_type: 'petrol', mileage: 28000, notes: 'Executive 8-seater Sienna' },
      { registration_number: 'AB-107-EGL', model: 'Sienna LE', manufacturer: 'Toyota', year: 2021, capacity: 8, status: 'active', fuel_type: 'petrol', mileage: 62000, notes: 'Standard 8-seater Sienna' },
      { registration_number: 'KN-108-EGL', model: 'Sienna XLE', manufacturer: 'Toyota', year: 2022, capacity: 8, status: 'active', fuel_type: 'petrol', mileage: 35000, notes: 'Executive 8-seater Sienna' },
      { registration_number: 'KN-109-EGL', model: 'Sienna XLE', manufacturer: 'Toyota', year: 2023, capacity: 8, status: 'active', fuel_type: 'petrol', mileage: 5000, notes: 'New Executive 8-seater Sienna' },
      { registration_number: 'PH-110-EGL', model: 'Sienna XLE', manufacturer: 'Toyota', year: 2022, capacity: 8, status: 'active', fuel_type: 'petrol', mileage: 42000, notes: 'Executive 8-seater Sienna' },
    ];

    const allVehicles = [...buses, ...siennas];
    const { error: busError } = await supabase.from('buses').upsert(allVehicles, { onConflict: 'registration_number' });
    results.push(busError ? `Vehicles: Error - ${busError.message}` : `Vehicles: Created ${allVehicles.length} vehicles (10 buses + 10 Siennas)`);

    // Create routes with BOTH directions for round-trip support
    const routes = [
      // Lagos routes (both directions)
      { name: 'Lagos - Abuja Express', origin: 'Lagos', destination: 'Abuja', distance_km: 750, estimated_duration_minutes: 540, base_fare: 25000, is_active: true },
      { name: 'Abuja - Lagos Express', origin: 'Abuja', destination: 'Lagos', distance_km: 750, estimated_duration_minutes: 540, base_fare: 25000, is_active: true },
      { name: 'Lagos - Ibadan', origin: 'Lagos', destination: 'Ibadan', distance_km: 128, estimated_duration_minutes: 120, base_fare: 5000, is_active: true },
      { name: 'Ibadan - Lagos', origin: 'Ibadan', destination: 'Lagos', distance_km: 128, estimated_duration_minutes: 120, base_fare: 5000, is_active: true },
      { name: 'Lagos - Benin City', origin: 'Lagos', destination: 'Benin City', distance_km: 312, estimated_duration_minutes: 240, base_fare: 12000, is_active: true },
      { name: 'Benin City - Lagos', origin: 'Benin City', destination: 'Lagos', distance_km: 312, estimated_duration_minutes: 240, base_fare: 12000, is_active: true },
      { name: 'Lagos - Port Harcourt', origin: 'Lagos', destination: 'Port Harcourt', distance_km: 590, estimated_duration_minutes: 420, base_fare: 20000, is_active: true },
      { name: 'Port Harcourt - Lagos', origin: 'Port Harcourt', destination: 'Lagos', distance_km: 590, estimated_duration_minutes: 420, base_fare: 20000, is_active: true },
      { name: 'Lagos - Enugu', origin: 'Lagos', destination: 'Enugu', distance_km: 530, estimated_duration_minutes: 390, base_fare: 18000, is_active: true },
      { name: 'Enugu - Lagos', origin: 'Enugu', destination: 'Lagos', distance_km: 530, estimated_duration_minutes: 390, base_fare: 18000, is_active: true },
      { name: 'Lagos - Owerri', origin: 'Lagos', destination: 'Owerri', distance_km: 490, estimated_duration_minutes: 360, base_fare: 17000, is_active: true },
      { name: 'Owerri - Lagos', origin: 'Owerri', destination: 'Lagos', distance_km: 490, estimated_duration_minutes: 360, base_fare: 17000, is_active: true },
      { name: 'Lagos - Abeokuta', origin: 'Lagos', destination: 'Abeokuta', distance_km: 77, estimated_duration_minutes: 60, base_fare: 3000, is_active: true },
      { name: 'Abeokuta - Lagos', origin: 'Abeokuta', destination: 'Lagos', distance_km: 77, estimated_duration_minutes: 60, base_fare: 3000, is_active: true },
      { name: 'Lagos - Ilorin', origin: 'Lagos', destination: 'Ilorin', distance_km: 300, estimated_duration_minutes: 240, base_fare: 10000, is_active: true },
      { name: 'Ilorin - Lagos', origin: 'Ilorin', destination: 'Lagos', distance_km: 300, estimated_duration_minutes: 240, base_fare: 10000, is_active: true },
      // Abuja routes (both directions)
      { name: 'Abuja - Kano', origin: 'Abuja', destination: 'Kano', distance_km: 480, estimated_duration_minutes: 360, base_fare: 15000, is_active: true },
      { name: 'Kano - Abuja', origin: 'Kano', destination: 'Abuja', distance_km: 480, estimated_duration_minutes: 360, base_fare: 15000, is_active: true },
      { name: 'Abuja - Kaduna', origin: 'Abuja', destination: 'Kaduna', distance_km: 180, estimated_duration_minutes: 120, base_fare: 6000, is_active: true },
      { name: 'Kaduna - Abuja', origin: 'Kaduna', destination: 'Abuja', distance_km: 180, estimated_duration_minutes: 120, base_fare: 6000, is_active: true },
      { name: 'Abuja - Jos', origin: 'Abuja', destination: 'Jos', distance_km: 290, estimated_duration_minutes: 210, base_fare: 8000, is_active: true },
      { name: 'Jos - Abuja', origin: 'Jos', destination: 'Abuja', distance_km: 290, estimated_duration_minutes: 210, base_fare: 8000, is_active: true },
      { name: 'Abuja - Enugu', origin: 'Abuja', destination: 'Enugu', distance_km: 320, estimated_duration_minutes: 240, base_fare: 10000, is_active: true },
      { name: 'Enugu - Abuja', origin: 'Enugu', destination: 'Abuja', distance_km: 320, estimated_duration_minutes: 240, base_fare: 10000, is_active: true },
      { name: 'Abuja - Port Harcourt', origin: 'Abuja', destination: 'Port Harcourt', distance_km: 580, estimated_duration_minutes: 420, base_fare: 18000, is_active: true },
      { name: 'Port Harcourt - Abuja', origin: 'Port Harcourt', destination: 'Abuja', distance_km: 580, estimated_duration_minutes: 420, base_fare: 18000, is_active: true },
      // Kano routes
      { name: 'Kano - Lagos', origin: 'Kano', destination: 'Lagos', distance_km: 1100, estimated_duration_minutes: 780, base_fare: 35000, is_active: true },
      { name: 'Lagos - Kano', origin: 'Lagos', destination: 'Kano', distance_km: 1100, estimated_duration_minutes: 780, base_fare: 35000, is_active: true },
      // Port Harcourt routes
      { name: 'Port Harcourt - Enugu', origin: 'Port Harcourt', destination: 'Enugu', distance_km: 240, estimated_duration_minutes: 180, base_fare: 8000, is_active: true },
      { name: 'Enugu - Port Harcourt', origin: 'Enugu', destination: 'Port Harcourt', distance_km: 240, estimated_duration_minutes: 180, base_fare: 8000, is_active: true },
      // Ibadan routes
      { name: 'Ibadan - Abuja', origin: 'Ibadan', destination: 'Abuja', distance_km: 540, estimated_duration_minutes: 390, base_fare: 18000, is_active: true },
      { name: 'Abuja - Ibadan', origin: 'Abuja', destination: 'Ibadan', distance_km: 540, estimated_duration_minutes: 390, base_fare: 18000, is_active: true },
    ];

    // Check if routes already exist
    const { data: existingRoutes } = await supabase.from('routes').select('name');
    const existingRouteNames = new Set(existingRoutes?.map(r => r.name) || []);
    const newRoutes = routes.filter(r => !existingRouteNames.has(r.name));
    
    if (newRoutes.length > 0) {
      const { error: routeError } = await supabase.from('routes').insert(newRoutes);
      results.push(routeError ? `Routes: Error - ${routeError.message}` : `Routes: Created ${newRoutes.length} routes`);
    } else {
      results.push(`Routes: ${routes.length} routes already exist`)
    }

    // Get created routes and buses for schedules
    const { data: createdRoutes } = await supabase.from('routes').select('id, name');
    const { data: createdBuses } = await supabase.from('buses').select('id, registration_number, capacity');

    if (createdRoutes && createdBuses && createdRoutes.length > 0 && createdBuses.length > 0) {
      // Delete existing trips and schedules to recreate fresh data
      await supabase.from('trips').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('schedules').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      results.push('Cleared old trips and schedules');

      // Create schedules for ALL routes
      const schedules: any[] = [];
      const departureTimes = ['06:00', '08:00', '10:00', '14:00', '18:00'];
      
      createdRoutes.forEach((route, routeIndex) => {
        const bus = createdBuses[routeIndex % createdBuses.length];
        departureTimes.forEach((depTime) => {
          const durationHours = Math.floor(Math.random() * 6) + 3;
          const arrHour = (parseInt(depTime.split(':')[0]) + durationHours) % 24;
          const arrTime = `${arrHour.toString().padStart(2, '0')}:00`;
          
          schedules.push({
            route_id: route.id,
            bus_id: bus.id,
            departure_time: depTime,
            arrival_time: arrTime,
            days_of_week: [0, 1, 2, 3, 4, 5, 6],
            is_active: true
          });
        });
      });

      const { error: scheduleError } = await supabase.from('schedules').insert(schedules);
      results.push(scheduleError ? `Schedules: Error - ${scheduleError.message}` : `Schedules: Created ${schedules.length} schedules for ${createdRoutes.length} routes`);

      // Get all schedules for trips
      const { data: allSchedules } = await supabase.from('schedules').select('id, route_id, bus_id, departure_time, arrival_time');
      
      if (allSchedules && allSchedules.length > 0) {
        // Create trips for next 21 days (3 weeks)
        const trips: any[] = [];
        const today = new Date();
        
        allSchedules.forEach(schedule => {
          const bus = createdBuses.find(b => b.id === schedule.bus_id);
          for (let day = 0; day < 21; day++) {
            const tripDate = new Date(today);
            tripDate.setDate(today.getDate() + day);
            
            trips.push({
              schedule_id: schedule.id,
              route_id: schedule.route_id,
              bus_id: schedule.bus_id,
              trip_date: tripDate.toISOString().split('T')[0],
              departure_time: schedule.departure_time,
              arrival_time: schedule.arrival_time,
              status: 'scheduled',
              available_seats: bus?.capacity || 18
            });
          }
        });

        const { error: tripError } = await supabase.from('trips').insert(trips);
        results.push(tripError ? `Trips: Error - ${tripError.message}` : `Trips: Created ${trips.length} trips for 21 days`);
      }
    }

    // Create inventory categories
    const categories = [
      { name: 'Engine Parts', description: 'Engine components and accessories' },
      { name: 'Brake System', description: 'Brake pads, discs, and related parts' },
      { name: 'Electrical', description: 'Batteries, alternators, starters, lights' },
      { name: 'Tires & Wheels', description: 'Tires, rims, and wheel accessories' },
      { name: 'Filters', description: 'Oil, air, fuel, and cabin filters' },
      { name: 'Fluids', description: 'Engine oil, brake fluid, coolant' },
    ];

    const { error: catError } = await supabase.from('inventory_categories').upsert(categories, { onConflict: 'name' });
    results.push(catError ? `Categories: Error - ${catError.message}` : `Categories: Created ${categories.length} categories`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Sample data created successfully!',
        results 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: String(error) }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});


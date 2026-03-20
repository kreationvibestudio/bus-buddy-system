import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface DriverDetail {
  id: string;
  user_id: string | null;
  license_number: string;
  license_expiry: string;
  status: string | null;
  address: string | null;
  date_of_birth: string | null;
  emergency_contact: string | null;
  emergency_phone: string | null;
  hire_date: string | null;
  rating: number | null;
  total_trips: number | null;
  created_at: string;
  profile: {
    full_name: string;
    email: string;
    phone: string | null;
    avatar_url: string | null;
  } | null;
}

export interface DriverTrip {
  id: string;
  trip_date: string;
  departure_time: string;
  arrival_time: string;
  actual_departure_time: string | null;
  actual_arrival_time: string | null;
  status: string | null;
  route: {
    id: string;
    name: string;
    origin: string;
    destination: string;
  } | null;
  bus: {
    id: string;
    registration_number: string;
    model: string;
  } | null;
}

export interface DriverIncident {
  id: string;
  incident_type: string;
  description: string;
  severity: string;
  status: string | null;
  reported_at: string;
  location_description: string | null;
  resolution: string | null;
  resolved_at: string | null;
  bus: {
    registration_number: string;
  } | null;
}

export function useDriverDetail(driverId: string) {
  return useQuery({
    queryKey: ['driver-detail', driverId],
    queryFn: async () => {
      // Fetch driver with profile
      const { data: driver, error: driverError } = await supabase
        .from('drivers')
        .select('*')
        .eq('id', driverId)
        .maybeSingle();

      if (driverError) throw driverError;
      if (!driver) return null;

      // Fetch profile if user_id exists
      let profile = null;
      if (driver.user_id) {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('full_name, email, phone, avatar_url')
          .eq('user_id', driver.user_id)
          .maybeSingle();

        if (profileError) throw profileError;
        profile = profileData;
      }

      return {
        ...driver,
        profile,
      } as DriverDetail;
    },
    enabled: !!driverId,
  });
}

export function useDriverTrips(driverId: string) {
  return useQuery({
    queryKey: ['driver-trips', driverId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trips')
        .select(`
          id,
          trip_date,
          departure_time,
          arrival_time,
          actual_departure_time,
          actual_arrival_time,
          status,
          route:routes(id, name, origin, destination),
          bus:buses(id, registration_number, model)
        `)
        .eq('driver_id', driverId)
        .order('trip_date', { ascending: false })
        .order('departure_time', { ascending: false })
        .limit(100);

      if (error) throw error;
      return data as DriverTrip[];
    },
    enabled: !!driverId,
  });
}

export function useDriverIncidents(driverId: string) {
  return useQuery({
    queryKey: ['driver-incidents', driverId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('incidents')
        .select(`
          id,
          incident_type,
          description,
          severity,
          status,
          reported_at,
          location_description,
          resolution,
          resolved_at,
          bus:buses(registration_number)
        `)
        .eq('driver_id', driverId)
        .order('reported_at', { ascending: false });

      if (error) throw error;
      return data as DriverIncident[];
    },
    enabled: !!driverId,
  });
}

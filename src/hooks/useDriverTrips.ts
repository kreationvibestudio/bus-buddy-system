import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface DriverTrip {
  id: string;
  trip_date: string;
  departure_time: string;
  arrival_time: string;
  actual_departure_time: string | null;
  actual_arrival_time: string | null;
  status: string | null;
  notes: string | null;
  available_seats: number | null;
  route: {
    id: string;
    name: string;
    origin: string;
    destination: string;
    distance_km: number | null;
  } | null;
  bus: {
    id: string;
    registration_number: string;
    model: string;
    capacity: number;
  } | null;
}

export function useDriverTrips(date?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['driver-trips', user?.id, date],
    queryFn: async () => {
      // First get the driver record for this user
      const { data: driverData, error: driverError } = await supabase
        .from('drivers')
        .select('id')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (driverError) throw driverError;
      if (!driverData) return [];

      // Build query for trips assigned to this driver
      let query = supabase
        .from('trips')
        .select(`
          id,
          trip_date,
          departure_time,
          arrival_time,
          actual_departure_time,
          actual_arrival_time,
          status,
          notes,
          available_seats,
          route:routes(id, name, origin, destination, distance_km),
          bus:buses(id, registration_number, model, capacity)
        `)
        .eq('driver_id', driverData.id)
        .order('trip_date', { ascending: true })
        .order('departure_time', { ascending: true });

      // Filter by date if provided
      if (date) {
        query = query.eq('trip_date', date);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as DriverTrip[];
    },
    enabled: !!user?.id,
  });
}

export function useUpcomingDriverTrips() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['driver-upcoming-trips', user?.id],
    queryFn: async () => {
      // First get the driver record for this user
      const { data: driverData, error: driverError } = await supabase
        .from('drivers')
        .select('id')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (driverError) throw driverError;
      if (!driverData) return [];

      const today = new Date().toISOString().split('T')[0];

      // Get all upcoming trips (today and future)
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
          notes,
          available_seats,
          route:routes(id, name, origin, destination, distance_km),
          bus:buses(id, registration_number, model, capacity)
        `)
        .eq('driver_id', driverData.id)
        .gte('trip_date', today)
        .neq('status', 'completed')
        .neq('status', 'cancelled')
        .order('trip_date', { ascending: true })
        .order('departure_time', { ascending: true });

      if (error) throw error;
      return data as DriverTrip[];
    },
    enabled: !!user?.id,
  });
}
export function useStartTrip() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (tripId: string) => {
      const now = new Date();
      const timeStr = now.toTimeString().slice(0, 8); // HH:MM:SS format
      
      const { data, error } = await supabase
        .from('trips')
        .update({
          status: 'in_progress',
          actual_departure_time: timeStr,
        })
        .eq('id', tripId)
        .select();

      if (error) throw error;
      return data?.[0];
    },
    onSuccess: (_data, tripId) => {
      queryClient.invalidateQueries({ queryKey: ['driver-trips'] });
      queryClient.invalidateQueries({ queryKey: ['driver-upcoming-trips'] });
      queryClient.invalidateQueries({ queryKey: ['trip-detail', tripId] });
      toast.success('Trip started successfully');
    },
    onError: (error) => {
      toast.error('Failed to start trip: ' + error.message);
    },
  });
}

export function useEndTrip() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (tripId: string) => {
      const now = new Date();
      const timeStr = now.toTimeString().slice(0, 8); // HH:MM:SS format
      
      const { data, error } = await supabase
        .from('trips')
        .update({
          status: 'completed',
          actual_arrival_time: timeStr,
        })
        .eq('id', tripId)
        .select();

      if (error) throw error;
      return data?.[0];
    },
    onSuccess: (_data, tripId) => {
      queryClient.invalidateQueries({ queryKey: ['driver-trips'] });
      queryClient.invalidateQueries({ queryKey: ['driver-upcoming-trips'] });
      queryClient.invalidateQueries({ queryKey: ['trip-detail', tripId] });
      toast.success('Trip completed successfully');
    },
    onError: (error) => {
      toast.error('Failed to end trip: ' + error.message);
    },
  });
}

export function useTripPassengers(tripId: string) {
  return useQuery({
    queryKey: ['trip-passengers', tripId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          id,
          booking_number,
          passenger_count,
          seat_numbers,
          status,
          boarding_stop:route_stops!bookings_boarding_stop_id_fkey(stop_name),
          alighting_stop:route_stops!bookings_alighting_stop_id_fkey(stop_name)
        `)
        .eq('trip_id', tripId)
        .in('status', ['confirmed', 'completed']);

      if (error) throw error;
      return data;
    },
    enabled: !!tripId,
  });
}
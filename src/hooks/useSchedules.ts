import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Schedule, Trip } from '@/types/database';
import { toast } from 'sonner';

export function useSchedules() {
  return useQuery({
    queryKey: ['schedules'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('schedules')
        .select(`
          *,
          route:routes(*),
          bus:buses(*),
          driver:drivers(*)
        `)
        .order('departure_time', { ascending: true });
      
      if (error) throw error;
      return data as Schedule[];
    },
  });
}

export function useCreateSchedule() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (schedule: Omit<Schedule, 'id' | 'created_at' | 'updated_at' | 'route' | 'bus' | 'driver'>) => {
      const { data, error } = await supabase
        .from('schedules')
        .insert(schedule)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
      toast.success('Schedule created successfully');
    },
    onError: (error) => {
      toast.error('Failed to create schedule: ' + error.message);
    },
  });
}

export function useUpdateSchedule() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...schedule }: Partial<Schedule> & { id: string }) => {
      const { data, error } = await supabase
        .from('schedules')
        .update(schedule)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
      toast.success('Schedule updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update schedule: ' + error.message);
    },
  });
}

export function useDeleteSchedule() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('schedules')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
      toast.success('Schedule deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete schedule: ' + error.message);
    },
  });
}

// Trips - fetch trips for next 30 days to avoid default 1000 row limit
export function useTrips() {
  return useQuery({
    queryKey: ['trips'],
    queryFn: async () => {
      const today = new Date();
      const thirtyDaysLater = new Date(today);
      thirtyDaysLater.setDate(today.getDate() + 30);
      
      const { data, error } = await supabase
        .from('trips')
        .select(`
          *,
          route:routes(*),
          bus:buses(*)
        `)
        .gte('trip_date', today.toISOString().split('T')[0])
        .lte('trip_date', thirtyDaysLater.toISOString().split('T')[0])
        .eq('status', 'scheduled')
        .order('trip_date', { ascending: true })
        .limit(5000);
      
      if (error) throw error;
      return data as Trip[];
    },
  });
}

// All Trips (for admin)
export function useAllTrips() {
  return useQuery({
    queryKey: ['all-trips'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trips')
        .select(`
          *,
          route:routes(*),
          bus:buses(*),
          driver:drivers(*)
        `)
        .order('trip_date', { ascending: false });
      
      if (error) throw error;
      return data as Trip[];
    },
  });
}

export function useCreateTrip() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (trip: Omit<Trip, 'id' | 'created_at' | 'updated_at' | 'route' | 'bus' | 'driver'>) => {
      const { data, error } = await supabase
        .from('trips')
        .insert(trip)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips'] });
      toast.success('Trip created successfully');
    },
    onError: (error) => {
      toast.error('Failed to create trip: ' + error.message);
    },
  });
}

export function useUpdateTrip() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...trip }: Partial<Trip> & { id: string }) => {
      const { data, error } = await supabase
        .from('trips')
        .update(trip)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips'] });
      toast.success('Trip updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update trip: ' + error.message);
    },
  });
}

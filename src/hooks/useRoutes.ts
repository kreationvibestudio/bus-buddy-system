import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Route, Station, RouteStation } from '@/types/database';
import { toast } from 'sonner';

export function useRoutes() {
  return useQuery({
    queryKey: ['routes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('routes')
        .select('*')
        .eq('is_active', true)
        .order('name', { ascending: true });
      
      if (error) throw error;
      return data as Route[];
    },
  });
}

export function useRoute(id: string) {
  return useQuery({
    queryKey: ['routes', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('routes')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      
      if (error) throw error;
      return data as Route | null;
    },
    enabled: !!id,
  });
}

export function useCreateRoute() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (route: Omit<Route, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('routes')
        .insert(route)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routes'] });
      toast.success('Route created successfully');
    },
    onError: (error) => {
      toast.error('Failed to create route: ' + error.message);
    },
  });
}

export function useUpdateRoute() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...route }: Partial<Route> & { id: string }) => {
      const { data, error } = await supabase
        .from('routes')
        .update(route)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routes'] });
      toast.success('Route updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update route: ' + error.message);
    },
  });
}

export function useDeleteRoute() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('routes')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routes'] });
      toast.success('Route deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete route: ' + error.message);
    },
  });
}

// Stations
export function useStations() {
  return useQuery({
    queryKey: ['stations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stations')
        .select('*')
        .order('name', { ascending: true });
      
      if (error) throw error;
      return data as Station[];
    },
  });
}

export function useCreateStation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (station: Omit<Station, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('stations')
        .insert(station)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stations'] });
      toast.success('Station created successfully');
    },
    onError: (error) => {
      toast.error('Failed to create station: ' + error.message);
    },
  });
}

export function useUpdateStation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...station }: Partial<Station> & { id: string }) => {
      const { data, error } = await supabase
        .from('stations')
        .update(station)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stations'] });
      toast.success('Station updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update station: ' + error.message);
    },
  });
}

export function useDeleteStation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('stations')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stations'] });
      toast.success('Station deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete station: ' + error.message);
    },
  });
}

// Route Stations
export function useRouteStations(routeId: string) {
  return useQuery({
    queryKey: ['route-stations', routeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('route_stations')
        .select(`
          *,
          station:stations(*)
        `)
        .eq('route_id', routeId)
        .order('stop_order', { ascending: true });
      
      if (error) throw error;
      return data as RouteStation[];
    },
    enabled: !!routeId,
  });
}

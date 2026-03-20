import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface State {
  id: string;
  name: string;
  code: string;
  created_at: string;
}

export function useStates() {
  return useQuery({
    queryKey: ['states'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('states')
        .select('*')
        .order('name', { ascending: true });
      
      if (error) throw error;
      return data as State[];
    },
  });
}

export function useStationsWithState() {
  return useQuery({
    queryKey: ['stations-with-state'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stations')
        .select(`
          *,
          state:states(*)
        `)
        .order('name', { ascending: true });
      
      if (error) throw error;
      
      // Normalize coordinates to numbers to prevent string issues
      return data?.map(station => ({
        ...station,
        latitude: station.latitude != null ? Number(station.latitude) : null,
        longitude: station.longitude != null ? Number(station.longitude) : null,
      })) || [];
    },
  });
}

export function useStationsByState(stateId: string | null) {
  return useQuery({
    queryKey: ['stations-by-state', stateId],
    queryFn: async () => {
      if (!stateId) return [];
      
      const { data, error } = await supabase
        .from('stations')
        .select(`
          *,
          state:states(*)
        `)
        .eq('state_id', stateId)
        .eq('is_active', true)
        .order('name', { ascending: true });
      
      if (error) throw error;
      
      // Normalize coordinates to numbers
      return data?.map(station => ({
        ...station,
        latitude: station.latitude != null ? Number(station.latitude) : null,
        longitude: station.longitude != null ? Number(station.longitude) : null,
      })) || [];
    },
    enabled: !!stateId,
  });
}

export function useCreateStationWithState() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (station: {
      name: string;
      code?: string;
      address?: string;
      city?: string;
      latitude?: number;
      longitude?: number;
      is_active?: boolean;
      state_id: string;
    }) => {
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
      queryClient.invalidateQueries({ queryKey: ['stations-with-state'] });
      queryClient.invalidateQueries({ queryKey: ['stations-by-state'] });
      toast.success('Station created successfully');
    },
    onError: (error) => {
      toast.error('Failed to create station: ' + error.message);
    },
  });
}

export function useUpdateStationWithState() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...station }: {
      id: string;
      name?: string;
      code?: string;
      address?: string;
      city?: string;
      latitude?: number;
      longitude?: number;
      is_active?: boolean;
      state_id?: string;
    }) => {
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
      queryClient.invalidateQueries({ queryKey: ['stations-with-state'] });
      queryClient.invalidateQueries({ queryKey: ['stations-by-state'] });
      toast.success('Station updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update station: ' + error.message);
    },
  });
}

export function useDeleteStationWithState() {
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
      queryClient.invalidateQueries({ queryKey: ['stations-with-state'] });
      queryClient.invalidateQueries({ queryKey: ['stations-by-state'] });
      toast.success('Station deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete station: ' + error.message);
    },
  });
}

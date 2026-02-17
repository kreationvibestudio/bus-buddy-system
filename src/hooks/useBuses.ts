import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Bus } from '@/types/database';
import { toast } from 'sonner';

export function useBuses() {
  return useQuery({
    queryKey: ['buses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('buses')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Bus[];
    },
  });
}

export function useBus(id: string) {
  return useQuery({
    queryKey: ['buses', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('buses')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      
      if (error) throw error;
      return data as Bus | null;
    },
    enabled: !!id,
  });
}

export function useCreateBus() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (bus: Omit<Bus, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('buses')
        .insert(bus)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buses'] });
      toast.success('Bus added successfully');
    },
    onError: (error) => {
      toast.error('Failed to add bus: ' + error.message);
    },
  });
}

export function useUpdateBus() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...bus }: Partial<Bus> & { id: string }) => {
      const { data, error } = await supabase
        .from('buses')
        .update(bus)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buses'] });
      toast.success('Bus updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update bus: ' + error.message);
    },
  });
}

export function useDeleteBus() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('buses')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buses'] });
      toast.success('Bus deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete bus: ' + error.message);
    },
  });
}

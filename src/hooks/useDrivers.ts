import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Driver } from '@/types/database';
import { toast } from 'sonner';

export interface DriverWithProfile extends Omit<Driver, 'profile'> {
  profile?: {
    full_name: string;
    email: string;
    phone: string | null;
  } | null;
}

export function useDrivers() {
  return useQuery({
    queryKey: ['drivers'],
    queryFn: async () => {
      // Fetch drivers
      const { data: drivers, error: driversError } = await supabase
        .from('drivers')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (driversError) throw driversError;
      
      // Fetch profiles for drivers that have user_ids
      const userIds = drivers
        .map(d => d.user_id)
        .filter((id): id is string => id !== null);
      
      let profiles: { user_id: string; full_name: string; email: string; phone: string | null }[] = [];
      
      if (userIds.length > 0) {
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('user_id, full_name, email, phone')
          .in('user_id', userIds);
        
        if (profilesError) throw profilesError;
        profiles = profilesData || [];
      }
      
      // Combine drivers with profiles
      const driversWithProfiles: DriverWithProfile[] = drivers.map(driver => {
        const profile = driver.user_id 
          ? profiles.find(p => p.user_id === driver.user_id) 
          : null;
        return {
          ...driver,
          profile: profile || null,
        };
      });
      
      return driversWithProfiles;
    },
  });
}

export function useDriver(id: string) {
  return useQuery({
    queryKey: ['drivers', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('drivers')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      
      if (error) throw error;
      return data as Driver | null;
    },
    enabled: !!id,
  });
}

export function useCreateDriver() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (driver: Omit<Driver, 'id' | 'created_at' | 'updated_at' | 'profile'>) => {
      const { data, error } = await supabase
        .from('drivers')
        .insert(driver)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      toast.success('Driver added successfully');
    },
    onError: (error) => {
      toast.error('Failed to add driver: ' + error.message);
    },
  });
}

export function useUpdateDriver() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...driver }: Partial<Driver> & { id: string }) => {
      const { data, error } = await supabase
        .from('drivers')
        .update(driver)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      toast.success('Driver updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update driver: ' + error.message);
    },
  });
}

export function useDeleteDriver() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('drivers')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      toast.success('Driver deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete driver: ' + error.message);
    },
  });
}

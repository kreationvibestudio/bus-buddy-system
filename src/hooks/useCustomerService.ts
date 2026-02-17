import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Complaint, Incident } from '@/types/database';
import { toast } from 'sonner';

// Complaints
export function useComplaints() {
  return useQuery({
    queryKey: ['complaints'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('complaints')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Complaint[];
    },
  });
}

export function useMyComplaints() {
  return useQuery({
    queryKey: ['my-complaints'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      
      const { data, error } = await supabase
        .from('complaints')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Complaint[];
    },
  });
}

export function useCreateComplaint() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (complaint: Omit<Complaint, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('complaints')
        .insert(complaint)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['complaints'] });
      queryClient.invalidateQueries({ queryKey: ['my-complaints'] });
      toast.success('Complaint submitted successfully');
    },
    onError: (error) => {
      toast.error('Failed to submit complaint: ' + error.message);
    },
  });
}

export function useUpdateComplaint() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...complaint }: Partial<Complaint> & { id: string }) => {
      const { data, error } = await supabase
        .from('complaints')
        .update(complaint)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['complaints'] });
      toast.success('Complaint updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update complaint: ' + error.message);
    },
  });
}

// Incidents
export function useIncidents() {
  return useQuery({
    queryKey: ['incidents'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('incidents')
        .select(`
          *,
          driver:drivers(*),
          bus:buses(*)
        `)
        .order('reported_at', { ascending: false });
      
      if (error) throw error;
      return data as Incident[];
    },
  });
}

export function useMyIncidents() {
  return useQuery({
    queryKey: ['my-incidents'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      
      // First get the driver record for this user
      const { data: driver } = await supabase
        .from('drivers')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (!driver) return [];
      
      const { data, error } = await supabase
        .from('incidents')
        .select(`
          *,
          bus:buses(*)
        `)
        .eq('driver_id', driver.id)
        .order('reported_at', { ascending: false });
      
      if (error) throw error;
      return data as Incident[];
    },
  });
}

export function useCreateIncident() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (incident: Omit<Incident, 'id' | 'created_at' | 'updated_at' | 'driver' | 'bus'>) => {
      const { data, error } = await supabase
        .from('incidents')
        .insert(incident)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incidents'] });
      queryClient.invalidateQueries({ queryKey: ['my-incidents'] });
      toast.success('Incident reported successfully');
    },
    onError: (error) => {
      toast.error('Failed to report incident: ' + error.message);
    },
  });
}

export function useUpdateIncident() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...incident }: Partial<Incident> & { id: string }) => {
      const { data, error } = await supabase
        .from('incidents')
        .update(incident)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incidents'] });
      toast.success('Incident updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update incident: ' + error.message);
    },
  });
}

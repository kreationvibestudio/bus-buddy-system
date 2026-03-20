import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface Incident {
  id: string;
  incident_type: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: string | null;
  reported_at: string;
  location_description: string | null;
  latitude: number | null;
  longitude: number | null;
  resolution: string | null;
  resolved_at: string | null;
  bus: {
    registration_number: string;
    model: string;
  } | null;
  trip: {
    id: string;
    route: {
      name: string;
    } | null;
  } | null;
}

export interface CreateIncidentData {
  incident_type: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  bus_id?: string;
  trip_id?: string;
  location_description?: string;
  latitude?: number;
  longitude?: number;
}

export function useDriverIncidents() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['driver-incidents', user?.id],
    queryFn: async () => {
      // Get driver ID first
      const { data: driverData, error: driverError } = await supabase
        .from('drivers')
        .select('id')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (driverError) throw driverError;
      if (!driverData) return [];

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
          latitude,
          longitude,
          resolution,
          resolved_at,
          bus:buses(registration_number, model),
          trip:trips(id, route:routes(name))
        `)
        .eq('driver_id', driverData.id)
        .order('reported_at', { ascending: false });

      if (error) throw error;
      return data as Incident[];
    },
    enabled: !!user?.id,
  });
}

export function useCreateIncident() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (incident: CreateIncidentData) => {
      // Get driver ID first
      const { data: driverData, error: driverError } = await supabase
        .from('drivers')
        .select('id')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (driverError) throw driverError;
      if (!driverData) throw new Error('Driver profile not found');

      const { data, error } = await supabase
        .from('incidents')
        .insert({
          ...incident,
          driver_id: driverData.id,
          status: 'reported',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['driver-incidents'] });
      toast.success('Incident reported successfully');
    },
    onError: (error) => {
      toast.error('Failed to report incident: ' + error.message);
    },
  });
}
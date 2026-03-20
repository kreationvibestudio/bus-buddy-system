import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { Json } from '@/integrations/supabase/types';

export type JobCardStatus = 'draft' | 'inspection_complete' | 'in_progress' | 'awaiting_parts' | 'completed' | 'closed';
export type FaultRepairStatus = 'pending' | 'in_progress' | 'completed' | 'deferred';

export interface JobCard {
  id: string;
  job_card_number: string;
  bus_id: string;
  driver_id: string | null;
  mechanic_id: string;
  odometer_reading: number;
  reason_for_visit: string;
  customer_complaint: string | null;
  status: JobCardStatus;
  priority: string;
  estimated_completion: string | null;
  actual_completion: string | null;
  total_labor_hours: number;
  total_cost: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
  buses?: {
    registration_number: string;
    model: string;
    manufacturer: string | null;
  };
  drivers?: {
    id: string;
    user_id: string | null;
    profiles?: {
      full_name: string;
    };
  } | null;
}

export interface TireCondition {
  condition: 'good' | 'fair' | 'poor' | 'needs_replacement';
  tread_depth: string;
  pressure: string;
}

export interface FluidLevels {
  oil: 'ok' | 'low' | 'critical';
  coolant: 'ok' | 'low' | 'critical';
  brake_fluid: 'ok' | 'low' | 'critical';
  power_steering: 'ok' | 'low' | 'critical';
  windshield_washer: 'ok' | 'low' | 'critical';
}

export interface VehicleInspection {
  id: string;
  job_card_id: string;
  inspection_type: string;
  fuel_level: string | null;
  exterior_condition: Json;
  interior_condition: string | null;
  tire_front_left: TireCondition;
  tire_front_right: TireCondition;
  tire_rear_left: TireCondition;
  tire_rear_right: TireCondition;
  spare_tire: { present: boolean; condition: string };
  lights_working: boolean;
  horn_working: boolean;
  wipers_working: boolean;
  mirrors_condition: string | null;
  battery_condition: string | null;
  fluid_levels: FluidLevels;
  personal_items: string | null;
  inspected_by: string;
  inspected_at: string;
  photos: Json;
  notes: string | null;
  created_at: string;
}

export interface JobCardFault {
  id: string;
  job_card_id: string;
  fault_code: string | null;
  fault_category: string;
  description: string;
  severity: string;
  diagnosis: string | null;
  repair_action: string | null;
  repair_status: FaultRepairStatus;
  labor_hours: number;
  parts_used: Json;
  logged_by: string;
  created_at: string;
  updated_at: string;
}

export interface CreateJobCardInput {
  bus_id: string;
  driver_id?: string | null;
  odometer_reading: number;
  reason_for_visit: string;
  customer_complaint?: string;
  priority?: string;
  estimated_completion?: string;
  notes?: string;
}

export interface CreateInspectionInput {
  job_card_id: string;
  inspection_type?: string;
  fuel_level?: string;
  exterior_condition?: Record<string, unknown>;
  interior_condition?: string;
  tire_front_left?: TireCondition;
  tire_front_right?: TireCondition;
  tire_rear_left?: TireCondition;
  tire_rear_right?: TireCondition;
  spare_tire?: { present: boolean; condition: string };
  lights_working?: boolean;
  horn_working?: boolean;
  wipers_working?: boolean;
  mirrors_condition?: string;
  battery_condition?: string;
  fluid_levels?: FluidLevels;
  personal_items?: string;
  notes?: string;
}

export interface CreateFaultInput {
  job_card_id: string;
  fault_code?: string;
  fault_category: string;
  description: string;
  severity?: string;
  diagnosis?: string;
  repair_action?: string;
  labor_hours?: number;
}

// Fetch all job cards
export function useJobCards() {
  return useQuery({
    queryKey: ['job-cards'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('job_cards')
        .select(`
          *,
          buses (registration_number, model, manufacturer),
          drivers (id, user_id)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as unknown as JobCard[];
    },
  });
}

// Fetch job cards for current mechanic
export function useMyJobCards() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['my-job-cards', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('job_cards')
        .select(`
          *,
          buses (registration_number, model, manufacturer),
          drivers (id, user_id)
        `)
        .eq('mechanic_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as unknown as JobCard[];
    },
    enabled: !!user?.id,
  });
}

// Fetch single job card with details
export function useJobCard(jobCardId: string | null) {
  return useQuery({
    queryKey: ['job-card', jobCardId],
    queryFn: async () => {
      if (!jobCardId) return null;
      
      const { data, error } = await supabase
        .from('job_cards')
        .select(`
          *,
          buses (registration_number, model, manufacturer, mileage),
          drivers (id, user_id)
        `)
        .eq('id', jobCardId)
        .single();

      if (error) throw error;
      return data as unknown as JobCard;
    },
    enabled: !!jobCardId,
  });
}

// Create job card
export function useCreateJobCard() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: CreateJobCardInput) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('job_cards')
        .insert({
          ...input,
          mechanic_id: user.id,
          job_card_number: '', // Will be generated by trigger
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job-cards'] });
      queryClient.invalidateQueries({ queryKey: ['my-job-cards'] });
      toast.success('Job card created successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to create job card: ' + error.message);
    },
  });
}

// Update job card
export function useUpdateJobCard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<CreateJobCardInput> & { status?: JobCardStatus }) => {
      const { data, error } = await supabase
        .from('job_cards')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['job-cards'] });
      queryClient.invalidateQueries({ queryKey: ['my-job-cards'] });
      queryClient.invalidateQueries({ queryKey: ['job-card', data.id] });
      toast.success('Job card updated successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to update job card: ' + error.message);
    },
  });
}

// Fetch inspections for a job card
export function useVehicleInspections(jobCardId: string | null) {
  return useQuery({
    queryKey: ['vehicle-inspections', jobCardId],
    queryFn: async () => {
      if (!jobCardId) return [];
      
      const { data, error } = await supabase
        .from('vehicle_inspections')
        .select('*')
        .eq('job_card_id', jobCardId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data.map(item => ({
        ...item,
        tire_front_left: item.tire_front_left as unknown as TireCondition,
        tire_front_right: item.tire_front_right as unknown as TireCondition,
        tire_rear_left: item.tire_rear_left as unknown as TireCondition,
        tire_rear_right: item.tire_rear_right as unknown as TireCondition,
        spare_tire: item.spare_tire as unknown as { present: boolean; condition: string },
        fluid_levels: item.fluid_levels as unknown as FluidLevels,
      })) as VehicleInspection[];
    },
    enabled: !!jobCardId,
  });
}

// Create inspection
export function useCreateInspection() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: CreateInspectionInput) => {
      if (!user?.id) throw new Error('User not authenticated');

      const insertData = {
        job_card_id: input.job_card_id,
        inspection_type: input.inspection_type || 'pre_work',
        fuel_level: input.fuel_level,
        exterior_condition: input.exterior_condition || {},
        interior_condition: input.interior_condition,
        tire_front_left: input.tire_front_left || { condition: 'good', tread_depth: '', pressure: '' },
        tire_front_right: input.tire_front_right || { condition: 'good', tread_depth: '', pressure: '' },
        tire_rear_left: input.tire_rear_left || { condition: 'good', tread_depth: '', pressure: '' },
        tire_rear_right: input.tire_rear_right || { condition: 'good', tread_depth: '', pressure: '' },
        spare_tire: input.spare_tire || { present: true, condition: 'good' },
        lights_working: input.lights_working,
        horn_working: input.horn_working,
        wipers_working: input.wipers_working,
        mirrors_condition: input.mirrors_condition,
        battery_condition: input.battery_condition,
        fluid_levels: input.fluid_levels || { oil: 'ok', coolant: 'ok', brake_fluid: 'ok', power_steering: 'ok', windshield_washer: 'ok' },
        personal_items: input.personal_items,
        notes: input.notes,
        inspected_by: user.id,
      };

      const { data, error } = await supabase
        .from('vehicle_inspections')
        .insert(insertData as never)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['vehicle-inspections', data.job_card_id] });
      toast.success('Inspection saved successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to save inspection: ' + error.message);
    },
  });
}

// Fetch faults for a job card
export function useJobCardFaults(jobCardId: string | null) {
  return useQuery({
    queryKey: ['job-card-faults', jobCardId],
    queryFn: async () => {
      if (!jobCardId) return [];
      
      const { data, error } = await supabase
        .from('job_card_faults')
        .select('*')
        .eq('job_card_id', jobCardId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as unknown as JobCardFault[];
    },
    enabled: !!jobCardId,
  });
}

// Create fault
export function useCreateFault() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: CreateFaultInput) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('job_card_faults')
        .insert({
          ...input,
          logged_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['job-card-faults', data.job_card_id] });
      toast.success('Fault logged successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to log fault: ' + error.message);
    },
  });
}

// Update fault
export function useUpdateFault() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, job_card_id, ...updates }: { id: string; job_card_id: string } & Partial<CreateFaultInput> & { repair_status?: FaultRepairStatus; repair_action?: string; diagnosis?: string }) => {
      const { data, error } = await supabase
        .from('job_card_faults')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { ...data, job_card_id };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['job-card-faults', data.job_card_id] });
      toast.success('Fault updated successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to update fault: ' + error.message);
    },
  });
}

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { differenceInDays, isPast, isFuture, isToday, parseISO } from 'date-fns';

export interface DriverLeave {
  id: string;
  driver_id: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  reason: string | null;
  status: string;
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
  driver?: {
    id: string;
    user_id: string | null;
    profile?: {
      full_name: string;
      email: string;
    } | null;
  } | null;
}

export interface LeaveWithDetails extends DriverLeave {
  days_total: number;
  days_remaining: number;
  is_active: boolean;
  is_upcoming: boolean;
  is_expired: boolean;
}

// Calculate leave details
export function calculateLeaveDetails(leave: DriverLeave): LeaveWithDetails {
  const startDate = parseISO(leave.start_date);
  const endDate = parseISO(leave.end_date);
  const today = new Date();
  
  const days_total = differenceInDays(endDate, startDate) + 1;
  const days_remaining = isPast(endDate) ? 0 : Math.max(0, differenceInDays(endDate, today) + 1);
  
  const is_active = leave.status === 'approved' && 
    (isToday(startDate) || isPast(startDate)) && 
    (isToday(endDate) || isFuture(endDate));
  
  const is_upcoming = leave.status === 'approved' && isFuture(startDate);
  const is_expired = isPast(endDate);
  
  return {
    ...leave,
    days_total,
    days_remaining,
    is_active,
    is_upcoming,
    is_expired,
  };
}

// Fetch all leaves (for admin/staff)
export function useDriverLeaves() {
  return useQuery({
    queryKey: ['driver-leaves'],
    queryFn: async () => {
      // First fetch leaves with driver info
      const { data: leaves, error: leavesError } = await supabase
        .from('driver_leaves')
        .select(`
          *,
          driver:drivers(id, user_id)
        `)
        .order('created_at', { ascending: false });

      if (leavesError) throw leavesError;
      
      // Get unique user_ids from drivers
      const userIds = [...new Set((leaves || [])
        .map((l: any) => l.driver?.user_id)
        .filter(Boolean))];
      
      // Fetch profiles for those users
      let profilesMap: Record<string, any> = {};
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, full_name, email')
          .in('user_id', userIds);
        
        profilesMap = (profiles || []).reduce((acc: any, p: any) => {
          acc[p.user_id] = p;
          return acc;
        }, {});
      }
      
      return (leaves || []).map((leave: any) => calculateLeaveDetails({
        ...leave,
        driver: leave.driver ? {
          ...leave.driver,
          profile: leave.driver.user_id ? profilesMap[leave.driver.user_id] : null
        } : null
      }));
    },
  });
}

// Fetch leaves for a specific driver
export function useDriverLeavesById(driverId: string) {
  return useQuery({
    queryKey: ['driver-leaves', driverId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('driver_leaves')
        .select('*')
        .eq('driver_id', driverId)
        .order('start_date', { ascending: false });

      if (error) throw error;
      
      return (data || []).map(leave => calculateLeaveDetails(leave));
    },
    enabled: !!driverId,
  });
}

// Get active leave for a driver
export function useActiveLeave(driverId: string) {
  return useQuery({
    queryKey: ['active-leave', driverId],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('driver_leaves')
        .select('*')
        .eq('driver_id', driverId)
        .eq('status', 'approved')
        .lte('start_date', today)
        .gte('end_date', today)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
      
      return data ? calculateLeaveDetails(data) : null;
    },
    enabled: !!driverId,
  });
}

// Get upcoming leaves (expiring soon) for dashboard alerts
export function useExpiringLeaves(daysAhead: number = 3) {
  return useQuery({
    queryKey: ['expiring-leaves', daysAhead],
    queryFn: async () => {
      const today = new Date();
      const futureDate = new Date();
      futureDate.setDate(today.getDate() + daysAhead);
      
      const { data: leaves, error: leavesError } = await supabase
        .from('driver_leaves')
        .select(`
          *,
          driver:drivers(id, user_id)
        `)
        .eq('status', 'approved')
        .gte('end_date', today.toISOString().split('T')[0])
        .lte('end_date', futureDate.toISOString().split('T')[0])
        .order('end_date', { ascending: true });

      if (leavesError) throw leavesError;
      
      // Get unique user_ids from drivers
      const userIds = [...new Set((leaves || [])
        .map((l: any) => l.driver?.user_id)
        .filter(Boolean))];
      
      // Fetch profiles for those users
      let profilesMap: Record<string, any> = {};
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, full_name, email')
          .in('user_id', userIds);
        
        profilesMap = (profiles || []).reduce((acc: any, p: any) => {
          acc[p.user_id] = p;
          return acc;
        }, {});
      }
      
      return (leaves || []).map((leave: any) => calculateLeaveDetails({
        ...leave,
        driver: leave.driver ? {
          ...leave.driver,
          profile: leave.driver.user_id ? profilesMap[leave.driver.user_id] : null
        } : null
      }));
    },
  });
}

// Get drivers currently on leave
export function useDriversOnLeave() {
  return useQuery({
    queryKey: ['drivers-on-leave'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      
      const { data: leaves, error: leavesError } = await supabase
        .from('driver_leaves')
        .select(`
          *,
          driver:drivers(id, user_id)
        `)
        .eq('status', 'approved')
        .lte('start_date', today)
        .gte('end_date', today);

      if (leavesError) throw leavesError;
      
      // Get unique user_ids from drivers
      const userIds = [...new Set((leaves || [])
        .map((l: any) => l.driver?.user_id)
        .filter(Boolean))];
      
      // Fetch profiles for those users
      let profilesMap: Record<string, any> = {};
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, full_name, email')
          .in('user_id', userIds);
        
        profilesMap = (profiles || []).reduce((acc: any, p: any) => {
          acc[p.user_id] = p;
          return acc;
        }, {});
      }
      
      return (leaves || []).map((leave: any) => calculateLeaveDetails({
        ...leave,
        driver: leave.driver ? {
          ...leave.driver,
          profile: leave.driver.user_id ? profilesMap[leave.driver.user_id] : null
        } : null
      }));
    },
  });
}

// Create a new leave request
export function useCreateLeave() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      driver_id: string;
      leave_type: string;
      start_date: string;
      end_date: string;
      reason?: string;
      status?: string;
    }) => {
      const { data: result, error } = await supabase
        .from('driver_leaves')
        .insert(data)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['driver-leaves'] });
      queryClient.invalidateQueries({ queryKey: ['drivers-on-leave'] });
      queryClient.invalidateQueries({ queryKey: ['expiring-leaves'] });
      toast.success('Leave request created successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to create leave request: ' + error.message);
    },
  });
}

// Approve/Reject leave
export function useUpdateLeaveStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      leaveId, 
      status, 
      approvedBy 
    }: { 
      leaveId: string; 
      status: 'approved' | 'rejected'; 
      approvedBy: string;
    }) => {
      const updateData: any = { status };
      
      if (status === 'approved') {
        updateData.approved_by = approvedBy;
        updateData.approved_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('driver_leaves')
        .update(updateData)
        .eq('id', leaveId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['driver-leaves'] });
      queryClient.invalidateQueries({ queryKey: ['drivers-on-leave'] });
      queryClient.invalidateQueries({ queryKey: ['expiring-leaves'] });
      toast.success(`Leave ${variables.status} successfully`);
    },
    onError: (error: Error) => {
      toast.error('Failed to update leave status: ' + error.message);
    },
  });
}

// Delete leave request
export function useDeleteLeave() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (leaveId: string) => {
      const { error } = await supabase
        .from('driver_leaves')
        .delete()
        .eq('id', leaveId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['driver-leaves'] });
      queryClient.invalidateQueries({ queryKey: ['drivers-on-leave'] });
      queryClient.invalidateQueries({ queryKey: ['expiring-leaves'] });
      toast.success('Leave request deleted');
    },
    onError: (error: Error) => {
      toast.error('Failed to delete leave: ' + error.message);
    },
  });
}

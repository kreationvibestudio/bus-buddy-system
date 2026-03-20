import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Transaction, Payroll } from '@/types/database';
import { toast } from 'sonner';

// Transactions
export function useTransactions() {
  return useQuery({
    queryKey: ['transactions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('date', { ascending: false });
      
      if (error) throw error;
      return data as Transaction[];
    },
  });
}

export function useCreateTransaction() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (transaction: Omit<Transaction, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('transactions')
        .insert(transaction)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      toast.success('Transaction recorded successfully');
    },
    onError: (error) => {
      toast.error('Failed to record transaction: ' + error.message);
    },
  });
}

// Payroll
export function usePayrolls() {
  return useQuery({
    queryKey: ['payrolls'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payroll')
        .select(`
          *,
          driver:drivers(*)
        `)
        .order('period_start', { ascending: false });
      
      if (error) throw error;
      return data as Payroll[];
    },
  });
}

export function useMyPayrolls() {
  return useQuery({
    queryKey: ['my-payrolls'],
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
        .from('payroll')
        .select('*')
        .eq('driver_id', driver.id)
        .order('period_start', { ascending: false });
      
      if (error) throw error;
      return data as Payroll[];
    },
  });
}

export function useCreatePayroll() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (payroll: Omit<Payroll, 'id' | 'created_at' | 'driver'>) => {
      const { data, error } = await supabase
        .from('payroll')
        .insert(payroll)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payrolls'] });
      toast.success('Payroll record created');
    },
    onError: (error) => {
      toast.error('Failed to create payroll: ' + error.message);
    },
  });
}

export function useUpdatePayroll() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...payroll }: Partial<Payroll> & { id: string }) => {
      const { data, error } = await supabase
        .from('payroll')
        .update(payroll)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payrolls'] });
      toast.success('Payroll updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update payroll: ' + error.message);
    },
  });
}

// Dashboard Stats
export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const [busesResult, driversResult, routesResult, bookingsResult, tripsResult] = await Promise.all([
        supabase.from('buses').select('id, status', { count: 'exact' }),
        supabase.from('drivers').select('id, status', { count: 'exact' }),
        supabase.from('routes').select('id, is_active', { count: 'exact' }),
        supabase.from('bookings').select('id, status, total_fare', { count: 'exact' }),
        supabase.from('trips').select('id, status, trip_date', { count: 'exact' }),
      ]);
      
      const buses = busesResult.data || [];
      const drivers = driversResult.data || [];
      const routes = routesResult.data || [];
      const bookings = bookingsResult.data || [];
      const trips = tripsResult.data || [];
      
      const today = new Date().toISOString().split('T')[0];
      const todayTrips = trips.filter(t => t.trip_date === today);
      const totalRevenue = bookings
        .filter(b => b.status === 'confirmed' || b.status === 'completed')
        .reduce((sum, b) => sum + (Number(b.total_fare) || 0), 0);
      
      return {
        totalBuses: buses.length,
        activeBuses: buses.filter(b => b.status === 'active').length,
        totalDrivers: drivers.length,
        activeDrivers: drivers.filter(d => d.status === 'active').length,
        totalRoutes: routes.length,
        activeRoutes: routes.filter(r => r.is_active).length,
        totalBookings: bookings.length,
        confirmedBookings: bookings.filter(b => b.status === 'confirmed').length,
        todayTrips: todayTrips.length,
        totalRevenue,
      };
    },
  });
}

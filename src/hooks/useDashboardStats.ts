import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { addDays } from 'date-fns';

export interface DashboardStats {
  totalBuses: number;
  activeBuses: number;
  totalDrivers: number;
  activeDrivers: number;
  driversOnLeave: number;
  activeRoutes: number;
  todaysBookings: number;
}

export interface DashboardAlert {
  id: string;
  type: 'warning' | 'error' | 'info';
  title: string;
  description: string;
  link?: string;
}

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      // Fetch all counts in parallel
      const [
        busesResult,
        driversResult,
        routesResult,
        bookingsResult,
        driversOnLeaveResult,
      ] = await Promise.all([
        supabase.from('buses').select('id, status'),
        supabase.from('drivers').select('id, status'),
        supabase.from('routes').select('id').eq('is_active', true),
        supabase.from('bookings').select('id').gte('booked_at', new Date().toISOString().split('T')[0]),
        // Get drivers currently on leave
        (async () => {
          const today = new Date().toISOString().split('T')[0];
          const { data, error } = await supabase
            .from('driver_leaves')
            .select('id')
            .eq('status', 'approved')
            .lte('start_date', today)
            .gte('end_date', today);
          return { data, error };
        })(),
      ]);

      const buses = busesResult.data || [];
      const drivers = driversResult.data || [];
      const routes = routesResult.data || [];
      const bookings = bookingsResult.data || [];
      const driversOnLeave = driversOnLeaveResult.data || [];

      const stats: DashboardStats = {
        totalBuses: buses.length,
        activeBuses: buses.filter(b => b.status === 'active').length,
        totalDrivers: drivers.length,
        activeDrivers: drivers.filter(d => d.status === 'active').length,
        driversOnLeave: driversOnLeave.length,
        activeRoutes: routes.length,
        todaysBookings: bookings.length,
      };

      return stats;
    },
    refetchInterval: 60000, // Refresh every minute
  });
}

export function useDashboardAlerts() {
  return useQuery({
    queryKey: ['dashboard-alerts'],
    queryFn: async () => {
      const alerts: DashboardAlert[] = [];
      const today = new Date();
      const thirtyDaysFromNow = addDays(today, 30);
      const sevenDaysFromNow = addDays(today, 7);

      // 1. Check for buses due for maintenance
      const { data: busesForMaintenance } = await supabase
        .from('buses')
        .select('id, registration_number, next_maintenance_date')
        .lte('next_maintenance_date', sevenDaysFromNow.toISOString().split('T')[0])
        .gte('next_maintenance_date', today.toISOString().split('T')[0]);

      if (busesForMaintenance && busesForMaintenance.length > 0) {
        alerts.push({
          id: 'maintenance-due',
          type: 'warning',
          title: `${busesForMaintenance.length} bus${busesForMaintenance.length > 1 ? 'es' : ''} due for maintenance`,
          description: 'Schedule service within 7 days',
          link: '/maintenance',
        });
      }

      // 2. Check for expiring driver licenses
      const { data: expiringLicenses } = await supabase
        .from('drivers')
        .select('id, license_number, license_expiry')
        .lte('license_expiry', thirtyDaysFromNow.toISOString().split('T')[0])
        .gte('license_expiry', today.toISOString().split('T')[0]);

      if (expiringLicenses && expiringLicenses.length > 0) {
        alerts.push({
          id: 'license-expiring',
          type: 'error',
          title: `${expiringLicenses.length} driver license${expiringLicenses.length > 1 ? 's' : ''} expiring`,
          description: 'Renewal required by month end',
          link: '/drivers',
        });
      }

      // 3. Check for expired licenses
      const { data: expiredLicenses } = await supabase
        .from('drivers')
        .select('id')
        .lt('license_expiry', today.toISOString().split('T')[0]);

      if (expiredLicenses && expiredLicenses.length > 0) {
        alerts.push({
          id: 'license-expired',
          type: 'error',
          title: `${expiredLicenses.length} driver license${expiredLicenses.length > 1 ? 's' : ''} expired`,
          description: 'Immediate action required',
          link: '/drivers',
        });
      }

      // 4. Check for leaves ending soon
      const threeDaysFromNow = addDays(today, 3);
      const { data: expiringLeaves } = await supabase
        .from('driver_leaves')
        .select(`
          id,
          end_date,
          driver_id
        `)
        .eq('status', 'approved')
        .lte('end_date', threeDaysFromNow.toISOString().split('T')[0])
        .gte('end_date', today.toISOString().split('T')[0]);

      if (expiringLeaves && expiringLeaves.length > 0) {
        alerts.push({
          id: 'leave-expiring',
          type: 'info',
          title: `${expiringLeaves.length} driver leave${expiringLeaves.length > 1 ? 's' : ''} ending soon`,
          description: 'Check driver management for details',
          link: '/drivers',
        });
      }

      // 5. Check for drivers currently on leave
      const todayStr = today.toISOString().split('T')[0];
      const { data: onLeave } = await supabase
        .from('driver_leaves')
        .select(`
          id,
          start_date,
          end_date,
          driver_id
        `)
        .eq('status', 'approved')
        .lte('start_date', todayStr)
        .gte('end_date', todayStr);

      if (onLeave && onLeave.length > 0) {
        alerts.push({
          id: 'drivers-on-leave',
          type: 'info',
          title: `${onLeave.length} driver${onLeave.length > 1 ? 's' : ''} currently on leave`,
          description: 'Check driver management for details',
          link: '/drivers',
        });
      }

      // 6. Check for low inventory
      const { data: lowStock } = await supabase
        .from('inventory_items')
        .select('id, name, quantity, min_quantity')
        .not('min_quantity', 'is', null);

      const lowStockItems = lowStock?.filter(item => 
        item.quantity <= (item.min_quantity || 0)
      ) || [];

      if (lowStockItems.length > 0) {
        alerts.push({
          id: 'low-inventory',
          type: 'warning',
          title: `${lowStockItems.length} item${lowStockItems.length > 1 ? 's' : ''} below minimum stock`,
          description: 'Restock required',
          link: '/inventory',
        });
      }

      // 7. Check for pending leave requests
      const { data: pendingLeaves } = await supabase
        .from('driver_leaves')
        .select('id')
        .eq('status', 'pending');

      if (pendingLeaves && pendingLeaves.length > 0) {
        alerts.push({
          id: 'pending-leaves',
          type: 'warning',
          title: `${pendingLeaves.length} pending leave request${pendingLeaves.length > 1 ? 's' : ''}`,
          description: 'Requires approval',
          link: '/drivers',
        });
      }

      return alerts;
    },
    refetchInterval: 60000, // Refresh every minute
  });
}

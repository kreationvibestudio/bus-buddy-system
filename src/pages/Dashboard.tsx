import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bus, Users, Route, Ticket, TrendingUp, AlertTriangle } from 'lucide-react';
import { PendingApprovalsWidget } from '@/components/dashboard/PendingApprovalsWidget';
import { MechanicDashboard } from '@/components/dashboard/MechanicDashboard';
import { DriverDashboard } from '@/components/dashboard/DriverDashboard';
import { PassengerDashboard } from '@/components/dashboard/PassengerDashboard';
import { useDashboardStats, useDashboardAlerts } from '@/hooks/useDashboardStats';
import { Skeleton } from '@/components/ui/skeleton';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const { profile, role } = useAuth();
  const navigate = useNavigate();
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: alerts, isLoading: alertsLoading } = useDashboardAlerts();

  // Show mechanic-specific dashboard
  if (role === 'mechanic') {
    return <MechanicDashboard />;
  }

  // Show driver-specific dashboard
  if (role === 'driver') {
    return <DriverDashboard />;
  }

  // Show passenger-specific dashboard
  if (role === 'passenger') {
    return <PassengerDashboard />;
  }

  const statCards = [
    { 
      title: 'Total Buses', 
      value: stats?.totalBuses.toString() || '0', 
      icon: Bus, 
      color: 'text-primary', 
      change: `${stats?.activeBuses || 0} active` 
    },
    { 
      title: 'Active Drivers', 
      value: stats?.activeDrivers.toString() || '0', 
      icon: Users, 
      color: 'text-success', 
      change: `${stats?.driversOnLeave || 0} on leave` 
    },
    { 
      title: 'Active Routes', 
      value: stats?.activeRoutes.toString() || '0', 
      icon: Route, 
      color: 'text-info', 
      change: 'Currently running' 
    },
    { 
      title: "Today's Bookings", 
      value: stats?.todaysBookings.toString() || '0', 
      icon: Ticket, 
      color: 'text-warning', 
      change: 'New bookings today' 
    },
  ];

  // Default dashboard for other roles
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-display font-bold">
          Welcome back, {profile?.full_name?.split(' ')[0] || 'User'}!
        </h1>
        <p className="text-muted-foreground mt-1">
          Here's what's happening with your fleet today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.title} className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <>
                  <div className="text-3xl font-bold">{stat.value}</div>
                  <p className="text-xs text-muted-foreground mt-1">{stat.change}</p>
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pending Approvals Widget - for admin and storekeeper */}
      <PendingApprovalsWidget />

      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Activity - placeholder for now */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Recent Activity
            </CardTitle>
            <CardDescription>Latest updates from your fleet</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground text-center py-4">
                Activity feed coming soon
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              Alerts & Reminders
            </CardTitle>
            <CardDescription>Items requiring attention</CardDescription>
          </CardHeader>
          <CardContent>
            {alertsLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : alerts && alerts.length > 0 ? (
              <div className="space-y-3">
                {alerts.map((alert) => (
                  <div 
                    key={alert.id} 
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      alert.type === 'warning' 
                        ? 'bg-warning/10 border border-warning/20 hover:bg-warning/20' 
                        : alert.type === 'error' 
                          ? 'bg-destructive/10 border border-destructive/20 hover:bg-destructive/20' 
                          : 'bg-info/10 border border-info/20 hover:bg-info/20'
                    }`}
                    onClick={() => alert.link && navigate(alert.link)}
                  >
                    <p className="font-medium text-sm">{alert.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">{alert.description}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                <p className="text-sm">No alerts at this time</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

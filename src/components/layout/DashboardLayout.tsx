import { useEffect } from 'react';
import { useNavigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { SidebarProvider, SidebarTrigger, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';
import { Separator } from '@/components/ui/separator';
import { 
  Breadcrumb, 
  BreadcrumbItem, 
  BreadcrumbLink, 
  BreadcrumbList, 
  BreadcrumbPage, 
  BreadcrumbSeparator 
} from '@/components/ui/breadcrumb';
import { Loader2, Home } from 'lucide-react';
import { NotificationBell } from '@/components/notifications/NotificationBell';

// Route to breadcrumb label mapping
const routeLabels: Record<string, string> = {
  'dashboard': 'Dashboard',
  'users': 'User Management',
  'fleet': 'Fleet Management',
  'drivers': 'Drivers',
  'stations': 'Stations',
  'routes': 'Routes',
  'schedules': 'Schedules',
  'bookings': 'Bookings',
  'tracking': 'Live Tracking',
  'maintenance': 'Maintenance',
  'inventory': 'Inventory',
  'accounts': 'Accounts',
  'customer-service': 'Customer Service',
  'reports': 'Reports',
  'settings': 'Settings',
  'book': 'Book Ticket',
  'my-bookings': 'My Bookings',
  'driver': 'Driver',
  'driver-app': 'Driver App',
  'trips': 'Trips',
  'passengers': 'Passengers',
  'incidents': 'Incidents',
  'job-cards': 'Job Cards',
  'work-orders': 'Work Orders',
  'parts-requests': 'Parts Requests',
  'payroll': 'Payroll',
};

function generateBreadcrumbs(pathname: string) {
  const segments = pathname.split('/').filter(Boolean);
  const breadcrumbs: { label: string; path: string; isLast: boolean }[] = [];
  
  let currentPath = '';
  segments.forEach((segment, index) => {
    currentPath += `/${segment}`;
    const label = routeLabels[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);
    breadcrumbs.push({
      label,
      path: currentPath,
      isLast: index === segments.length - 1
    });
  });
  
  return breadcrumbs;
}

export function DashboardLayout() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const breadcrumbs = generateBreadcrumbs(location.pathname);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-14 shrink-0 items-center gap-2 border-b bg-card px-3 md:px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4 hidden sm:block" />
            <Breadcrumb className="hidden sm:flex">
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/dashboard" className="flex items-center gap-1">
                    <Home className="h-3.5 w-3.5" />
                    <span className="hidden md:inline">Home</span>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                {breadcrumbs.map((crumb, index) => (
                  <span key={crumb.path} className="contents">
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      {crumb.isLast ? (
                        <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                      ) : (
                        <BreadcrumbLink href={crumb.path}>{crumb.label}</BreadcrumbLink>
                      )}
                    </BreadcrumbItem>
                  </span>
                ))}
              </BreadcrumbList>
            </Breadcrumb>
            {/* Mobile: Show current page title only */}
            <span className="sm:hidden text-sm font-medium text-foreground truncate">
              {breadcrumbs[breadcrumbs.length - 1]?.label || 'Dashboard'}
            </span>
            <div className="ml-auto">
              <NotificationBell />
            </div>
          </header>
          <main className="flex-1 p-3 md:p-6 overflow-auto">
            <Outlet />
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}

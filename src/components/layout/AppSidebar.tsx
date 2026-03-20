import { useAuth } from '@/contexts/AuthContext';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Bus,
  LayoutDashboard,
  Users,
  Route,
  Calendar,
  Ticket,
  MapPin,
  Wrench,
  Package,
  DollarSign,
  BarChart3,
  Settings,
  LogOut,
  ChevronDown,
  Headphones,
  Building2,
  FileText,
  UserCog,
  Navigation,
  AlertTriangle,
  ClipboardList,
  Smartphone,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const menuItems = {
  admin: [
    { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
    { title: 'User Management', url: '/users', icon: UserCog },
    { title: 'Fleet Management', url: '/fleet', icon: Bus },
    { title: 'Drivers', url: '/drivers', icon: Users },
    { title: 'Stations', url: '/stations', icon: Building2 },
    { title: 'Routes', url: '/routes', icon: Route },
    { title: 'Schedules', url: '/schedules', icon: Calendar },
    { title: 'Bookings', url: '/bookings', icon: Ticket },
    { title: 'Live Tracking', url: '/tracking', icon: MapPin },
    { title: 'Driver App', url: '/driver-app', icon: Smartphone },
    { title: 'Maintenance', url: '/maintenance', icon: Wrench },
    { title: 'Inventory', url: '/inventory', icon: Package },
    { title: 'Accounts', url: '/accounts', icon: DollarSign },
    { title: 'Customer Service', url: '/customer-service', icon: Headphones },
    { title: 'Reports', url: '/reports', icon: BarChart3 },
    { title: 'Settings', url: '/settings', icon: Settings },
  ],
  driver: [
    { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
    { title: 'Driver App', url: '/driver-app', icon: Smartphone },
    { title: 'My Trips', url: '/driver/trips', icon: Navigation },
    { title: 'Passenger Manifest', url: '/driver/passengers', icon: ClipboardList },
    { title: 'Incidents', url: '/driver/incidents', icon: AlertTriangle },
    { title: 'Settings', url: '/settings', icon: Settings },
  ],
  passenger: [
    { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
    { title: 'Stations', url: '/stations', icon: Building2 },
    { title: 'Book Ticket', url: '/book', icon: Ticket },
    { title: 'My Bookings', url: '/my-bookings', icon: Calendar },
    { title: 'Track Bus', url: '/tracking', icon: MapPin },
    { title: 'Settings', url: '/settings', icon: Settings },
  ],
  storekeeper: [
    { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
    { title: 'Inventory', url: '/inventory', icon: Package },
    { title: 'Parts Requests', url: '/parts-requests', icon: Wrench },
    { title: 'Settings', url: '/settings', icon: Settings },
  ],
  mechanic: [
    { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
    { title: 'Job Cards', url: '/job-cards', icon: FileText },
    { title: 'Work Orders', url: '/work-orders', icon: Wrench },
    { title: 'Maintenance', url: '/maintenance', icon: Bus },
    { title: 'Parts', url: '/inventory', icon: Package },
    { title: 'Settings', url: '/settings', icon: Settings },
  ],
  staff: [
    { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
    { title: 'Stations', url: '/stations', icon: Building2 },
    { title: 'Routes', url: '/routes', icon: Route },
    { title: 'Schedules', url: '/schedules', icon: Calendar },
    { title: 'Bookings', url: '/bookings', icon: Ticket },
    { title: 'Settings', url: '/settings', icon: Settings },
  ],
  accounts: [
    { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
    { title: 'Transactions', url: '/accounts', icon: DollarSign },
    { title: 'Payroll', url: '/payroll', icon: Users },
    { title: 'Reports', url: '/reports', icon: BarChart3 },
    { title: 'Settings', url: '/settings', icon: Settings },
  ],
};

export function AppSidebar() {
  const { profile, role, signOut } = useAuth();
  const { state, isMobile, setOpenMobile } = useSidebar();
  const location = useLocation();
  const collapsed = state === 'collapsed';

  const items = menuItems[role || 'passenger'] || menuItems.passenger;

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleLabel = (role: string) => {
    return role.charAt(0).toUpperCase() + role.slice(1);
  };

  // Close sidebar on mobile when navigating
  const handleNavClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="h-9 w-9 rounded-lg gradient-primary flex items-center justify-center flex-shrink-0">
            <Bus className="h-5 w-5 text-primary-foreground" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="font-display font-semibold text-sidebar-foreground">FleetMaster</span>
              <span className="text-xs text-sidebar-foreground/60">Bus Management</span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={location.pathname === item.url}
                    tooltip={collapsed ? item.title : undefined}
                  >
                    <NavLink to={item.url} onClick={handleNavClick}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="w-full justify-start gap-2 px-2 hover:bg-sidebar-accent"
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src={profile?.avatar_url} />
                <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground text-xs">
                  {getInitials(profile?.full_name || 'U')}
                </AvatarFallback>
              </Avatar>
              {!collapsed && (
                <>
                  <div className="flex flex-col items-start flex-1 overflow-hidden">
                    <span className="text-sm font-medium text-sidebar-foreground truncate w-full text-left">
                      {profile?.full_name || 'User'}
                    </span>
                    <span className="text-xs text-sidebar-foreground/60">
                      {getRoleLabel(role || 'passenger')}
                    </span>
                  </div>
                  <ChevronDown className="h-4 w-4 text-sidebar-foreground/60" />
                </>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem asChild>
              <NavLink to="/settings" className="cursor-pointer" onClick={handleNavClick}>
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </NavLink>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={signOut} className="cursor-pointer text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

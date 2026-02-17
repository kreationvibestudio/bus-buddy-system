import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { DashboardLayout } from "./components/layout/DashboardLayout";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { lazy, Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { ThemeProvider } from "next-themes";

// Eagerly loaded pages (critical path)
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import AuthCallback from "./pages/AuthCallback";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";

// Lazy loaded pages (code splitting)
const FleetPage = lazy(() => import("./pages/fleet/FleetPage"));
const DriversPage = lazy(() => import("./pages/drivers/DriversPage"));
const DriverDetailPage = lazy(() => import("./pages/drivers/DriverDetailPage"));
const RoutesPage = lazy(() => import("./pages/routes/RoutesPage"));
const SchedulesPage = lazy(() => import("./pages/schedules/SchedulesPage"));
const BookingsPage = lazy(() => import("./pages/bookings/BookingsPage"));
const MaintenancePage = lazy(() => import("./pages/maintenance/MaintenancePage"));
const InventoryPage = lazy(() => import("./pages/inventory/InventoryPage"));
const AccountsPage = lazy(() => import("./pages/accounts/AccountsPage"));
const CustomerServicePage = lazy(() => import("./pages/customer-service/CustomerServicePage"));
const BookTicketPage = lazy(() => import("./pages/passenger/BookTicketPage"));
const MyBookingsPage = lazy(() => import("./pages/passenger/MyBookingsPage"));
const SettingsPage = lazy(() => import("./pages/settings/SettingsPage"));
const ReportsPage = lazy(() => import("./pages/reports/ReportsPage"));
const TrackingPage = lazy(() => import("./pages/tracking/TrackingPage"));
const StationsPage = lazy(() => import("./pages/stations/StationsPage"));
const JobCardsPage = lazy(() => import("./pages/mechanic/JobCardsPage"));
const UserManagementPage = lazy(() => import("./pages/admin/UserManagementPage"));
const DriverTripsPage = lazy(() => import("./pages/driver/DriverTripsPage"));
const DriverTripDetailPage = lazy(() => import("./pages/driver/DriverTripDetailPage"));
const DriverPassengersPage = lazy(() => import("./pages/driver/DriverPassengersPage"));
const DriverIncidentsPage = lazy(() => import("./pages/driver/DriverIncidentsPage"));
const DriverAppPage = lazy(() => import("./pages/driver/DriverAppPage"));

const queryClient = new QueryClient();

// Loading fallback component
const PageLoader = () => (
  <div className="p-6 space-y-4">
    <Skeleton className="h-8 w-64" />
    <Skeleton className="h-4 w-48" />
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mt-6">
      {[1, 2, 3, 4].map((i) => (
        <Skeleton key={i} className="h-32" />
      ))}
    </div>
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            
            {/* Protected Dashboard Routes */}
            <Route element={<DashboardLayout />}>
              {/* Dashboard - accessible by all authenticated users */}
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/settings" element={
                <Suspense fallback={<PageLoader />}>
                  <SettingsPage />
                </Suspense>
              } />
              
              {/* Admin only routes */}
              <Route path="/users" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <Suspense fallback={<PageLoader />}>
                    <UserManagementPage />
                  </Suspense>
                </ProtectedRoute>
              } />
              
              {/* Admin & Staff routes */}
              <Route path="/fleet" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <Suspense fallback={<PageLoader />}>
                    <FleetPage />
                  </Suspense>
                </ProtectedRoute>
              } />
              <Route path="/drivers" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <Suspense fallback={<PageLoader />}>
                    <DriversPage />
                  </Suspense>
                </ProtectedRoute>
              } />
              <Route path="/drivers/:id" element={
                <ProtectedRoute allowedRoles={['admin', 'staff']}>
                  <Suspense fallback={<PageLoader />}>
                    <DriverDetailPage />
                  </Suspense>
                </ProtectedRoute>
              } />
              <Route path="/stations" element={
                <ProtectedRoute allowedRoles={['admin', 'staff', 'passenger']}>
                  <Suspense fallback={<PageLoader />}>
                    <StationsPage />
                  </Suspense>
                </ProtectedRoute>
              } />
              <Route path="/routes" element={
                <ProtectedRoute allowedRoles={['admin', 'staff']}>
                  <Suspense fallback={<PageLoader />}>
                    <RoutesPage />
                  </Suspense>
                </ProtectedRoute>
              } />
              <Route path="/schedules" element={
                <ProtectedRoute allowedRoles={['admin', 'staff', 'driver']}>
                  <Suspense fallback={<PageLoader />}>
                    <SchedulesPage />
                  </Suspense>
                </ProtectedRoute>
              } />
              <Route path="/bookings" element={
                <ProtectedRoute allowedRoles={['admin', 'staff']}>
                  <Suspense fallback={<PageLoader />}>
                    <BookingsPage />
                  </Suspense>
                </ProtectedRoute>
              } />
              <Route path="/tracking" element={
                <ProtectedRoute allowedRoles={['admin', 'staff', 'passenger']}>
                  <Suspense fallback={<PageLoader />}>
                    <TrackingPage />
                  </Suspense>
                </ProtectedRoute>
              } />
              
              {/* Maintenance - Admin, Staff, Mechanic */}
              <Route path="/maintenance" element={
                <ProtectedRoute allowedRoles={['admin', 'staff', 'mechanic']}>
                  <Suspense fallback={<PageLoader />}>
                    <MaintenancePage />
                  </Suspense>
                </ProtectedRoute>
              } />
              <Route path="/work-orders" element={
                <ProtectedRoute allowedRoles={['admin', 'mechanic']}>
                  <Suspense fallback={<PageLoader />}>
                    <MaintenancePage />
                  </Suspense>
                </ProtectedRoute>
              } />
              
              {/* Inventory - Admin, Staff, Storekeeper, Mechanic */}
              <Route path="/inventory" element={
                <ProtectedRoute allowedRoles={['admin', 'staff', 'storekeeper', 'mechanic']}>
                  <Suspense fallback={<PageLoader />}>
                    <InventoryPage />
                  </Suspense>
                </ProtectedRoute>
              } />
              <Route path="/parts-requests" element={
                <ProtectedRoute allowedRoles={['admin', 'storekeeper', 'mechanic']}>
                  <Suspense fallback={<PageLoader />}>
                    <InventoryPage />
                  </Suspense>
                </ProtectedRoute>
              } />
              <Route path="/job-cards" element={
                <ProtectedRoute allowedRoles={['admin', 'mechanic']}>
                  <Suspense fallback={<PageLoader />}>
                    <JobCardsPage />
                  </Suspense>
                </ProtectedRoute>
              } />
              
              {/* Accounts - Admin, Accounts */}
              <Route path="/accounts" element={
                <ProtectedRoute allowedRoles={['admin', 'accounts']}>
                  <Suspense fallback={<PageLoader />}>
                    <AccountsPage />
                  </Suspense>
                </ProtectedRoute>
              } />
              <Route path="/payroll" element={
                <ProtectedRoute allowedRoles={['admin', 'accounts']}>
                  <Suspense fallback={<PageLoader />}>
                    <AccountsPage />
                  </Suspense>
                </ProtectedRoute>
              } />
              
              {/* Customer Service - Admin, Staff */}
              <Route path="/customer-service" element={
                <ProtectedRoute allowedRoles={['admin', 'staff']}>
                  <Suspense fallback={<PageLoader />}>
                    <CustomerServicePage />
                  </Suspense>
                </ProtectedRoute>
              } />
              
              {/* Reports - Admin only */}
              <Route path="/reports" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <Suspense fallback={<PageLoader />}>
                    <ReportsPage />
                  </Suspense>
                </ProtectedRoute>
              } />
              
              {/* Passenger routes */}
              <Route path="/book" element={
                <ProtectedRoute allowedRoles={['admin', 'staff', 'passenger']}>
                  <Suspense fallback={<PageLoader />}>
                    <BookTicketPage />
                  </Suspense>
                </ProtectedRoute>
              } />
              <Route path="/my-bookings" element={
                <ProtectedRoute allowedRoles={['admin', 'passenger']}>
                  <Suspense fallback={<PageLoader />}>
                    <MyBookingsPage />
                  </Suspense>
                </ProtectedRoute>
              } />
              
              {/* Driver routes */}
              <Route path="/driver/trips" element={
                <ProtectedRoute allowedRoles={['admin', 'driver']}>
                  <Suspense fallback={<PageLoader />}>
                    <DriverTripsPage />
                  </Suspense>
                </ProtectedRoute>
              } />
              <Route path="/driver/trip/:id" element={
                <ProtectedRoute allowedRoles={['admin', 'driver']}>
                  <Suspense fallback={<PageLoader />}>
                    <DriverTripDetailPage />
                  </Suspense>
                </ProtectedRoute>
              } />
              <Route path="/driver/passengers" element={
                <ProtectedRoute allowedRoles={['admin', 'driver']}>
                  <Suspense fallback={<PageLoader />}>
                    <DriverPassengersPage />
                  </Suspense>
                </ProtectedRoute>
              } />
              <Route path="/driver/incidents" element={
                <ProtectedRoute allowedRoles={['admin', 'driver']}>
                  <Suspense fallback={<PageLoader />}>
                    <DriverIncidentsPage />
                  </Suspense>
                </ProtectedRoute>
              } />
              
              {/* Driver App - Now inside DashboardLayout for consistent sidebar */}
              <Route path="/driver-app" element={
                <ProtectedRoute allowedRoles={['admin', 'driver']}>
                  <Suspense fallback={<PageLoader />}>
                    <DriverAppPage />
                  </Suspense>
                </ProtectedRoute>
              } />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;

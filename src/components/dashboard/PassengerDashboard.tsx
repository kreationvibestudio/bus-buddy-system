import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, formatDistanceToNow, isPast, isToday, isTomorrow, parseISO } from 'date-fns';
import { formatCurrency } from '@/lib/currency';
import {
  Ticket,
  MapPin,
  Calendar,
  Clock,
  ArrowRight,
  Navigation,
  History,
  Plus,
  CheckCircle,
  AlertCircle,
  Bus,
} from 'lucide-react';

export function PassengerDashboard() {
  const { profile, user } = useAuth();
  const navigate = useNavigate();

  // Fetch passenger's bookings
  const { data: bookings, isLoading: bookingsLoading } = useQuery({
    queryKey: ['passenger-dashboard-bookings', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          trip:trips(
            id,
            trip_date,
            departure_time,
            arrival_time,
            status,
            route:routes(name, origin, destination, base_fare)
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  // Get upcoming bookings (confirmed, not past, sorted by date)
  const upcomingBookings = bookings
    ?.filter((b: any) => {
      if (b.status !== 'confirmed' || !b.trip) return false;
      const tripDate = parseISO(b.trip.trip_date);
      return !isPast(tripDate) || isToday(tripDate);
    })
    .sort((a: any, b: any) => {
      const dateA = new Date(`${a.trip.trip_date}T${a.trip.departure_time}`);
      const dateB = new Date(`${b.trip.trip_date}T${b.trip.departure_time}`);
      return dateA.getTime() - dateB.getTime();
    }) || [];

  // Get active trip (in progress)
  const activeTrip = bookings?.find((b: any) => 
    b.status === 'confirmed' && b.trip?.status === 'in_progress'
  );

  // Get recent completed bookings
  const completedBookings = bookings
    ?.filter((b: any) => b.status === 'completed' || b.trip?.status === 'completed')
    .slice(0, 3) || [];

  // Stats
  const totalTrips = bookings?.filter((b: any) => b.status === 'completed').length || 0;
  const totalSpent = bookings
    ?.filter((b: any) => b.payment_status === 'completed')
    .reduce((sum: number, b: any) => sum + (b.total_fare || 0), 0) || 0;

  const formatTripDate = (dateStr: string) => {
    const date = parseISO(dateStr);
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    return format(date, 'EEE, MMM d');
  };

  const getTimeUntilTrip = (tripDate: string, departureTime: string) => {
    const tripDateTime = new Date(`${tripDate}T${departureTime}`);
    if (isPast(tripDateTime)) return 'Departing now';
    return formatDistanceToNow(tripDateTime, { addSuffix: true });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold">
            Welcome, {profile?.full_name?.split(' ')[0] || 'Traveler'}! 👋
          </h1>
          <p className="text-muted-foreground mt-1">
            Ready for your next journey?
          </p>
        </div>
        <Button onClick={() => navigate('/book-ticket')} size="lg" className="gap-2">
          <Plus className="h-5 w-5" />
          Book a Trip
        </Button>
      </div>

      {/* Active Trip Alert */}
      {activeTrip && (
        <Card className="border-primary bg-primary/5">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-full bg-primary/20">
                  <Navigation className="h-6 w-6 text-primary animate-pulse" />
                </div>
                <div>
                  <p className="text-sm font-medium text-primary">Trip in Progress</p>
                  <h3 className="text-lg font-semibold">
                    {activeTrip.trip?.route?.origin} → {activeTrip.trip?.route?.destination}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Your bus is on the way! Track it in real-time.
                  </p>
                </div>
              </div>
              <Button onClick={() => navigate('/tracking')} variant="default" className="gap-2">
                <MapPin className="h-4 w-4" />
                Track My Bus
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/my-bookings')}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Upcoming Trips
            </CardTitle>
            <Calendar className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            {bookingsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-3xl font-bold">{upcomingBookings.length}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {upcomingBookings.length === 1 ? 'trip scheduled' : 'trips scheduled'}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Completed Trips
            </CardTitle>
            <CheckCircle className="h-5 w-5 text-success" />
          </CardHeader>
          <CardContent>
            {bookingsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-3xl font-bold">{totalTrips}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  journeys completed
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Spent
            </CardTitle>
            <Ticket className="h-5 w-5 text-warning" />
          </CardHeader>
          <CardContent>
            {bookingsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-3xl font-bold">{formatCurrency(totalSpent)}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  on travel
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Upcoming Trips */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bus className="h-5 w-5 text-primary" />
              Upcoming Trips
            </CardTitle>
            <CardDescription>Your scheduled journeys</CardDescription>
          </CardHeader>
          <CardContent>
            {bookingsLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
            ) : upcomingBookings.length > 0 ? (
              <div className="space-y-3">
                {upcomingBookings.slice(0, 3).map((booking: any) => (
                  <div
                    key={booking.id}
                    className="p-4 rounded-lg border bg-card hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => navigate('/my-bookings')}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <span>{booking.trip?.route?.origin}</span>
                          <ArrowRight className="h-4 w-4 text-muted-foreground" />
                          <span>{booking.trip?.route?.destination}</span>
                        </div>
                        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            {formatTripDate(booking.trip?.trip_date)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            {booking.trip?.departure_time?.slice(0, 5)}
                          </span>
                        </div>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {getTimeUntilTrip(booking.trip?.trip_date, booking.trip?.departure_time)}
                      </Badge>
                    </div>
                  </div>
                ))}
                {upcomingBookings.length > 3 && (
                  <Button variant="ghost" className="w-full" onClick={() => navigate('/my-bookings')}>
                    View all {upcomingBookings.length} trips
                  </Button>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <Bus className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground mb-4">No upcoming trips</p>
                <Button onClick={() => navigate('/book-ticket')} variant="outline">
                  Book Your First Trip
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions & Recent History */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                className="h-auto py-4 flex flex-col gap-2"
                onClick={() => navigate('/book-ticket')}
              >
                <Plus className="h-5 w-5" />
                <span className="text-xs">Book Trip</span>
              </Button>
              <Button
                variant="outline"
                className="h-auto py-4 flex flex-col gap-2"
                onClick={() => navigate('/my-bookings')}
              >
                <Ticket className="h-5 w-5" />
                <span className="text-xs">My Bookings</span>
              </Button>
              <Button
                variant="outline"
                className="h-auto py-4 flex flex-col gap-2"
                onClick={() => navigate('/tracking')}
                disabled={!activeTrip}
              >
                <Navigation className="h-5 w-5" />
                <span className="text-xs">Track Bus</span>
              </Button>
              <Button
                variant="outline"
                className="h-auto py-4 flex flex-col gap-2"
                onClick={() => navigate('/profile')}
              >
                <History className="h-5 w-5" />
                <span className="text-xs">Profile</span>
              </Button>
            </CardContent>
          </Card>

          {/* Travel Tips */}
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-primary" />
                Travel Tips
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li>• Arrive at the station 15 minutes before departure</li>
                <li>• Keep your booking confirmation handy</li>
                <li>• Track your bus once the trip starts</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}


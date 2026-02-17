import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { 
  Bus, 
  MapPin, 
  Clock, 
  Navigation, 
  Users, 
  Wrench,
  AlertTriangle,
  CheckCircle2,
  Timer,
  ChevronRight
} from 'lucide-react';
import { format, differenceInHours, differenceInDays } from 'date-fns';
import { useNavigate } from 'react-router-dom';

export function DriverDashboard() {
  const { profile, user } = useAuth();
  const navigate = useNavigate();

  // Fetch driver's assigned trip for today
  const { data: assignedTrip, isLoading: tripLoading } = useQuery({
    queryKey: ['driver-assigned-trip', user?.id],
    queryFn: async () => {
      const { data: driverData } = await supabase
        .from('drivers')
        .select('id')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (!driverData) return null;

      const today = format(new Date(), 'yyyy-MM-dd');
      const { data, error } = await supabase
        .from('trips')
        .select(`
          *,
          route:routes(name, origin, destination, distance_km, estimated_duration_minutes),
          bus:buses(registration_number, model, capacity)
        `)
        .eq('driver_id', driverData.id)
        .eq('trip_date', today)
        .in('status', ['scheduled', 'in_progress'])
        .order('departure_time', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Fetch job cards for driver's bus
  const { data: vehicleJobCards, isLoading: jobCardsLoading } = useQuery({
    queryKey: ['driver-vehicle-job-cards', user?.id],
    queryFn: async () => {
      const { data: driverData } = await supabase
        .from('drivers')
        .select('id')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (!driverData) return [];

      // Get buses assigned to driver
      const { data: buses } = await supabase
        .from('buses')
        .select('id, registration_number')
        .eq('current_driver_id', driverData.id);

      if (!buses || buses.length === 0) return [];

      const busIds = buses.map(b => b.id);

      const { data, error } = await supabase
        .from('job_cards')
        .select(`
          *,
          bus:buses(registration_number, model)
        `)
        .in('bus_id', busIds)
        .not('status', 'in', '("completed","closed")')
        .order('created_at', { ascending: false })
        .limit(3);

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'scheduled':
        return <Badge variant="secondary">Scheduled</Badge>;
      case 'in_progress':
        return <Badge className="bg-info text-info-foreground">In Progress</Badge>;
      case 'completed':
        return <Badge className="bg-success text-success-foreground">Completed</Badge>;
      default:
        return <Badge variant="outline">{status || 'Pending'}</Badge>;
    }
  };

  const getJobCardStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge variant="secondary">Draft</Badge>;
      case 'inspection_complete':
        return <Badge className="bg-info text-info-foreground">Inspecting</Badge>;
      case 'in_progress':
        return <Badge className="bg-warning text-warning-foreground">In Progress</Badge>;
      case 'awaiting_parts':
        return <Badge variant="destructive">Awaiting Parts</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const calculateETA = (jobCard: any) => {
    if (!jobCard.estimated_completion) return 'Not set';
    const eta = new Date(jobCard.estimated_completion);
    const now = new Date();
    const hoursLeft = differenceInHours(eta, now);
    const daysLeft = differenceInDays(eta, now);

    if (hoursLeft < 0) return 'Overdue';
    if (daysLeft > 0) return `${daysLeft} day${daysLeft > 1 ? 's' : ''} left`;
    return `${hoursLeft} hour${hoursLeft !== 1 ? 's' : ''} left`;
  };

  const calculateProgress = (jobCard: any) => {
    const statusProgress: Record<string, number> = {
      'draft': 10,
      'inspection_complete': 30,
      'in_progress': 60,
      'awaiting_parts': 50,
      'completed': 100,
      'closed': 100,
    };
    return statusProgress[jobCard.status] || 0;
  };

  if (tripLoading || jobCardsLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-display font-bold">
          Welcome back, {profile?.full_name?.split(' ')[0] || 'Driver'}!
        </h1>
        <p className="text-muted-foreground mt-1">
          Here's your schedule and vehicle status for today.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Assigned Trip Card */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Navigation className="h-5 w-5 text-primary" />
              Today's Assigned Route
            </CardTitle>
            <CardDescription>Your next scheduled trip</CardDescription>
          </CardHeader>
          <CardContent>
            {assignedTrip ? (
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-primary/10">
                      <Bus className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-bold text-lg">{assignedTrip.bus?.registration_number}</p>
                      <p className="text-sm text-muted-foreground">{assignedTrip.bus?.model}</p>
                    </div>
                  </div>
                  {getStatusBadge(assignedTrip.status)}
                </div>

                <div className="grid gap-3 p-4 bg-muted/50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-success" />
                    <div>
                      <p className="text-xs text-muted-foreground">From</p>
                      <p className="font-semibold">{assignedTrip.route?.origin}</p>
                    </div>
                  </div>
                  <div className="ml-1.5 border-l-2 border-dashed border-muted-foreground/30 h-4" />
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-destructive" />
                    <div>
                      <p className="text-xs text-muted-foreground">To</p>
                      <p className="font-semibold">{assignedTrip.route?.destination}</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-3 bg-muted/30 rounded-lg">
                    <Clock className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                    <p className="text-sm font-semibold">{assignedTrip.departure_time}</p>
                    <p className="text-xs text-muted-foreground">Departure</p>
                  </div>
                  <div className="text-center p-3 bg-muted/30 rounded-lg">
                    <Users className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                    <p className="text-sm font-semibold">{assignedTrip.available_seats ?? assignedTrip.bus?.capacity}</p>
                    <p className="text-xs text-muted-foreground">Seats</p>
                  </div>
                  <div className="text-center p-3 bg-muted/30 rounded-lg">
                    <MapPin className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                    <p className="text-sm font-semibold">{assignedTrip.route?.distance_km || '--'}</p>
                    <p className="text-xs text-muted-foreground">km</p>
                  </div>
                </div>

                <Button 
                  className="w-full" 
                  onClick={() => navigate(`/driver/trip/${assignedTrip.id}`)}
                >
                  View Trip Details
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="p-4 rounded-full bg-muted/50 mb-4">
                  <Navigation className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="font-semibold mb-1">No trips assigned today</h3>
                <p className="text-sm text-muted-foreground">
                  Check back later or view all your trips
                </p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => navigate('/driver/trips')}
                >
                  View All Trips
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Vehicle Workshop Status */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5 text-warning" />
              Vehicle Workshop Status
            </CardTitle>
            <CardDescription>Ongoing maintenance on your assigned vehicles</CardDescription>
          </CardHeader>
          <CardContent>
            {vehicleJobCards && vehicleJobCards.length > 0 ? (
              <div className="space-y-4">
                {vehicleJobCards.map((jobCard) => (
                  <div 
                    key={jobCard.id} 
                    className="p-4 border rounded-xl space-y-3 hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold">{jobCard.bus?.registration_number}</p>
                        <p className="text-sm text-muted-foreground">{jobCard.job_card_number}</p>
                      </div>
                      {getJobCardStatusBadge(jobCard.status)}
                    </div>

                    <p className="text-sm">{jobCard.reason_for_visit}</p>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-medium">{calculateProgress(jobCard)}%</span>
                      </div>
                      <Progress value={calculateProgress(jobCard)} className="h-2" />
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t">
                      <div className="flex items-center gap-2 text-sm">
                        <Timer className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{calculateETA(jobCard)}</span>
                      </div>
                      {jobCard.estimated_completion && (
                        <span className="text-xs text-muted-foreground">
                          Est. {format(new Date(jobCard.estimated_completion), 'MMM d, h:mm a')}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="p-4 rounded-full bg-success/10 mb-4">
                  <CheckCircle2 className="h-8 w-8 text-success" />
                </div>
                <h3 className="font-semibold mb-1">My vehicle is operational</h3>
                <p className="text-sm text-muted-foreground">
                  No ongoing maintenance for your assigned vehicles
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card 
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => navigate('/driver/trips')}
        >
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-primary/10">
              <Navigation className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="font-semibold">My Trips</p>
              <p className="text-sm text-muted-foreground">View all scheduled trips</p>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground ml-auto" />
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => navigate('/driver/passengers')}
        >
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-success/10">
              <Users className="h-6 w-6 text-success" />
            </div>
            <div>
              <p className="font-semibold">Passengers</p>
              <p className="text-sm text-muted-foreground">View passenger manifest</p>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground ml-auto" />
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => navigate('/driver/incidents')}
        >
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-warning/10">
              <AlertTriangle className="h-6 w-6 text-warning" />
            </div>
            <div>
              <p className="font-semibold">Report Incident</p>
              <p className="text-sm text-muted-foreground">Log issues or events</p>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground ml-auto" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

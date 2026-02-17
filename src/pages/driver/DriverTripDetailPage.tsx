import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useStartTrip, useEndTrip, useTripPassengers } from '@/hooks/useDriverTrips';
import { useGPSTracking } from '@/hooks/useGPSTracking';
import { useCapacitorGPS } from '@/hooks/useCapacitorGPS';
import { sampleTrips, samplePassengers } from '@/data/sampleDriverData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  Bus, 
  MapPin, 
  Clock, 
  Users,
  Play,
  Square,
  Navigation,
  AlertTriangle,
  ArrowLeft,
  Locate,
  Signal
} from 'lucide-react';
import { toast } from 'sonner';

export default function DriverTripDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [showStartDialog, setShowStartDialog] = useState(false);
  const [showEndDialog, setShowEndDialog] = useState(false);

  const isSampleTrip = id?.startsWith('sample-');

  // Get sample trip data
  const sampleTrip = isSampleTrip ? sampleTrips.find(t => t.id === id) : null;

  // Fetch trip details from database (only if not a sample trip)
  const { data: dbTrip, isLoading } = useQuery({
    queryKey: ['trip-detail', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trips')
        .select(`
          *,
          route:routes(*),
          bus:buses(*),
          driver:drivers(*)
        `)
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!id && !isSampleTrip,
  });

  // Use sample trip or database trip
  const trip = isSampleTrip ? (sampleTrip ? {
    id: sampleTrip.id,
    trip_date: sampleTrip.trip_date,
    departure_time: sampleTrip.departure_time,
    arrival_time: sampleTrip.arrival_time,
    status: sampleTrip.status,
    available_seats: sampleTrip.available_seats,
    bus_id: 'sample-bus',
    route: sampleTrip.route,
    bus: sampleTrip.bus,
  } : null) : dbTrip;

  // Get passengers - use sample data for sample trips
  const { data: dbPassengers } = useTripPassengers(isSampleTrip ? '' : (id || ''));
  const passengers = isSampleTrip ? samplePassengers : dbPassengers;
  const startTrip = useStartTrip();
  const endTrip = useEndTrip();

  // GPS Tracking
  // IMPORTANT: On native (Capacitor) we must not start the browser geolocation watcher,
  // otherwise we can end up with duplicate watchers and confusing state.
  const nativeGps = useCapacitorGPS({
    tripId: id,
    busId: trip?.bus_id,
    enabled: trip?.status === 'in_progress',
  });

  const webGps = useGPSTracking({
    tripId: id,
    busId: trip?.bus_id,
    enabled: !nativeGps.isNative && trip?.status === 'in_progress',
  });

  const gps = nativeGps.isNative ? nativeGps : webGps;
  const { position, isTracking, error: gpsError, startTracking, stopTracking } = gps;

  const handleStartTrip = async () => {
    if (!id) return;
    console.log('[DriverTripDetailPage] Starting trip:', id);
    await startTrip.mutateAsync(id);
    setShowStartDialog(false);
    // Explicitly start GPS tracking after trip starts
    console.log('[DriverTripDetailPage] Trip started, starting GPS tracking...');
    startTracking();
  };

  const handleEndTrip = async () => {
    if (!id) return;
    console.log('[DriverTripDetailPage] Ending trip:', id);
    stopTracking();
    await endTrip.mutateAsync(id);
    setShowEndDialog(false);
    console.log('[DriverTripDetailPage] Trip ended, GPS tracking stopped');
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'scheduled':
        return <Badge variant="secondary" className="text-base px-3 py-1">Scheduled</Badge>;
      case 'in_progress':
        return <Badge className="bg-info text-info-foreground text-base px-3 py-1">In Progress</Badge>;
      case 'completed':
        return <Badge className="bg-success text-success-foreground text-base px-3 py-1">Completed</Badge>;
      case 'cancelled':
        return <Badge variant="destructive" className="text-base px-3 py-1">Cancelled</Badge>;
      default:
        return <Badge variant="outline" className="text-base px-3 py-1">{status || 'Pending'}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <AlertTriangle className="h-12 w-12 text-warning mb-4" />
        <h2 className="text-xl font-semibold">Trip not found</h2>
        <Button variant="link" onClick={() => navigate('/driver/trips')}>
          Back to trips
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/driver/trips')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Trip Details</h1>
          <p className="text-muted-foreground">
            {format(new Date(trip.trip_date), 'EEEE, MMMM d, yyyy')}
          </p>
        </div>
        {getStatusBadge(trip.status)}
      </div>

      {/* GPS Status Card */}
      {trip.status === 'in_progress' && (
        <Card className="border-info">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full ${isTracking ? 'bg-success/20' : 'bg-muted'}`}>
                  <Signal className={`h-5 w-5 ${isTracking ? 'text-success animate-pulse' : 'text-muted-foreground'}`} />
                </div>
                <div>
                  <p className="font-medium">
                    {isTracking ? 'GPS Active' : 'GPS Inactive'}
                  </p>
                  {position && (
                    <p className="text-sm text-muted-foreground">
                      {position.latitude.toFixed(6)}, {position.longitude.toFixed(6)}
                    </p>
                  )}
                  {gpsError && (
                    <p className="text-sm text-destructive">{gpsError}</p>
                  )}
                </div>
              </div>
              <Button
                variant={isTracking ? 'destructive' : 'default'}
                size="sm"
                onClick={isTracking ? stopTracking : startTracking}
              >
                <Locate className="h-4 w-4 mr-2" />
                {isTracking ? 'Stop' : 'Start'} GPS
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Route Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Navigation className="h-5 w-5" />
            Route Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-success" />
            <div>
              <p className="text-sm text-muted-foreground">From</p>
              <p className="font-semibold text-lg">{trip.route?.origin}</p>
            </div>
          </div>
          <div className="ml-1.5 w-0.5 h-8 bg-border" />
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-destructive" />
            <div>
              <p className="text-sm text-muted-foreground">To</p>
              <p className="font-semibold text-lg">{trip.route?.destination}</p>
            </div>
          </div>

          <div className="flex items-center gap-6 pt-4 border-t">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Departure</p>
                <p className="font-medium">{trip.departure_time}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Arrival</p>
                <p className="font-medium">{trip.arrival_time}</p>
              </div>
            </div>
            {trip.route?.distance_km && (
              <div>
                <p className="text-sm text-muted-foreground">Distance</p>
                <p className="font-medium">{trip.route.distance_km} km</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Bus & Passengers */}
      <Tabs defaultValue="bus">
        <TabsList className="w-full">
          <TabsTrigger value="bus" className="flex-1">
            <Bus className="h-4 w-4 mr-2" />
            Bus Details
          </TabsTrigger>
          <TabsTrigger value="passengers" className="flex-1">
            <Users className="h-4 w-4 mr-2" />
            Passengers ({passengers?.length || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="bus">
          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Registration</span>
                <span className="font-semibold">{trip.bus?.registration_number}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Model</span>
                <span className="font-medium">{trip.bus?.model}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Capacity</span>
                <span className="font-medium">{trip.bus?.capacity} seats</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Available Seats</span>
                <span className="font-medium">{trip.available_seats ?? '--'}</span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="passengers">
          <Card>
            <CardContent className="p-4">
              {passengers && passengers.length > 0 ? (
                <div className="space-y-3">
                  {passengers.map((booking) => (
                    <div key={booking.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div>
                        <p className="font-medium">{booking.booking_number}</p>
                        <p className="text-sm text-muted-foreground">
                          {booking.boarding_stop?.stop_name} → {booking.alighting_stop?.stop_name}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline">{booking.passenger_count} pax</Badge>
                        <p className="text-sm text-muted-foreground mt-1">
                          Seats: {booking.seat_numbers.join(', ')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No confirmed bookings yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4">
        {trip.status === 'scheduled' && (
          <Button 
            className="flex-1 h-14 text-lg"
            onClick={() => setShowStartDialog(true)}
          >
            <Play className="h-5 w-5 mr-2" />
            Start Trip
          </Button>
        )}
        
        {trip.status === 'in_progress' && (
          <Button 
            variant="destructive"
            className="flex-1 h-14 text-lg"
            onClick={() => setShowEndDialog(true)}
          >
            <Square className="h-5 w-5 mr-2" />
            End Trip
          </Button>
        )}

        <Button 
          variant="outline"
          className="h-14"
          onClick={() => navigate('/driver/incidents', { state: { tripId: trip.id, busId: trip.bus_id } })}
        >
          <AlertTriangle className="h-5 w-5" />
        </Button>
      </div>

      {/* Dialogs */}
      <AlertDialog open={showStartDialog} onOpenChange={setShowStartDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Start Trip?</AlertDialogTitle>
            <AlertDialogDescription>
              This will mark your trip as in progress and start GPS tracking to share your location with passengers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleStartTrip}>
              Start Trip
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showEndDialog} onOpenChange={setShowEndDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>End Trip?</AlertDialogTitle>
            <AlertDialogDescription>
              This will mark your trip as completed and stop GPS tracking.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleEndTrip}>
              End Trip
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
import { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { MapPin, Bus, Clock, Navigation, Search, RefreshCw, Wifi, WifiOff, Route, Share2 } from 'lucide-react';
import { useBuses } from '@/hooks/useBuses';
import { useSchedules } from '@/hooks/useSchedules';
import { useRoutes } from '@/hooks/useRoutes';
import { useMapboxToken } from '@/hooks/useMapboxToken';
import { useRealtimeBusLocations } from '@/hooks/useGPSTracking';
import MapboxMap from '@/components/tracking/MapboxMap';
import GPSHealthIndicator from '@/components/tracking/GPSHealthIndicator';
import { formatDistanceToNow, format } from 'date-fns';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface BusLocation {
  id: string;
  registration_number: string;
  model: string;
  lat: number;
  lng: number;
  speed: number;
  heading: number;
  lastUpdate?: string;
  isOnTrip?: boolean;
  tripInfo?: {
    routeName: string;
    origin: string;
    destination: string;
    status: string;
  };
  route?: {
    name: string;
    origin: string;
    destination: string;
  };
  bookingId?: string;
}

export default function TrackingPage() {
  const navigate = useNavigate();
  const { role, user } = useAuth();
  const queryClient = useQueryClient();
  const isPassenger = role === 'passenger';

  const { data: buses } = useBuses();
  const { data: schedules } = useSchedules();
  const { data: routes } = useRoutes();
  const { token: mapboxToken, loading: tokenLoading, error: tokenError } = useMapboxToken();
  const { locations: realtimeLocations, isConnected } = useRealtimeBusLocations();

  const [selectedBus, setSelectedBus] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch passenger's bookings for today (only for passengers)
  const { data: passengerBookings, isLoading: bookingsLoading } = useQuery({
    queryKey: ['passenger-bookings-tracking', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const today = format(new Date(), 'yyyy-MM-dd');
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          id,
          trip_id,
          status,
          trip:trips(
            id,
            bus_id,
            status,
            trip_date,
            route:routes(name, origin, destination)
          )
        `)
        .eq('user_id', user.id)
        .eq('status', 'confirmed');

      if (error) throw error;

      return (data || []).filter((booking: any) =>
        booking.trip?.trip_date === today &&
        booking.trip?.status === 'in_progress'
      );
    },
    enabled: isPassenger && !!user?.id,
    refetchInterval: 10000,
  });

  const passengerAllowedBusIds = useMemo(() => {
    if (!isPassenger || !passengerBookings) return null;
    return new Set(passengerBookings.map((b: any) => b.trip?.bus_id).filter(Boolean));
  }, [isPassenger, passengerBookings]);

  const passengerBookingByBusId = useMemo(() => {
    if (!passengerBookings) return new Map<string, any>();
    const map = new Map<string, any>();
    passengerBookings.forEach((b: any) => {
      if (b.trip?.bus_id) map.set(b.trip.bus_id, b);
    });
    return map;
  }, [passengerBookings]);

  // Fetch active trips
  const { data: activeTrips } = useQuery({
    queryKey: ['active-trips-tracking'],
    queryFn: async () => {
      const today = format(new Date(), 'yyyy-MM-dd');
      const { data, error } = await supabase
        .from('trips')
        .select(`
          id,
          bus_id,
          status,
          route:routes(name, origin, destination)
        `)
        .eq('trip_date', today)
        .eq('status', 'in_progress');

      if (error) throw error;
      return data || [];
    },
    refetchInterval: 10000,
  });

  const getBusTripInfo = useCallback((busId: string) => {
    const trip = activeTrips?.find((t: any) => t.bus_id === busId);
    if (!trip) return null;
    return {
      routeName: trip.route?.name || 'Unknown Route',
      origin: trip.route?.origin || '',
      destination: trip.route?.destination || '',
      status: trip.status,
    };
  }, [activeTrips]);

  const getRouteForBus = useCallback((busId: string) => {
    const schedule = schedules?.find((s: any) => s.bus_id === busId);
    if (!schedule) return null;
    return routes?.find((r: any) => r.id === schedule.route_id);
  }, [schedules, routes]);

  // Traccar-only: only show buses with real GPS data from bus_locations
  const busLocations = useMemo((): BusLocation[] => {
    let locations = realtimeLocations
      .map((loc: any) => {
        const bus = buses?.find((b: any) => b.id === loc.bus_id);
        if (!bus) return null;

        if (isPassenger && passengerAllowedBusIds && !passengerAllowedBusIds.has(bus.id)) {
          return null;
        }

        const route = getRouteForBus(bus.id);
        const tripInfo = getBusTripInfo(bus.id);
        const booking = passengerBookingByBusId.get(bus.id);

        return {
          id: bus.id,
          registration_number: bus.registration_number,
          model: bus.model,
          lat: Number(loc.latitude),
          lng: Number(loc.longitude),
          speed: loc.speed == null ? 0 : Number(loc.speed),
          heading: Number(loc.heading) || 0,
          lastUpdate: loc.recorded_at,
          isOnTrip: !!tripInfo,
          tripInfo,
          route: route ? {
            name: route.name,
            origin: route.origin,
            destination: route.destination,
          } : undefined,
          bookingId: booking?.id,
        };
      })
      .filter(Boolean) as BusLocation[];

    return locations;
  }, [buses, realtimeLocations, isPassenger, passengerAllowedBusIds, passengerBookingByBusId, getRouteForBus, getBusTripInfo]);

  const createShareMutation = useMutation({
    mutationFn: async (bookingId: string) => {
      const { data: existing } = await supabase
        .from('location_shares')
        .select('share_token')
        .eq('booking_id', bookingId)
        .limit(1)
        .maybeSingle();

      if (existing?.share_token) {
        return existing.share_token;
      }

      const token = crypto.randomUUID().replace(/-/g, '').slice(0, 16);
      const { error } = await supabase
        .from('location_shares')
        .insert({ share_token: token, booking_id: bookingId });

      if (error) throw error;
      return token;
    },
    onSuccess: (token) => {
      const url = `${window.location.origin}/track/${token}`;
      navigator.clipboard.writeText(url);
      toast.success('Share link copied to clipboard!');
    },
    onError: (err: Error) => {
      toast.error('Failed to create share link: ' + err.message);
    },
  });

  const handleShareLocation = (bookingId: string) => {
    createShareMutation.mutate(bookingId);
  };

  const filteredBuses = useMemo(() => {
    return busLocations.filter((bus) =>
      bus.registration_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bus.model?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [busLocations, searchTerm]);

  const selectedBusData = busLocations.find(b => b.id === selectedBus);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold">Live Tracking</h1>
          <p className="text-muted-foreground mt-1">
            {isPassenger
              ? 'Track your bus in real-time (Traccar GPS only)'
              : 'Track buses in real-time from Traccar GPS'
            }
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Badge
            variant={isConnected ? "default" : "secondary"}
            className={isConnected ? "bg-success" : ""}
          >
            {isConnected ? (
              <><Wifi className="h-3 w-3 mr-1" /> Live</>
            ) : (
              <><WifiOff className="h-3 w-3 mr-1" /> Connecting...</>
            )}
          </Badge>

          {(role === 'admin' || role === 'driver') && (
            <Button variant="outline" onClick={() => navigate('/driver-app')}>
              Driver App
            </Button>
          )}

          <Button variant="outline" onClick={() => window.location.reload()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      <GPSHealthIndicator locations={realtimeLocations} isConnected={isConnected} />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bus className="h-5 w-5 text-primary" />
              {isPassenger ? 'Your Bus' : 'Active Buses'}
            </CardTitle>
            <CardDescription>
              {isPassenger
                ? (busLocations.length > 0
                  ? `Tracking your bus in real-time`
                  : 'Waiting for your trip to start and GPS data...'
                )
                : `${busLocations.length} buses with live GPS`
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search buses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>

            <div className="space-y-2 max-h-[500px] overflow-auto">
              {filteredBuses.map((bus) => (
                <div
                  key={bus.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedBus === bus.id
                      ? 'bg-primary/10 border-primary'
                      : 'hover:bg-muted'
                  }`}
                  onClick={() => setSelectedBus(bus.id)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold">{bus.registration_number}</span>
                    <div className="flex items-center gap-1">
                      {bus.isOnTrip ? (
                        <Badge variant="default" className="bg-primary text-xs">
                          <Route className="h-3 w-3 mr-1" />
                          On Trip
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs">
                          Idle
                        </Badge>
                      )}
                      <Badge variant="default" className="bg-success text-xs">
                        <Wifi className="h-3 w-3 mr-1" />
                        Live
                      </Badge>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">{bus.model}</p>
                  {bus.isOnTrip && bus.tripInfo && (
                    <div className="flex items-center gap-1 mt-2 text-xs text-primary font-medium">
                      <MapPin className="h-3 w-3" />
                      {bus.tripInfo.origin} → {bus.tripInfo.destination}
                    </div>
                  )}
                  <div className="flex items-center gap-4 mt-2 text-xs">
                    <span className="flex items-center gap-1">
                      <Navigation className="h-3 w-3" />
                      {Math.round(bus.speed)} km/h
                    </span>
                    {bus.lastUpdate && (
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {formatDistanceToNow(new Date(bus.lastUpdate), { addSuffix: true })}
                      </span>
                    )}
                  </div>
                  {isPassenger && bus.bookingId && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2 w-full"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleShareLocation(bus.bookingId!);
                      }}
                      disabled={createShareMutation.isPending}
                    >
                      <Share2 className="h-4 w-4 mr-2" />
                      Share live location
                    </Button>
                  )}
                </div>
              ))}

              {filteredBuses.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Bus className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  {isPassenger ? (
                    <>
                      <p className="font-medium">No active trips to track</p>
                      <p className="text-sm mt-2">
                        Bus tracking will appear once your trip starts and Traccar sends GPS data.
                      </p>
                    </>
                  ) : (
                    <p>No buses with live GPS data</p>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              Live Map
            </CardTitle>
            <CardDescription>Real-time bus locations from Traccar GPS</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative h-[500px] rounded-lg overflow-hidden bg-muted">
              {tokenLoading ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Loading map token...</p>
                  </div>
                </div>
              ) : tokenError ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="max-w-md text-center p-6">
                    <Bus className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                    <h3 className="font-semibold">Map unavailable</h3>
                    <p className="text-sm text-muted-foreground mt-1">{tokenError}</p>
                  </div>
                </div>
              ) : (
                <MapboxMap
                  buses={busLocations}
                  selectedBusId={selectedBus}
                  onBusSelect={setSelectedBus}
                  mapboxToken={mapboxToken}
                />
              )}
            </div>

            {selectedBusData && (
              <div className="mt-4 p-4 rounded-lg bg-muted">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  Selected Bus Details
                  <Badge variant="default" className="bg-success text-xs">
                    <Wifi className="h-3 w-3 mr-1" /> Live GPS
                  </Badge>
                </h4>
                <div className="grid gap-2 md:grid-cols-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Registration:</span>
                    <p className="font-medium">{selectedBusData.registration_number}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Speed:</span>
                    <p className="font-medium">{Math.round(selectedBusData.speed)} km/h</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Route:</span>
                    <p className="font-medium">{selectedBusData.route?.name || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Last Update:</span>
                    <p className="font-medium">
                      {selectedBusData.lastUpdate
                        ? formatDistanceToNow(new Date(selectedBusData.lastUpdate), { addSuffix: true })
                        : '—'
                      }
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

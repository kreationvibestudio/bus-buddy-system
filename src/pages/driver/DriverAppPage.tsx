import { useState, useEffect } from 'react';
import { useCapacitorGPS } from '@/hooks/useCapacitorGPS';
import { useAuth } from '@/contexts/AuthContext';
import { useDriverTrips, useStartTrip, useEndTrip } from '@/hooks/useDriverTrips';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import GPSDiagnosticsPanel from '@/components/driver/GPSDiagnosticsPanel';
import { format } from 'date-fns';
import { toast } from 'sonner';
import {
  MapPin,
  Navigation,
  Play,
  Square,
  Bus,
  Route,
  Clock,
  Users,
  Signal,
  SignalZero,
  SignalHigh,
  SignalLow,
  Loader2,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';

interface DriverInfo {
  id: string;
  busId: string | null;
  busRegistration: string | null;
}

export default function DriverAppPage() {
  const { user } = useAuth();
  const [driverInfo, setDriverInfo] = useState<DriverInfo | null>(null);
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);
  const [isLoadingDriver, setIsLoadingDriver] = useState(true);

  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const { data: trips, isLoading: tripsLoading, refetch: refetchTrips } = useDriverTrips(todayStr);
  const startTripMutation = useStartTrip();
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const endTripMutation = useEndTrip();

  // Get current in-progress trip
  const activeTrip = trips?.find(t => t.status === 'in_progress');
  const currentTripId = activeTrip?.id || selectedTripId;

  // Get the bus_id from either driver assignment OR active trip (fallback)
  const activeBusId = driverInfo?.busId || activeTrip?.bus?.id || null;

  // Track if we want GPS enabled
  const [gpsEnabled, setGpsEnabled] = useState(false);

  // Log GPS enablement conditions for debugging
  useEffect(() => {
    console.log('[DriverAppPage] GPS Enablement Check:', {
      gpsEnabled,
      driverBusId: driverInfo?.busId,
      tripBusId: activeTrip?.bus?.id,
      activeBusId,
      currentTripId,
      willEnable: gpsEnabled && !!activeBusId && !!currentTripId,
    });
  }, [gpsEnabled, driverInfo?.busId, activeTrip?.bus?.id, activeBusId, currentTripId]);

  // Initialize GPS tracking - use activeBusId which includes trip fallback
  const {
    position,
    isTracking,
    error: gpsError,
    permissionStatus,
    isNative,
    stage,
    diagnostics,
    startTracking,
    stopTracking,
    getCurrentPosition,
    requestPermissions,
  } = useCapacitorGPS({
    tripId: currentTripId || undefined,
    busId: activeBusId || undefined,
    updateIntervalMs: 15000,
    enabled: gpsEnabled && !!activeBusId && !!currentTripId,
  });

  // Fetch driver info and assigned bus
  useEffect(() => {
    async function fetchDriverInfo() {
      if (!user?.id) return;

      try {
        // Get driver record
        const { data: driver, error: driverError } = await supabase
          .from('drivers')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (driverError || !driver) {
          console.error('Driver not found:', driverError);
          setIsLoadingDriver(false);
          return;
        }

        // Get assigned bus
        const { data: bus, error: busError } = await supabase
          .from('buses')
          .select('id, registration_number')
          .eq('current_driver_id', driver.id)
          .single();

        setDriverInfo({
          id: driver.id,
          busId: bus?.id || null,
          busRegistration: bus?.registration_number || null,
        });
      } catch (err) {
        console.error('Error fetching driver info:', err);
      } finally {
        setIsLoadingDriver(false);
      }
    }

    fetchDriverInfo();
  }, [user?.id]);

  // Auto-refresh every 10 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      refetchTrips();
      setLastRefresh(new Date());
      toast.info('Data refreshed');
    }, 10 * 60 * 1000); // 10 minutes

    return () => clearInterval(interval);
  }, [refetchTrips]);

  // Ensure GPS tracking stays ON while a trip is in progress (even after app reload)
  // Use activeBusId which falls back to trip's bus_id if driver isn't assigned
  useEffect(() => {
    const shouldTrack = !!activeTrip?.id && !!activeBusId;
    
    console.log('[DriverAppPage] Auto-track check:', {
      activeTripId: activeTrip?.id,
      activeBusId,
      shouldTrack,
      isTracking,
    });

    if (shouldTrack) {
      setGpsEnabled(true);
      if (!isTracking) {
        console.log('[DriverAppPage] Auto-starting GPS tracking...');
        startTracking();
      }
      return;
    }

    // If no active trip, stop tracking
    setGpsEnabled(false);
    if (isTracking) {
      console.log('[DriverAppPage] Auto-stopping GPS tracking...');
      stopTracking();
    }
  }, [activeTrip?.id, activeBusId, isTracking, startTracking, stopTracking]);

  const handleStartTrip = async (tripId: string) => {
    try {
      console.log('[DriverAppPage] Starting trip:', tripId);
      // First set the trip ID so GPS hook has access to it
      setSelectedTripId(tripId);
      await startTripMutation.mutateAsync(tripId);
      // Enable GPS and explicitly start tracking after trip starts
      console.log('[DriverAppPage] Trip started, enabling GPS tracking...');
      setGpsEnabled(true);
      // Small delay to ensure state is updated before starting tracking
      setTimeout(async () => {
        await startTracking();
        console.log('[DriverAppPage] GPS tracking started');
      }, 100);
    } catch (err) {
      console.error('[DriverAppPage] Failed to start trip:', err);
      setSelectedTripId(null);
    }
  };

  const handleEndTrip = async (tripId: string) => {
    try {
      console.log('[DriverAppPage] Ending trip:', tripId);
      await stopTracking();
      setGpsEnabled(false);
      await endTripMutation.mutateAsync(tripId);
      setSelectedTripId(null);
      console.log('[DriverAppPage] Trip ended, GPS tracking stopped');
    } catch (err) {
      console.error('[DriverAppPage] Failed to end trip:', err);
    }
  };

  const handleToggleTracking = async () => {
    if (isTracking) {
      await stopTracking();
      setGpsEnabled(false);
    } else {
      setGpsEnabled(true);
      await startTracking();
    }
  };

  const getGPSStatusIcon = () => {
    if (!isTracking) return <SignalZero className="h-3 w-3" />;
    if (stage === 'tracking' && diagnostics.fixCount > 0) return <SignalHigh className="h-3 w-3" />;
    if (stage === 'acquiring' || stage === 'warming_up') return <SignalLow className="h-3 w-3 animate-pulse" />;
    return <Signal className="h-3 w-3" />;
  };

  const getGPSStatusText = () => {
    if (!isTracking) return 'GPS Off';
    if (stage === 'tracking' && diagnostics.fixCount > 0) return 'GPS Active';
    if (stage === 'acquiring') return 'Acquiring...';
    if (stage === 'warming_up') return 'Warming Up...';
    return 'GPS On';
  };

  const getGPSStatusVariant = () => {
    if (!isTracking) return 'outline';
    if (stage === 'tracking' && diagnostics.fixCount > 0) return 'secondary';
    return 'outline';
  };

  if (isLoadingDriver) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-primary" />
          <p className="text-muted-foreground">Loading driver info...</p>
        </div>
      </div>
    );
  }

  if (!driverInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-destructive" />
            <h2 className="text-xl font-semibold mb-2">Driver Profile Incomplete</h2>
            <p className="text-muted-foreground mb-4">
              Your account has the driver role but is missing a linked driver profile with license information.
            </p>
            <p className="text-sm text-muted-foreground">
              Please contact your administrator to complete your driver profile setup. They can fix this from the Drivers management page.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-primary text-primary-foreground p-4 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bus className="h-6 w-6" />
            <span className="font-semibold text-lg">EagleLine Driver</span>
          </div>
          <Badge variant={getGPSStatusVariant() as any} className="gap-1">
            {getGPSStatusIcon()}
            {getGPSStatusText()}
          </Badge>
        </div>
      </div>

      <div className="p-4 space-y-4 max-w-lg mx-auto">
        {/* Bus Info Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Bus className="h-4 w-4" />
              Assigned Vehicle
            </CardTitle>
          </CardHeader>
          <CardContent>
            {driverInfo.busId ? (
              <div className="flex items-center justify-between">
                <span className="font-mono text-lg">{driverInfo.busRegistration}</span>
                <Badge variant="outline">Ready</Badge>
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">No bus assigned</p>
            )}
          </CardContent>
        </Card>

        {/* GPS Status Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Navigation className="h-4 w-4" />
              GPS Status
            </CardTitle>
            <CardDescription>
              {isNative ? 'Native GPS' : 'Web Geolocation'} • 
              Permission: {permissionStatus?.location || 'unknown'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {gpsError && (
              <div className="bg-destructive/10 text-destructive text-sm p-2 rounded flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {gpsError}
              </div>
            )}

            {/* GPS Stage Indicator */}
            {isTracking && stage !== 'tracking' && (
              <div className="bg-warning/10 text-warning-foreground text-sm p-2 rounded flex items-center gap-2">
                <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
                {stage === 'warming_up' && 'GPS warming up - please wait...'}
                {stage === 'acquiring' && 'Acquiring GPS signal - move to an open area if possible...'}
              </div>
            )}

            {position ? (
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="bg-muted p-2 rounded">
                  <span className="text-muted-foreground block text-xs">Latitude</span>
                  <span className="font-mono">{position.latitude.toFixed(6)}</span>
                </div>
                <div className="bg-muted p-2 rounded">
                  <span className="text-muted-foreground block text-xs">Longitude</span>
                  <span className="font-mono">{position.longitude.toFixed(6)}</span>
                </div>
                <div className="bg-muted p-2 rounded">
                  <span className="text-muted-foreground block text-xs">Speed</span>
                  <span className="font-mono">
                    {position.speed != null ? `${(position.speed * 3.6).toFixed(1)} km/h` : 'N/A'}
                  </span>
                </div>
                <div className="bg-muted p-2 rounded">
                  <span className="text-muted-foreground block text-xs">Accuracy</span>
                  <span className="font-mono">{position.accuracy.toFixed(0)}m</span>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground text-sm text-center py-4">
                {isTracking ? 'Waiting for GPS fix...' : 'No position data yet'}
              </p>
            )}

            <div className="flex gap-2">
              <Button
                onClick={handleToggleTracking}
                variant={isTracking ? "destructive" : "default"}
                className="flex-1"
                disabled={!activeBusId || !currentTripId}
              >
                {isTracking ? (
                  <>
                    <Square className="h-4 w-4 mr-2" />
                    Stop Tracking
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Start Tracking
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={getCurrentPosition}
                disabled={!activeBusId}
              >
                <MapPin className="h-4 w-4" />
              </Button>
            </div>

            {!activeBusId && (
              <p className="text-xs text-muted-foreground text-center">
                No bus assigned - tracking disabled
              </p>
            )}
            {activeBusId && !currentTripId && (
              <p className="text-xs text-muted-foreground text-center">
                Start a trip below to enable GPS tracking
              </p>
            )}
          </CardContent>
        </Card>

        {/* GPS Diagnostics Panel */}
        <GPSDiagnosticsPanel
          diagnostics={diagnostics}
          position={position}
          isTracking={isTracking}
          isNative={isNative}
          onRefreshPosition={getCurrentPosition}
          onRequestPermissions={requestPermissions}
        />

        {/* Today's Trips */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Route className="h-4 w-4" />
                Today's Trips
              </CardTitle>
              <Button variant="ghost" size="icon" onClick={() => {
                refetchTrips();
                setLastRefresh(new Date());
                toast.info('Data refreshed');
              }}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {tripsLoading ? (
              <div className="text-center py-4">
                <Loader2 className="h-6 w-6 animate-spin mx-auto" />
              </div>
            ) : trips && trips.length > 0 ? (
              <div className="space-y-3">
                {trips.map((trip) => (
                  <div
                    key={trip.id}
                    className="border rounded-lg p-3 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{trip.route?.name || 'Unknown Route'}</span>
                      <Badge variant={
                        trip.status === 'completed' ? 'default' :
                        trip.status === 'in_progress' ? 'secondary' :
                        'outline'
                      }>
                        {trip.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {trip.departure_time?.slice(0, 5)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {trip.available_seats || 0} seats
                      </span>
                    </div>

                    {trip.status === 'scheduled' && (
                      <Button
                        size="sm"
                        className="w-full mt-2"
                        onClick={() => handleStartTrip(trip.id)}
                        disabled={startTripMutation.isPending || (!driverInfo.busId && !trips?.find(t => t.id === trip.id)?.bus?.id)}
                      >
                        {startTripMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <Play className="h-4 w-4 mr-2" />
                        )}
                        Start Trip
                      </Button>
                    )}

                    {trip.status === 'in_progress' && (
                      <Button
                        size="sm"
                        variant="destructive"
                        className="w-full mt-2"
                        onClick={() => handleEndTrip(trip.id)}
                        disabled={endTripMutation.isPending}
                      >
                        {endTripMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                        )}
                        End Trip
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm text-center py-4">
                No trips scheduled for today
              </p>
            )}
          </CardContent>
        </Card>

        {/* Platform Info */}
        <div className="text-center text-xs text-muted-foreground pt-4">
          <p>Platform: {isNative ? 'Native Android' : 'Web Browser'}</p>
          <p className="mt-1">GPS updates every 15 seconds • Auto-refresh every 10 min</p>
          <p className="mt-1">Last refresh: {format(lastRefresh, 'HH:mm:ss')}</p>
          {diagnostics.fixCount > 0 && (
            <p className="mt-1 text-success">GPS Fixes: {diagnostics.fixCount}</p>
          )}
        </div>
      </div>
    </div>
  );
}

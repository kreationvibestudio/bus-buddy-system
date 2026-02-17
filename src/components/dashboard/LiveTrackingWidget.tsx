import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Navigation, Gauge, Compass, MapPinned } from 'lucide-react';
import { useRealtimeBusLocations } from '@/hooks/useGPSTracking';
import { useBuses } from '@/hooks/useBuses';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { formatDistanceToNow } from 'date-fns';

function headingToCardinal(deg: number): string {
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  return dirs[Math.round(deg / 45) % 8] || '';
}

function formatOdometer(km: number): string {
  if (km >= 1000) return `${(km / 1000).toFixed(1)}k km`;
  return `${Math.round(km)} km`;
}

export function LiveTrackingWidget() {
  const navigate = useNavigate();
  const { locations: realtimeLocations } = useRealtimeBusLocations();
  const { data: buses } = useBuses();

  const { data: activeTrips } = useQuery({
    queryKey: ['active-trips-dashboard'],
    queryFn: async () => {
      const today = format(new Date(), 'yyyy-MM-dd');
      const { data, error } = await supabase
        .from('trips')
        .select('bus_id, route:routes(name, origin, destination)')
        .eq('trip_date', today)
        .eq('status', 'in_progress');
      if (error) throw error;
      return data || [];
    },
  });

  const busLocations = realtimeLocations
    .map((loc: any) => {
      const bus = buses?.find((b: any) => b.id === loc.bus_id);
      if (!bus) return null;
      const trip = activeTrips?.find((t: any) => t.bus_id === bus.id);
      return {
        id: bus.id,
        registration_number: bus.registration_number,
        speed: loc.speed ?? 0,
        heading: loc.heading ?? 0,
        odometerKm: loc.odometer_km,
        geofenceName: loc.geofence_name,
        lastUpdate: loc.recorded_at,
        route: trip?.route,
      };
    })
    .filter(Boolean)
    .slice(0, 5);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            Live Tracking (Traccar)
          </CardTitle>
          <CardDescription>
            Speed, direction, odometer from Traccar devices
          </CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={() => navigate('/tracking')}>
          View Map
        </Button>
      </CardHeader>
      <CardContent>
        {busLocations.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            No buses with Traccar data. Ensure devices are mapped and sending data.
          </p>
        ) : (
          <div className="space-y-3">
            {busLocations.map((bus: any) => (
              <div
                key={bus.id}
                className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 cursor-pointer transition-colors"
                onClick={() => navigate('/tracking')}
              >
                <div>
                  <p className="font-medium">{bus.registration_number}</p>
                  {bus.route && (
                    <p className="text-xs text-muted-foreground">
                      {bus.route.origin} → {bus.route.destination}
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="flex items-center gap-1">
                    <Navigation className="h-3 w-3" />
                    {Math.round(bus.speed)} km/h
                  </span>
                  {bus.heading > 0 && (
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <Compass className="h-3 w-3" />
                      {Math.round(bus.heading)}° {headingToCardinal(bus.heading)}
                    </span>
                  )}
                  {bus.odometerKm != null && (
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <Gauge className="h-3 w-3" />
                      {formatOdometer(bus.odometerKm)}
                    </span>
                  )}
                  {bus.geofenceName && (
                    <Badge variant="outline" className="text-xs">
                      <MapPinned className="h-3 w-3 mr-1" />
                      {bus.geofenceName}
                    </Badge>
                  )}
                  {bus.lastUpdate && (
                    <span className="text-muted-foreground">
                      {formatDistanceToNow(new Date(bus.lastUpdate), { addSuffix: true })}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

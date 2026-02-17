import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bus, MapPin, Navigation, Clock, AlertCircle } from 'lucide-react';
import MapboxMap from '@/components/tracking/MapboxMap';
import { useMapboxToken } from '@/hooks/useMapboxToken';
import { formatDistanceToNow } from 'date-fns';

interface SharedLocationData {
  bus: { id: string; registration_number: string; model: string };
  route: { name: string; origin: string; destination: string };
  location: { lat: number; lng: number; speed: number; heading: number; lastUpdate: string } | null;
}

export default function ShareTrackPage() {
  const { token } = useParams<{ token: string }>();
  const { token: mapboxToken, loading: tokenLoading, error: tokenError } = useMapboxToken();
  const [data, setData] = useState<SharedLocationData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      setError('Invalid share link');
      setLoading(false);
      return;
    }

    const fetchLocation = async () => {
      try {
        const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-shared-location?token=${encodeURIComponent(token)}`;
        const res = await fetch(url, {
          headers: {
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '',
          },
        });
        const json = await res.json();

        if (!res.ok) {
          setError(json.error || 'Failed to load location');
          return;
        }

        setData(json);
      } catch (err) {
        setError('Failed to load location');
      } finally {
        setLoading(false);
      }
    };

    fetchLocation();

    const interval = setInterval(fetchLocation, 10000);
    return () => clearInterval(interval);
  }, [token]);

  const busLocations = data?.location
    ? [{
        id: data.bus.id,
        registration_number: data.bus.registration_number,
        model: data.bus.model,
        lat: data.location.lat,
        lng: data.location.lng,
        speed: data.location.speed,
        heading: data.location.heading,
        lastUpdate: data.location.lastUpdate,
        route: data.route,
      }]
    : [];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading live location...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              Unable to load
            </CardTitle>
            <CardDescription>
              {error || 'This share link may be invalid or expired.'}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-4xl mx-auto space-y-4">
        <div className="flex items-center gap-2">
          <Bus className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-xl font-bold">Live Bus Location</h1>
            <p className="text-sm text-muted-foreground">
              Shared with you in real-time
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              {data.bus.registration_number} – {data.bus.model}
            </CardTitle>
            <CardDescription>
              {data.route?.origin} → {data.route?.destination}
              {data.location && (
                <span className="block mt-1">
                  Last update: {formatDistanceToNow(new Date(data.location.lastUpdate), { addSuffix: true })}
                </span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.location && (
              <div className="flex flex-wrap gap-4 text-sm">
                <span className="flex items-center gap-1">
                  <Navigation className="h-4 w-4" />
                  {Math.round(data.location.speed)} km/h
                </span>
                {data.location.lastUpdate && (
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    Updated {formatDistanceToNow(new Date(data.location.lastUpdate), { addSuffix: true })}
                  </span>
                )}
              </div>
            )}

            <div className="h-[400px] rounded-lg overflow-hidden bg-muted">
              {tokenLoading || tokenError ? (
                <div className="h-full flex items-center justify-center">
                  <p className="text-muted-foreground">
                    {tokenError || 'Loading map...'}
                  </p>
                </div>
              ) : data.location ? (
                <MapboxMap
                  buses={busLocations}
                  selectedBusId={data.bus.id}
                  onBusSelect={() => {}}
                  mapboxToken={mapboxToken || ''}
                />
              ) : (
                <div className="h-full flex items-center justify-center">
                  <p className="text-muted-foreground">Waiting for GPS data...</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

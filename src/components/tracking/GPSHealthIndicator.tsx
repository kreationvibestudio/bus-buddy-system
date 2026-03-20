import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Signal, 
  SignalLow, 
  SignalMedium, 
  SignalHigh, 
  Clock, 
  Activity,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';
import { formatDistanceToNow, differenceInSeconds } from 'date-fns';

interface GPSHealthIndicatorProps {
  locations: Array<{
    bus_id: string;
    latitude: number;
    longitude: number;
    speed: number | null;
    heading: number | null;
    recorded_at: string;
  }>;
  isConnected: boolean;
}

interface GPSHealth {
  status: 'excellent' | 'good' | 'fair' | 'poor' | 'offline';
  label: string;
  color: string;
  icon: React.ReactNode;
}

export default function GPSHealthIndicator({ locations, isConnected }: GPSHealthIndicatorProps) {
  const healthMetrics = useMemo(() => {
    if (!locations.length) {
      return {
        activeBuses: 0,
        recentUpdates: 0,
        avgUpdateAge: null,
        oldestUpdate: null,
        newestUpdate: null,
        health: {
          status: 'offline',
          label: 'No Data',
          color: 'bg-muted text-muted-foreground',
          icon: <Signal className="h-4 w-4" />
        } as GPSHealth
      };
    }

    const now = new Date();
    const updateAges = locations.map(loc => {
      const recordedAt = new Date(loc.recorded_at);
      return differenceInSeconds(now, recordedAt);
    });

    const avgAge = updateAges.reduce((a, b) => a + b, 0) / updateAges.length;
    const recentUpdates = updateAges.filter(age => age < 60).length; // Updates within last minute
    const oldestAge = Math.max(...updateAges);
    const newestAge = Math.min(...updateAges);

    // Determine health status based on average update age
    let health: GPSHealth;
    if (avgAge < 30) {
      health = {
        status: 'excellent',
        label: 'Excellent',
        color: 'bg-success text-success-foreground',
        icon: <SignalHigh className="h-4 w-4" />
      };
    } else if (avgAge < 60) {
      health = {
        status: 'good',
        label: 'Good',
        color: 'bg-success/80 text-success-foreground',
        icon: <SignalMedium className="h-4 w-4" />
      };
    } else if (avgAge < 120) {
      health = {
        status: 'fair',
        label: 'Fair',
        color: 'bg-warning text-warning-foreground',
        icon: <SignalLow className="h-4 w-4" />
      };
    } else if (avgAge < 300) {
      health = {
        status: 'poor',
        label: 'Poor',
        color: 'bg-destructive/80 text-destructive-foreground',
        icon: <AlertTriangle className="h-4 w-4" />
      };
    } else {
      health = {
        status: 'offline',
        label: 'Stale',
        color: 'bg-muted text-muted-foreground',
        icon: <Signal className="h-4 w-4" />
      };
    }

    return {
      activeBuses: locations.length,
      recentUpdates,
      avgUpdateAge: avgAge,
      oldestUpdate: oldestAge,
      newestUpdate: newestAge,
      health
    };
  }, [locations]);

  const formatAge = (seconds: number | null) => {
    if (seconds === null) return 'N/A';
    if (seconds < 60) return `${Math.round(seconds)}s ago`;
    if (seconds < 3600) return `${Math.round(seconds / 60)}m ago`;
    return `${Math.round(seconds / 3600)}h ago`;
  };

  return (
    <Card className="border-dashed">
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          {/* Overall Health */}
          <div className="flex items-center gap-3">
            <Badge className={`${healthMetrics.health.color} gap-1`}>
              {healthMetrics.health.icon}
              {healthMetrics.health.label}
            </Badge>
            <span className="text-sm text-muted-foreground">GPS Signal Quality</span>
          </div>

          {/* Connection Status */}
          <div className="flex items-center gap-2">
            {isConnected ? (
              <CheckCircle2 className="h-4 w-4 text-success" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-warning" />
            )}
            <span className="text-sm">
              {isConnected ? 'Realtime Connected' : 'Connecting...'}
            </span>
          </div>

          {/* Active Buses */}
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            <span className="text-sm">
              <strong>{healthMetrics.activeBuses}</strong> active
              {healthMetrics.recentUpdates > 0 && (
                <span className="text-muted-foreground ml-1">
                  ({healthMetrics.recentUpdates} updated &lt;1m)
                </span>
              )}
            </span>
          </div>

          {/* Last Update */}
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              Latest: {formatAge(healthMetrics.newestUpdate)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

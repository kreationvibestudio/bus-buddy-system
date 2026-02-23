import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Activity,
  CheckCircle2,
  XCircle,
  RefreshCw,
  MapPin,
  Wifi,
  Lock,
  Loader2,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useBuses } from '@/hooks/useBuses';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

interface CheckResult {
  name: string;
  status: 'ok' | 'error';
  latencyMs?: number;
  message?: string;
}

interface StatusResponse {
  ok: number;
  total: number;
  checks: CheckResult[];
  timestamp: string;
}

export default function SystemStatusPage() {
  const { role } = useAuth();
  const { data: buses } = useBuses();
  const [status, setStatus] = useState<StatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);
  const [testBusId, setTestBusId] = useState<string>('');
  const [gpsStatus, setGpsStatus] = useState<Array<{
    bus_id: string;
    registration_number: string;
    traccar_device_id: number | null;
    last_update: string | null;
    status: 'online' | 'offline' | 'no_data';
  }>>([]);
  const isAdmin = role === 'admin';

  const fetchStatus = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke<StatusResponse>('system-status');
      if (error) throw error;
      setStatus(data || null);
    } catch (e) {
      console.error('Status fetch error:', e);
      const msg = e instanceof Error ? e.message : 'Unknown error';
      toast.error('Failed to fetch system status: ' + msg);
      setStatus(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchGpsStatus = useCallback(async () => {
    if (!buses?.length) return;
    try {
      const { data: locations } = await supabase
        .from('bus_locations')
        .select('bus_id, recorded_at')
        .order('recorded_at', { ascending: false });

      const latestByBus = new Map<string, string>();
      locations?.forEach((loc) => {
        if (!latestByBus.has(loc.bus_id)) {
          latestByBus.set(loc.bus_id, loc.recorded_at);
        }
      });

      const now = Date.now();
      const twoMinutes = 2 * 60 * 1000;

      setGpsStatus(
        buses.map((bus) => {
          const lastUpdate = latestByBus.get(bus.id) || null;
          let status: 'online' | 'offline' | 'no_data' = 'no_data';
          if (bus.traccar_device_id == null) {
            status = 'no_data';
          } else if (lastUpdate) {
            const age = now - new Date(lastUpdate).getTime();
            status = age < twoMinutes ? 'online' : 'offline';
          } else {
            status = 'offline';
          }
          return {
            bus_id: bus.id,
            registration_number: bus.registration_number,
            traccar_device_id: bus.traccar_device_id,
            last_update: lastUpdate,
            status,
          };
        })
      );
    } catch (e) {
      console.error('GPS status error:', e);
    }
  }, [buses]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  useEffect(() => {
    fetchGpsStatus();
    const interval = setInterval(fetchGpsStatus, 30000);
    return () => clearInterval(interval);
  }, [fetchGpsStatus]);

  // Auto-select first bus with Traccar ID when buses load
  useEffect(() => {
    if (buses?.length && !testBusId) {
      const first = buses.find((b) => b.traccar_device_id != null);
      if (first) setTestBusId(first.id);
    }
  }, [buses, testBusId]);

  const handleTestWebhook = async () => {
    const bus = testBusId
      ? buses?.find((b) => b.id === testBusId)
      : buses?.find((b) => b.traccar_device_id != null);
    if (!bus?.traccar_device_id) {
      toast.error('Select a bus with Traccar Device ID set');
      return;
    }
    setTesting(true);
    try {
      const { data, error } = await supabase.functions.invoke('test-traccar-webhook', {
        body: { deviceId: bus.traccar_device_id },
      });
      if (error) throw error;
      if (data?.success) {
        toast.success(`Test OK — ${bus.registration_number} (device ${bus.traccar_device_id})`);
        fetchGpsStatus();
      } else {
        toast.error(data?.error || 'Test failed', { duration: 8000 });
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unknown error';
      toast.error(msg.includes('non-2xx') ? 'Test failed — check Fleet Management: Traccar Device ID must match Traccar → Devices → ID (integer)' : 'Test failed: ' + msg);
    } finally {
      setTesting(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="p-6">
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive font-medium">Access denied. Admin only.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Activity className="h-8 w-8 text-primary" />
            System Status
          </h1>
          <p className="text-muted-foreground mt-1">
            Monitor GPS trackers, connections, and services.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={fetchStatus} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Connection Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wifi className="h-5 w-5" />
            Service Connections
          </CardTitle>
          <CardDescription>
            Real-time status of Supabase, Vercel, GitHub, and Traccar
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading && !status ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading...
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {status?.checks.map((check) => (
                <div
                  key={check.name}
                  className={`flex items-center justify-between p-4 rounded-lg border ${
                    check.status === 'ok' ? 'border-green-500/30 bg-green-500/5' : 'border-destructive/30 bg-destructive/5'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {check.status === 'ok' ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    ) : (
                      <XCircle className="h-5 w-5 text-destructive" />
                    )}
                    <div>
                      <p className="font-medium">{check.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {check.latencyMs != null && `${check.latencyMs}ms`}
                        {check.message && ` • ${check.message}`}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          {status && (
            <p className="text-xs text-muted-foreground mt-4">
              Last checked: {formatDistanceToNow(new Date(status.timestamp), { addSuffix: true })}
            </p>
          )}
        </CardContent>
      </Card>

      {/* GPS Tracker Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            GPS Tracker Status
          </CardTitle>
          <CardDescription>
            Buses with Traccar Device ID and last GPS update
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Bus</TableHead>
                <TableHead>Traccar Device ID</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Update</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {gpsStatus.map((row) => (
                <TableRow key={row.bus_id}>
                  <TableCell className="font-medium">{row.registration_number}</TableCell>
                  <TableCell>{row.traccar_device_id ?? '-'}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        row.status === 'online'
                          ? 'default'
                          : row.status === 'offline'
                          ? 'secondary'
                          : 'outline'
                      }
                      className={
                        row.status === 'online'
                          ? 'bg-green-600'
                          : row.status === 'offline'
                          ? 'bg-amber-500/20 text-amber-700 dark:text-amber-400'
                          : ''
                      }
                    >
                      {row.status === 'online' ? 'Online' : row.status === 'offline' ? 'Offline' : 'No data'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {row.last_update
                      ? formatDistanceToNow(new Date(row.last_update), { addSuffix: true })
                      : 'Never'}
                  </TableCell>
                </TableRow>
              ))}
              {gpsStatus.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                    No buses found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Admin Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Admin Actions
          </CardTitle>
          <CardDescription>
            Test the Traccar webhook. Use the ID from Traccar → Devices (integer), not uniqueId/IMEI.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-end gap-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Bus to test</label>
              <Select value={testBusId} onValueChange={setTestBusId}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Select bus..." />
                </SelectTrigger>
                <SelectContent>
                  {buses
                    ?.filter((b) => b.traccar_device_id != null)
                    .map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.registration_number} (ID: {b.traccar_device_id})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              variant="outline"
              onClick={handleTestWebhook}
              disabled={testing || !buses?.some((b) => b.traccar_device_id != null)}
            >
              {testing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <MapPin className="h-4 w-4 mr-2" />
              )}
              Test Traccar Webhook
            </Button>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}

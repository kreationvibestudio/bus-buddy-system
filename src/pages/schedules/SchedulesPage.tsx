import { useState, useMemo, useEffect } from 'react';
import { useSchedules, useTrips, useTripsForDate, useCreateTrip, useUpdateTrip } from '@/hooks/useSchedules';
import { useRoutes } from '@/hooks/useRoutes';
import { useBuses } from '@/hooks/useBuses';
import { useDrivers } from '@/hooks/useDrivers';
import { useStartTrip } from '@/hooks/useDriverTrips';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Calendar, Clock, Search, CalendarPlus, Edit } from 'lucide-react';
import { formatCurrency } from '@/lib/currency';
import { format } from 'date-fns';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const defaultTripDate = format(new Date(), 'yyyy-MM-dd');

export default function SchedulesPage() {
  const [tripForm, setTripForm] = useState<{
    schedule_id?: string;
    route_id: string;
    bus_id: string;
    driver_id: string;
    trip_date: string;
    departure_time: string;
    arrival_time: string;
    available_seats: number;
    fare?: number;
  }>({
    route_id: '',
    bus_id: '',
    driver_id: '',
    trip_date: defaultTripDate,
    departure_time: '08:00',
    arrival_time: '09:00',
    available_seats: 40,
    fare: undefined,
  });

  const { data: schedules, isLoading: schedulesLoading } = useSchedules();
  const { data: trips, isLoading: tripsLoading } = useTrips();
  const { data: tripsOnSelectedDate } = useTripsForDate(tripForm.trip_date);
  const { data: routes } = useRoutes();
  const { data: buses } = useBuses();
  const { data: drivers } = useDrivers();
  const createTrip = useCreateTrip();
  const updateTrip = useUpdateTrip();
  const startTrip = useStartTrip();
  const { role } = useAuth();
  const [editingTrip, setEditingTrip] = useState<{ id: string; fare: number | null } | null>(null);

  // Exclude buses and drivers that already have a trip on the selected date
  const { availableBuses, availableDrivers } = useMemo(() => {
    const busyBusIds = new Set((tripsOnSelectedDate || []).map((t: { bus_id: string }) => t.bus_id).filter(Boolean));
    const busyDriverIds = new Set((tripsOnSelectedDate || []).map((t: { driver_id: string }) => t.driver_id).filter(Boolean));
    return {
      availableBuses: (buses || []).filter((b: { id: string; status: string }) => b.status === 'active' && !busyBusIds.has(b.id)),
      availableDrivers: (drivers || []).filter((d: { id: string; status: string }) => d.status === 'active' && !busyDriverIds.has(d.id)),
    };
  }, [buses, drivers, tripsOnSelectedDate]);

  // Clear bus/driver if they become unavailable when date changes
  useEffect(() => {
    const busyBusIds = new Set((tripsOnSelectedDate || []).map((t: { bus_id: string }) => t.bus_id).filter(Boolean));
    const busyDriverIds = new Set((tripsOnSelectedDate || []).map((t: { driver_id: string }) => t.driver_id).filter(Boolean));
    setTripForm((prev) => ({
      ...prev,
      ...(prev.bus_id && busyBusIds.has(prev.bus_id) ? { bus_id: '' } : {}),
      ...(prev.driver_id && busyDriverIds.has(prev.driver_id) ? { driver_id: '' } : {}),
    }));
  }, [tripForm.trip_date, tripsOnSelectedDate]);

  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('trips');
  const [isTripDialogOpen, setIsTripDialogOpen] = useState(false);

  const getStatusBadge = (status: string | null) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      scheduled: 'outline',
      in_progress: 'default',
      completed: 'secondary',
      cancelled: 'destructive',
    };
    return <Badge variant={variants[status || 'scheduled'] || 'outline'}>{status || 'scheduled'}</Badge>;
  };

  const openTripFromTemplate = (schedule: (typeof schedules)[0]) => {
    const dep = String(schedule.departure_time || '08:00').slice(0, 5);
    const arr = String(schedule.arrival_time || '09:00').slice(0, 5);
    setTripForm({
      schedule_id: schedule.id,
      route_id: schedule.route_id,
      bus_id: schedule.bus_id || '',
      driver_id: schedule.driver_id || '',
      trip_date: format(new Date(), 'yyyy-MM-dd'),
      departure_time: dep,
      arrival_time: arr,
      available_seats: 40,
      fare: undefined,
    });
    setActiveTab('trips');
    setIsTripDialogOpen(true);
  };

  const getTripFareDisplay = (trip: { fare?: number | null; route?: { base_fare?: number } | null }) => {
    if (trip.fare != null && trip.fare !== undefined) return trip.fare;
    return trip.route?.base_fare ?? null;
  };

  const handleTripSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = { ...tripForm };
      if (payload.fare === undefined || payload.fare === null || Number.isNaN(payload.fare)) delete (payload as any).fare;
      else (payload as any).fare = Number(payload.fare);
      await createTrip.mutateAsync(payload);
      setIsTripDialogOpen(false);
      setTripForm({
        route_id: '',
        bus_id: '',
        driver_id: '',
        trip_date: format(new Date(), 'yyyy-MM-dd'),
        departure_time: '08:00',
        arrival_time: '09:00',
        available_seats: 40,
        fare: undefined,
      });
    } catch (error) {
      // Error handled by mutation
    }
  };

  const filteredTrips = trips?.filter(trip =>
    trip.route?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    trip.bus?.registration_number?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (schedulesLoading || tripsLoading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Schedules & Trips</h1>
          <p className="text-muted-foreground">Manage schedule templates and trips</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="trips">Trips</TabsTrigger>
          <TabsTrigger value="schedules">Schedule Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="trips" className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Today's Trips</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {trips?.filter(t => t.trip_date === format(new Date(), 'yyyy-MM-dd')).length || 0}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Scheduled</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{trips?.filter(t => t.status === 'scheduled').length || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">In Progress</CardTitle>
                <div className="h-2 w-2 rounded-full bg-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{trips?.filter(t => t.status === 'in_progress').length || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Completed</CardTitle>
                <div className="h-2 w-2 rounded-full bg-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{trips?.filter(t => t.status === 'completed').length || 0}</div>
              </CardContent>
            </Card>
          </div>

          {/* Trips Table */}
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <CardTitle>All Trips</CardTitle>
                  <CardDescription>View and manage trips</CardDescription>
                </div>
                <div className="flex gap-2">
                  <div className="relative w-64">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search trips..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                  {role === 'admin' && (
                  <Dialog open={isTripDialogOpen} onOpenChange={setIsTripDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="gap-2">
                        <Plus className="h-4 w-4" />
                        Add Trip
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Create New Trip</DialogTitle>
                        <DialogDescription>Schedule a new trip</DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handleTripSubmit} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="route">Route</Label>
                          <Select value={tripForm.route_id} onValueChange={(value) => setTripForm({ ...tripForm, route_id: value })}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select route" />
                            </SelectTrigger>
                            <SelectContent>
                              {routes?.map((route) => (
                                <SelectItem key={route.id} value={route.id}>
                                  {route.name} ({route.origin} → {route.destination})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="bus">Bus</Label>
                            <Select value={tripForm.bus_id} onValueChange={(value) => setTripForm({ ...tripForm, bus_id: value })}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select bus" />
                              </SelectTrigger>
                              <SelectContent>
                                {availableBuses.map((bus: { id: string; registration_number: string; model: string }) => (
                                  <SelectItem key={bus.id} value={bus.id}>
                                    {bus.registration_number} - {bus.model}
                                  </SelectItem>
                                ))}
                                {availableBuses.length === 0 && (
                                  <div className="px-2 py-4 text-sm text-muted-foreground text-center">
                                    No buses available (all have trips on this date)
                                  </div>
                                )}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="driver">Driver</Label>
                            <Select value={tripForm.driver_id} onValueChange={(value) => setTripForm({ ...tripForm, driver_id: value })}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select driver" />
                              </SelectTrigger>
                              <SelectContent>
                                {availableDrivers.map((driver: { id: string; profile?: { full_name?: string }; license_number: string }) => (
                                  <SelectItem key={driver.id} value={driver.id}>
                                    {driver.profile?.full_name || driver.license_number}
                                  </SelectItem>
                                ))}
                                {availableDrivers.length === 0 && (
                                  <div className="px-2 py-4 text-sm text-muted-foreground text-center">
                                    No drivers available (all have trips on this date)
                                  </div>
                                )}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="trip_date">Trip Date</Label>
                          <Input
                            id="trip_date"
                            type="date"
                            value={tripForm.trip_date}
                            onChange={(e) => setTripForm({ ...tripForm, trip_date: e.target.value })}
                            required
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="departure">Departure Time</Label>
                            <Input
                              id="departure"
                              type="time"
                              value={tripForm.departure_time}
                              onChange={(e) => setTripForm({ ...tripForm, departure_time: e.target.value })}
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="arrival">Arrival Time</Label>
                            <Input
                              id="arrival"
                              type="time"
                              value={tripForm.arrival_time}
                              onChange={(e) => setTripForm({ ...tripForm, arrival_time: e.target.value })}
                              required
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="trip_fare">Fare (₦) per seat</Label>
                          <Input
                            id="trip_fare"
                            type="number"
                            step="0.01"
                            min={0}
                            placeholder="Leave empty to use route base fare"
                            value={tripForm.fare ?? ''}
                            onChange={(e) => {
                              const v = e.target.value;
                              setTripForm({ ...tripForm, fare: v === '' ? undefined : parseFloat(v) || undefined });
                            }}
                          />
                          <p className="text-xs text-muted-foreground">Optional. When empty, the route&apos;s base fare is used for bookings.</p>
                        </div>
                        <DialogFooter>
                          <Button type="button" variant="outline" onClick={() => setIsTripDialogOpen(false)}>
                            Cancel
                          </Button>
                          <Button type="submit" disabled={createTrip.isPending}>
                            Create Trip
                          </Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Route</TableHead>
                    <TableHead>Bus</TableHead>
                    <TableHead>Departure</TableHead>
                    <TableHead>Arrival</TableHead>
                    <TableHead>Fare</TableHead>
                    <TableHead>Available Seats</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTrips?.map((trip) => {
                    const fareDisplay = getTripFareDisplay(trip);
                    return (
                    <TableRow key={trip.id}>
                      <TableCell>{format(new Date(trip.trip_date), 'MMM d, yyyy')}</TableCell>
                      <TableCell className="font-medium">{trip.route?.name || '-'}</TableCell>
                      <TableCell>{trip.bus?.registration_number || '-'}</TableCell>
                      <TableCell>{trip.departure_time}</TableCell>
                      <TableCell>{trip.arrival_time}</TableCell>
                      <TableCell>
                        {fareDisplay != null ? formatCurrency(fareDisplay) : '—'}
                        {trip.fare != null && (
                          <span className="text-xs text-muted-foreground ml-1">(set)</span>
                        )}
                      </TableCell>
                      <TableCell>{trip.available_seats}</TableCell>
                      <TableCell>{getStatusBadge(trip.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                        {role === 'admin' && trip.status === 'scheduled' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setEditingTrip({ id: trip.id, fare: trip.fare ?? null })}
                            title="Set fare"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                        {trip.status === 'scheduled' && role === 'admin' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => startTrip.mutate(trip.id)}
                            disabled={startTrip.isPending}
                          >
                            {startTrip.isPending ? 'Starting...' : 'Start Trip'}
                          </Button>
                        )}
                        </div>
                      </TableCell>
                    </TableRow>
                    );
                  })}
                  {filteredTrips?.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                        No trips found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {role === 'admin' && (
            <Dialog open={!!editingTrip} onOpenChange={(open) => !open && setEditingTrip(null)}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Set trip fare</DialogTitle>
                  <DialogDescription>Override fare per seat for this trip. Leave empty to use the route&apos;s base fare.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit_fare">Fare (₦) per seat</Label>
                    <Input
                      id="edit_fare"
                      type="number"
                      step="0.01"
                      min={0}
                      placeholder="Use route base fare"
                      value={editingTrip?.fare ?? ''}
                      onChange={(e) => {
                        const v = e.target.value;
                        if (editingTrip) setEditingTrip({ ...editingTrip, fare: v === '' ? null : parseFloat(v) || null });
                      }}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setEditingTrip(null)}>Cancel</Button>
                  <Button
                    disabled={updateTrip.isPending}
                    onClick={async () => {
                      if (!editingTrip) return;
                      await updateTrip.mutateAsync({
                        id: editingTrip.id,
                        fare: editingTrip.fare === null || editingTrip.fare === undefined ? null : editingTrip.fare,
                      });
                      setEditingTrip(null);
                    }}
                  >
                    {updateTrip.isPending ? 'Saving...' : 'Save'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </TabsContent>

        <TabsContent value="schedules" className="space-y-6">
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Schedule Templates</CardTitle>
                <CardDescription>
                  Recurring patterns (e.g. Lagos–Benin at 8am daily). Click &quot;Create trip&quot; to plan a trip from a template—route, times, bus, and driver are prefilled.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Route</TableHead>
                    <TableHead>Bus</TableHead>
                    <TableHead>Departure</TableHead>
                    <TableHead>Arrival</TableHead>
                    <TableHead>Days</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {schedules?.map((schedule) => (
                    <TableRow
                      key={schedule.id}
                      className={role === 'admin' ? 'cursor-pointer hover:bg-muted/50' : ''}
                      onClick={role === 'admin' ? () => openTripFromTemplate(schedule) : undefined}
                    >
                      <TableCell className="font-medium">{schedule.route?.name || '-'}</TableCell>
                      <TableCell>{schedule.bus?.registration_number || '-'}</TableCell>
                      <TableCell>{schedule.departure_time}</TableCell>
                      <TableCell>{schedule.arrival_time}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {schedule.days_of_week?.map((day) => (
                            <Badge key={day} variant="outline" className="text-xs">
                              {DAYS[day]}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={schedule.is_active ? 'default' : 'secondary'}>
                          {schedule.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right" onClick={(e) => role === 'admin' && e.stopPropagation()}>
                        {role === 'admin' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openTripFromTemplate(schedule)}
                          className="gap-1.5"
                        >
                          <CalendarPlus className="h-3.5 w-3.5" />
                          Create trip
                        </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {schedules?.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                        No schedule templates. Add templates to quickly create trips from recurring patterns.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

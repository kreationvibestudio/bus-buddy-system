import { useState } from 'react';
import { useSchedules, useTrips, useCreateTrip } from '@/hooks/useSchedules';
import { useRoutes } from '@/hooks/useRoutes';
import { useBuses } from '@/hooks/useBuses';
import { useDrivers } from '@/hooks/useDrivers';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Calendar, Clock, Search } from 'lucide-react';
import { format } from 'date-fns';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function SchedulesPage() {
  const { data: schedules, isLoading: schedulesLoading } = useSchedules();
  const { data: trips, isLoading: tripsLoading } = useTrips();
  const { data: routes } = useRoutes();
  const { data: buses } = useBuses();
  const { data: drivers } = useDrivers();
  const createTrip = useCreateTrip();

  const [searchTerm, setSearchTerm] = useState('');
  const [isTripDialogOpen, setIsTripDialogOpen] = useState(false);
  const [tripForm, setTripForm] = useState({
    route_id: '',
    bus_id: '',
    driver_id: '',
    trip_date: format(new Date(), 'yyyy-MM-dd'),
    departure_time: '08:00',
    arrival_time: '09:00',
    available_seats: 40,
  });

  const getStatusBadge = (status: string | null) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      scheduled: 'outline',
      in_progress: 'default',
      completed: 'secondary',
      cancelled: 'destructive',
    };
    return <Badge variant={variants[status || 'scheduled'] || 'outline'}>{status || 'scheduled'}</Badge>;
  };

  const handleTripSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createTrip.mutateAsync(tripForm);
      setIsTripDialogOpen(false);
      setTripForm({
        route_id: '',
        bus_id: '',
        driver_id: '',
        trip_date: format(new Date(), 'yyyy-MM-dd'),
        departure_time: '08:00',
        arrival_time: '09:00',
        available_seats: 40,
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

      <Tabs defaultValue="trips" className="space-y-6">
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
                                {buses?.filter(b => b.status === 'active').map((bus) => (
                                  <SelectItem key={bus.id} value={bus.id}>
                                    {bus.registration_number} - {bus.model}
                                  </SelectItem>
                                ))}
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
                                {drivers?.filter(d => d.status === 'active').map((driver) => (
                                  <SelectItem key={driver.id} value={driver.id}>
                                    {driver.profile?.full_name || driver.license_number}
                                  </SelectItem>
                                ))}
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
                    <TableHead>Available Seats</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTrips?.map((trip) => (
                    <TableRow key={trip.id}>
                      <TableCell>{format(new Date(trip.trip_date), 'MMM d, yyyy')}</TableCell>
                      <TableCell className="font-medium">{trip.route?.name || '-'}</TableCell>
                      <TableCell>{trip.bus?.registration_number || '-'}</TableCell>
                      <TableCell>{trip.departure_time}</TableCell>
                      <TableCell>{trip.arrival_time}</TableCell>
                      <TableCell>{trip.available_seats}</TableCell>
                      <TableCell>{getStatusBadge(trip.status)}</TableCell>
                    </TableRow>
                  ))}
                  {filteredTrips?.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                        No trips found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="schedules" className="space-y-6">
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Schedule Templates</CardTitle>
                <CardDescription>Recurring schedule configurations</CardDescription>
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
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {schedules?.map((schedule) => (
                    <TableRow key={schedule.id}>
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
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

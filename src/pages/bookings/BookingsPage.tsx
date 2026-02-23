import { useState } from 'react';
import { useBookings, useCancelBooking } from '@/hooks/useBookings';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Ticket, Search, Users, XCircle, Banknote, Printer, FileText, UserPlus } from 'lucide-react';
import { format } from 'date-fns';
import { formatCurrency } from '@/lib/currency';
import { TicketPrintView } from '@/components/booking/TicketPrintView';
import { ManifestPrintView } from '@/components/booking/ManifestPrintView';
import { BookForPassengerDialog } from '@/components/booking/BookForPassengerDialog';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTrips } from '@/hooks/useSchedules';

export default function BookingsPage() {
  const { data: bookings, isLoading } = useBookings();
  const { data: trips } = useTrips();
  const cancelBooking = useCancelBooking();
  const [searchTerm, setSearchTerm] = useState('');
  const [printTicketBooking, setPrintTicketBooking] = useState<any>(null);
  const [selectedTripForManifest, setSelectedTripForManifest] = useState<string>('');
  const [printManifestTrip, setPrintManifestTrip] = useState<any>(null);
  const [bookForPassengerOpen, setBookForPassengerOpen] = useState(false);

  // Fetch passenger profile when ticket is opened
  const { data: profileData } = useQuery({
    queryKey: ['passenger-profile', printTicketBooking?.user_id],
    queryFn: async () => {
      if (!printTicketBooking?.user_id) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, phone')
        .eq('user_id', printTicketBooking.user_id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!printTicketBooking?.user_id,
  });

  const handlePrintTicket = (booking: any) => {
    setPrintTicketBooking(booking);
  };

  const filteredBookings = bookings?.filter(booking =>
    booking.booking_number?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      pending: 'outline',
      confirmed: 'default',
      cancelled: 'destructive',
      completed: 'secondary',
    };
    return <Badge variant={variants[status] || 'outline'}>{status}</Badge>;
  };

  const handleCancelBooking = async (id: string) => {
    await cancelBooking.mutateAsync({ id, reason: 'Cancelled by admin', isAdmin: true });
  };

  // Get manifest data for selected trip (must run before any early return to satisfy rules of hooks)
  const { data: manifestData } = useQuery({
    queryKey: ['trip-manifest', selectedTripForManifest],
    queryFn: async () => {
      if (!selectedTripForManifest) return { trip: null, passengers: [] };
      
      const { data: tripData, error: tripError } = await supabase
        .from('trips')
        .select(`
          id,
          trip_date,
          departure_time,
          arrival_time,
          route:routes(name, origin, destination),
          bus:buses(registration_number, capacity)
        `)
        .eq('id', selectedTripForManifest)
        .single();
      
      if (tripError || !tripData) return { trip: null, passengers: [] };

      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select(`
          booking_number,
          seat_numbers,
          passenger_count,
          total_fare,
          user_id,
          profile:profiles!bookings_user_id_fkey(full_name, phone)
        `)
        .eq('trip_id', selectedTripForManifest)
        .not('status', 'eq', 'cancelled')
        .order('seat_numbers', { ascending: true });

      if (bookingsError) return { trip: tripData, passengers: [] };

      const passengers = bookingsData.flatMap((b: any) => {
        const profile = b.profile || {};
        return (b.seat_numbers || []).map((seat: number) => ({
          booking_number: b.booking_number,
          seat_number: seat,
          passenger_name: profile.full_name || 'Guest',
          passenger_phone: profile.phone,
          passenger_count: b.passenger_count,
          total_fare: b.total_fare,
        }));
      });

      return { trip: tripData, passengers };
    },
    enabled: !!selectedTripForManifest,
  });

  const handlePrintManifest = () => {
    if (manifestData?.trip && manifestData?.passengers) {
      setPrintManifestTrip({ ...manifestData.trip, passengers: manifestData.passengers });
    }
  };

  // Get upcoming trips for manifest selector (today and next 7 days)
  const upcomingTripsForManifest = trips?.filter((t: any) => {
    const tripDate = new Date(t.trip_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weekLater = new Date(today);
    weekLater.setDate(today.getDate() + 7);
    return tripDate >= today && tripDate <= weekLater && t.status !== 'cancelled';
  }).sort((a: any, b: any) => {
    const dateA = new Date(`${a.trip_date}T${a.departure_time}`);
    const dateB = new Date(`${b.trip_date}T${b.departure_time}`);
    return dateA.getTime() - dateB.getTime();
  }) || [];

  const totalRevenue = bookings?.reduce((sum, b) => sum + (b.status !== 'cancelled' ? b.total_fare : 0), 0) || 0;
  const totalPassengers = bookings?.reduce((sum, b) => sum + (b.status !== 'cancelled' ? b.passenger_count : 0), 0) || 0;

  if (isLoading) {
    return <div className="p-6">Loading bookings...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Bookings</h1>
          <p className="text-muted-foreground">Manage all passenger bookings</p>
        </div>
        <Button onClick={() => setBookForPassengerOpen(true)} className="gap-2">
          <UserPlus className="h-4 w-4" />
          Book for Passenger
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
            <Ticket className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{bookings?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Confirmed</CardTitle>
            <div className="h-2 w-2 rounded-full bg-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{bookings?.filter(b => b.status === 'confirmed').length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <Banknote className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Passengers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPassengers}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs: Bookings and Manifests */}
      <Tabs defaultValue="bookings" className="space-y-6">
        <TabsList>
          <TabsTrigger value="bookings">All Bookings</TabsTrigger>
          <TabsTrigger value="manifests">Manifests</TabsTrigger>
        </TabsList>

        <TabsContent value="bookings" className="space-y-6">
          {/* Bookings Table */}
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <CardTitle>All Bookings</CardTitle>
                  <CardDescription>View and manage passenger bookings</CardDescription>
                </div>
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by booking #..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Booking #</TableHead>
                <TableHead>Trip</TableHead>
                <TableHead>Passengers</TableHead>
                <TableHead>Seats</TableHead>
                <TableHead>Total Fare</TableHead>
                <TableHead>Booked At</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBookings?.map((booking) => (
                <TableRow key={booking.id}>
                  <TableCell className="font-medium font-mono">{booking.booking_number}</TableCell>
                  <TableCell>{booking.trip?.route?.name || '-'}</TableCell>
                  <TableCell>{booking.passenger_count}</TableCell>
                  <TableCell>{booking.seat_numbers?.join(', ') || '-'}</TableCell>
                  <TableCell>{formatCurrency(booking.total_fare)}</TableCell>
                  <TableCell>{format(new Date(booking.booked_at), 'MMM d, yyyy HH:mm')}</TableCell>
                  <TableCell>{getStatusBadge(booking.status)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {booking.status !== 'cancelled' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handlePrintTicket(booking)}
                          title="Print ticket"
                        >
                          <Printer className="h-4 w-4" />
                        </Button>
                      )}
                      {booking.status !== 'cancelled' && booking.status !== 'completed' && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-destructive">
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Cancel Booking?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will cancel booking {booking.booking_number}. This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Keep Booking</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleCancelBooking(booking.id)}>
                                Cancel Booking
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredBookings?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                    No bookings found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
        </TabsContent>

        <TabsContent value="manifests" className="space-y-6">
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Passenger Manifests</CardTitle>
                <CardDescription>View and print passenger manifests for trips</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-4 items-end">
                <div className="flex-1 space-y-2">
                  <label className="text-sm font-medium">Select Trip</label>
                  <Select value={selectedTripForManifest} onValueChange={setSelectedTripForManifest}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a trip" />
                    </SelectTrigger>
                    <SelectContent>
                      {upcomingTripsForManifest.map((trip: any) => (
                        <SelectItem key={trip.id} value={trip.id}>
                          {trip.route?.origin} → {trip.route?.destination} • {format(new Date(trip.trip_date), 'MMM d')} • {trip.departure_time}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  onClick={handlePrintManifest}
                  disabled={!selectedTripForManifest || !manifestData?.trip}
                  className="gap-2"
                >
                  <Printer className="h-4 w-4" />
                  Print Manifest
                </Button>
              </div>

              {manifestData?.trip && manifestData.passengers.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm text-muted-foreground mb-2">
                    {manifestData.passengers.length} booking{manifestData.passengers.length > 1 ? 's' : ''} • {manifestData.passengers.reduce((sum, p) => sum + p.passenger_count, 0)} passenger{manifestData.passengers.reduce((sum, p) => sum + p.passenger_count, 0) > 1 ? 's' : ''}
                  </p>
                </div>
              )}

              {selectedTripForManifest && manifestData?.passengers.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No passengers booked for this trip
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Print Ticket Dialog */}
      <Dialog open={!!printTicketBooking} onOpenChange={(open) => !open && setPrintTicketBooking(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {printTicketBooking && (
            <TicketPrintView
              booking={printTicketBooking}
              passengerName={profileData?.full_name}
              passengerPhone={profileData?.phone}
              onClose={() => setPrintTicketBooking(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Print Manifest Dialog */}
      <Dialog open={!!printManifestTrip} onOpenChange={(open) => !open && setPrintManifestTrip(null)}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          {printManifestTrip && (
            <ManifestPrintView
              trip={printManifestTrip}
              passengers={printManifestTrip.passengers || []}
              onClose={() => setPrintManifestTrip(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Book for Passenger Dialog */}
      <BookForPassengerDialog
        open={bookForPassengerOpen}
        onOpenChange={setBookForPassengerOpen}
        onBookingCreated={() => {
          // Refresh bookings list
          window.location.reload();
        }}
      />
    </div>
  );
}

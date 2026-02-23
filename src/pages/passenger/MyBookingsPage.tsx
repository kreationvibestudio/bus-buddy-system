import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { format, parseISO, isPast } from 'date-fns';
import { Search, Ticket, Calendar, MapPin, Clock, X, ArrowLeftRight, ArrowRight, Banknote, Eye, Printer, CheckCircle } from 'lucide-react';
import { useMyBookings, useCancelBooking, useMarkBookingPaid } from '@/hooks/useBookings';
import { useRoutes } from '@/hooks/useRoutes';
import { useTrips } from '@/hooks/useSchedules';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/currency';
import { TicketPrintView } from '@/components/booking/TicketPrintView';

export default function MyBookingsPage() {
  const { user, profile } = useAuth();
  const [searchParams] = useSearchParams();
  const bookingSearchParam = searchParams.get('search') ?? '';
  const filterUpcoming = searchParams.get('filter') === 'upcoming';
  const { data: bookings, isLoading } = useMyBookings();
  const { data: routes } = useRoutes();
  const { data: trips } = useTrips();
  const cancelBooking = useCancelBooking();
  const markPaid = useMarkBookingPaid();

  const [searchTerm, setSearchTerm] = useState(bookingSearchParam);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [printTicketBooking, setPrintTicketBooking] = useState<any>(null);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [cancellationReason, setCancellationReason] = useState('');
  const [activeTab, setActiveTab] = useState<string>('all');

  useEffect(() => {
    if (bookingSearchParam) setSearchTerm(bookingSearchParam);
    if (filterUpcoming) setActiveTab('upcoming');
  }, [bookingSearchParam, filterUpcoming]);

  const userBookings = bookings ?? [];
  const displayBookings = userBookings.filter((b: any) => !b.is_return_leg);

  const isUpcomingBooking = (b: any) => {
    if (b.status === 'cancelled') return false;
    const trip = (b as any).trip ?? getTripDetails(b.trip_id);
    if (!trip?.trip_date) return false;
    const tripDate = parseISO(trip.trip_date);
    return !isPast(tripDate);
  };

  const bookingsForFilter = filterUpcoming
    ? displayBookings.filter(isUpcomingBooking)
    : displayBookings;
  
  // Filter by tab
  const bookingsByTab = activeTab === 'all'
    ? bookingsForFilter
    : activeTab === 'upcoming'
    ? bookingsForFilter.filter(isUpcomingBooking)
    : activeTab === 'completed'
    ? bookingsForFilter.filter((b: any) => b.status === 'completed' || (b as any).trip?.status === 'completed')
    : activeTab === 'cancelled'
    ? bookingsForFilter.filter((b: any) => b.status === 'cancelled')
    : bookingsForFilter;

  const filteredBookings = searchTerm
    ? bookingsByTab.filter((b: any) =>
        b.booking_number?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : bookingsByTab;

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      confirmed: 'default',
      pending: 'secondary',
      cancelled: 'destructive',
      completed: 'outline',
    };
    return <Badge variant={variants[status] || 'secondary'}>{status}</Badge>;
  };

  const getTripDetails = (tripId: string) => {
    return trips?.find((t: any) => t.id === tripId);
  };

  const getRouteDetails = (routeId: string) => {
    return routes?.find((r: any) => r.id === routeId);
  };

  const getLinkedBooking = (bookingId: string) => {
    return userBookings.find((b: any) => b.linked_booking_id === bookingId || b.id === bookingId);
  };

  const getReturnBooking = (booking: any) => {
    if (booking.booking_type !== 'round_trip') return null;
    // Find the return leg linked to this booking
    return userBookings.find((b: any) => 
      b.linked_booking_id === booking.id && b.is_return_leg
    );
  };

  const handleCancelClick = (booking: any) => {
    setSelectedBooking(booking);
    setCancelDialogOpen(true);
  };

  const openDetails = (booking: any) => {
    setSelectedBooking(booking);
    setDetailsDialogOpen(true);
  };

  const handleConfirmCancel = async () => {
    if (!selectedBooking) return;
    
    try {
      // Cancel the selected booking
      await cancelBooking.mutateAsync({
        id: selectedBooking.id,
        reason: cancellationReason,
      });

      // If it's a round trip, also cancel the linked booking
      if (selectedBooking.booking_type === 'round_trip') {
        const returnBooking = getReturnBooking(selectedBooking);
        if (returnBooking) {
          await cancelBooking.mutateAsync({
            id: returnBooking.id,
            reason: 'Cancelled with linked outbound booking',
          });
        }
      }

      toast.success('Booking cancelled successfully');
      setCancelDialogOpen(false);
      setSelectedBooking(null);
      setCancellationReason('');
    } catch (error) {
      toast.error('Failed to cancel booking');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-display font-bold">My Bookings</h1>
        <p className="text-muted-foreground mt-1">
          View and manage your trip bookings
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Bookings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{displayBookings.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Confirmed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {displayBookings.filter((b: any) => b.status === 'confirmed').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Round Trips</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-secondary-foreground">
              {displayBookings.filter((b: any) => b.booking_type === 'round_trip').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Cancelled</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {displayBookings.filter((b: any) => b.status === 'cancelled').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and filter */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by booking number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>
      {filterUpcoming && (
        <p className="text-sm text-muted-foreground">
          Showing only upcoming trips (today and future). <a href="/my-bookings" className="text-primary underline hover:no-underline">Show all bookings</a>
        </p>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          {/* Bookings List */}
          {filteredBookings.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Ticket className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Bookings Found</h3>
            <p className="text-muted-foreground mb-4">
              {displayBookings.length === 0
                ? "You haven't made any bookings yet"
                : searchTerm
                  ? `No booking found with number "${searchTerm}". Check the number and try again.`
                  : "No bookings match your search"}
            </p>
            <Button asChild>
              <a href="/book">Book a Ticket</a>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredBookings.map((booking: any) => {
            const trip = getTripDetails(booking.trip_id);
            const route = trip ? getRouteDetails(trip.route_id) : null;
            const returnBooking = getReturnBooking(booking);
            const returnTrip = returnBooking ? getTripDetails(returnBooking.trip_id) : null;
            const returnRoute = returnTrip ? getRouteDetails(returnTrip.route_id) : null;
            const isRoundTrip = booking.booking_type === 'round_trip';
            
            // Calculate total fare for round trips
            const totalFare = isRoundTrip && returnBooking 
              ? booking.total_fare + returnBooking.total_fare 
              : booking.total_fare;
            
            return (
              <Card key={booking.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col gap-4">
                    {/* Header with booking number and status */}
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          {isRoundTrip ? (
                            <ArrowLeftRight className="h-5 w-5 text-primary" />
                          ) : (
                            <Ticket className="h-5 w-5 text-primary" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold">{booking.booking_number}</h3>
                            {getStatusBadge(booking.status)}
                            {isRoundTrip && (
                              <Badge variant="outline" className="bg-secondary/10">
                                Round Trip
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Booked on {format(new Date(booking.booked_at), 'PPP')}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4 flex-wrap">
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Total Fare</p>
                          <p className="text-xl font-bold text-primary">{formatCurrency(totalFare)}</p>
                          <p className="text-xs text-muted-foreground">
                            {booking.passenger_count} passenger{booking.passenger_count > 1 ? 's' : ''}
                            {booking.seat_numbers?.length ? ` · Seats ${booking.seat_numbers.join(', ')}` : ''}
                          </p>
                        </div>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openDetails(booking)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View details
                        </Button>
                        {booking.status !== 'cancelled' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setPrintTicketBooking(booking)}
                          >
                            <Printer className="h-4 w-4 mr-1" />
                            Print ticket
                          </Button>
                        )}
                        
                        {(booking.status === 'confirmed' || booking.status === 'pending') && booking.payment_status !== 'completed' && booking.status !== 'cancelled' && (
                          <>
                            <Button
                              variant="default"
                              size="sm"
                              disabled={markPaid.isPending}
                              onClick={async () => {
                                try {
                                  await markPaid.mutateAsync({
                                    bookingId: booking.id,
                                    amount: booking.total_fare,
                                    method: 'cash',
                                  });
                                  const returnB = getReturnBooking(booking);
                                  if (returnB) {
                                    await markPaid.mutateAsync({
                                      bookingId: returnB.id,
                                      amount: returnB.total_fare,
                                      method: 'cash',
                                    });
                                  }
                                } catch {
                                  // toast from mutation
                                }
                              }}
                            >
                              <Banknote className="h-4 w-4 mr-1" />
                              Pay at terminal
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleCancelClick(booking)}
                            >
                              <X className="h-4 w-4 mr-1" />
                              Cancel
                            </Button>
                          </>
                        )}
                        {(booking.status === 'confirmed' || booking.status === 'pending') && booking.payment_status === 'completed' && (
                          <Badge variant="secondary" className="text-xs">
                            Paid
                          </Badge>
                        )}
                      </div>
                    </div>

                    <Separator />

                    {/* Trip details */}
                    <div className={`grid gap-4 ${isRoundTrip ? 'md:grid-cols-2' : 'md:grid-cols-1'}`}>
                      {/* Outbound */}
                      <div className="space-y-2">
                        {isRoundTrip && (
                          <p className="text-sm font-medium flex items-center gap-1">
                            <ArrowRight className="h-4 w-4 text-primary" />
                            Outbound
                          </p>
                        )}
                        {route && (
                          <div className="flex items-center gap-2 text-sm">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{route.origin}</span>
                            <ArrowRight className="h-3 w-3 text-muted-foreground" />
                            <span className="font-medium">{route.destination}</span>
                          </div>
                        )}
                        {trip && (
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {trip.trip_date}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {trip.departure_time}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Return (if round trip) */}
                      {isRoundTrip && returnTrip && returnRoute && (
                        <div className="space-y-2">
                          <p className="text-sm font-medium flex items-center gap-1">
                            <ArrowLeftRight className="h-4 w-4 text-secondary-foreground" />
                            Return
                          </p>
                          <div className="flex items-center gap-2 text-sm">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{returnRoute.origin}</span>
                            <ArrowRight className="h-3 w-3 text-muted-foreground" />
                            <span className="font-medium">{returnRoute.destination}</span>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {returnTrip.trip_date}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {returnTrip.departure_time}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {booking.cancellation_reason && (
                      <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                        <p className="text-sm font-medium">Cancellation Reason:</p>
                        <p className="text-sm text-muted-foreground">{booking.cancellation_reason}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Booking details dialog – available for any status (pending, confirmed, cancelled, completed) */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Booking details</DialogTitle>
            <DialogDescription>
              {selectedBooking?.booking_number}
            </DialogDescription>
          </DialogHeader>
          {selectedBooking && (() => {
            // Prefer embedded trip/route from API (works for all dates); fallback to hooks (next 30 days only)
            const trip = (selectedBooking as any).trip ?? getTripDetails(selectedBooking.trip_id);
            const route = (trip as any)?.route ?? (trip ? getRouteDetails(trip.route_id) : null);
            const returnBooking = getReturnBooking(selectedBooking);
            const returnTrip = (returnBooking as any)?.trip ?? (returnBooking ? getTripDetails(returnBooking.trip_id) : null);
            const returnRoute = (returnTrip as any)?.route ?? (returnTrip ? getRouteDetails(returnTrip.route_id) : null);
            const isRoundTrip = selectedBooking.booking_type === 'round_trip';
            const totalFare = isRoundTrip && returnBooking
              ? selectedBooking.total_fare + returnBooking.total_fare
              : selectedBooking.total_fare;
            return (
              <div className="space-y-4 py-2">
                <div className="flex items-center gap-2">
                  {getStatusBadge(selectedBooking.status)}
                  {(selectedBooking.status === 'confirmed' || selectedBooking.status === 'pending') && selectedBooking.payment_status === 'completed' && (
                    <Badge variant="secondary">Paid</Badge>
                  )}
                </div>
                <div className="text-sm">
                  <p className="text-muted-foreground">Booked on</p>
                  <p className="font-medium">{format(new Date(selectedBooking.booked_at), 'PPP p')}</p>
                </div>
                <div className="text-sm">
                  <p className="text-muted-foreground">Payment</p>
                  <p className="font-medium capitalize">{selectedBooking.payment_status ?? 'pending'}</p>
                  <p className="font-semibold text-primary mt-1">{formatCurrency(totalFare)}</p>
                  <p className="text-muted-foreground text-xs">{selectedBooking.passenger_count} passenger{selectedBooking.passenger_count > 1 ? 's' : ''}</p>
                  {selectedBooking.seat_numbers?.length ? (
                    <p className="text-muted-foreground text-xs">Seats: {selectedBooking.seat_numbers.join(', ')}</p>
                  ) : null}
                </div>
                <Separator />
                <div className="space-y-2">
                  <p className="text-sm font-medium flex items-center gap-1">
                    <ArrowRight className="h-4 w-4 text-primary" />
                    Outbound
                  </p>
                  <p className="text-sm">
                    <MapPin className="h-4 w-4 inline mr-1 text-muted-foreground" />
                    {route ? `${route.origin} → ${route.destination}` : 'Route details'}
                  </p>
                  {trip && (
                    <p className="text-sm text-muted-foreground flex items-center gap-3">
                      <span className="flex items-center gap-1"><Calendar className="h-4 w-4" />{trip.trip_date}</span>
                      <span className="flex items-center gap-1"><Clock className="h-4 w-4" />{trip.departure_time}</span>
                    </p>
                  )}
                </div>
                {isRoundTrip && returnTrip && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium flex items-center gap-1">
                      <ArrowLeftRight className="h-4 w-4 text-secondary-foreground" />
                      Return
                    </p>
                    <p className="text-sm">
                      <MapPin className="h-4 w-4 inline mr-1 text-muted-foreground" />
                      {returnRoute ? `${returnRoute.origin} → ${returnRoute.destination}` : 'Route details'}
                    </p>
                    <p className="text-sm text-muted-foreground flex items-center gap-3">
                      <span className="flex items-center gap-1"><Calendar className="h-4 w-4" />{returnTrip.trip_date}</span>
                      <span className="flex items-center gap-1"><Clock className="h-4 w-4" />{returnTrip.departure_time}</span>
                    </p>
                  </div>
                )}
                {selectedBooking.cancellation_reason && (
                  <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                    <p className="text-sm font-medium">Cancellation reason</p>
                    <p className="text-sm text-muted-foreground">{selectedBooking.cancellation_reason}</p>
                  </div>
                )}
                <DialogFooter className="pt-4">
                  {(selectedBooking.status === 'confirmed' || selectedBooking.status === 'pending') && selectedBooking.payment_status !== 'completed' && (
                    <>
                      <Button
                        variant="default"
                        size="sm"
                        disabled={markPaid.isPending}
                        onClick={async () => {
                          try {
                            await markPaid.mutateAsync({
                              bookingId: selectedBooking.id,
                              amount: selectedBooking.total_fare,
                              method: 'cash',
                            });
                            const returnB = getReturnBooking(selectedBooking);
                            if (returnB) {
                              await markPaid.mutateAsync({
                                bookingId: returnB.id,
                                amount: returnB.total_fare,
                                method: 'cash',
                              });
                            }
                            setDetailsDialogOpen(false);
                          } catch {
                            // toast from mutation
                          }
                        }}
                      >
                        <Banknote className="h-4 w-4 mr-1" />
                        Pay at terminal
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => { setDetailsDialogOpen(false); handleCancelClick(selectedBooking); }}>
                        Cancel booking
                      </Button>
                    </>
                  )}
                  <Button variant="secondary" onClick={() => setDetailsDialogOpen(false)}>
                    Close
                  </Button>
                </DialogFooter>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Cancel Dialog */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Booking</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel booking {selectedBooking?.booking_number}?
              {selectedBooking?.booking_type === 'round_trip' && (
                <span className="block mt-2 font-medium text-destructive">
                  This will cancel both the outbound and return trips.
                </span>
              )}
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Reason for cancellation (optional)</label>
              <Textarea
                placeholder="Please provide a reason..."
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelDialogOpen(false)}>
              Keep Booking
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleConfirmCancel}
              disabled={cancelBooking.isPending}
            >
              {cancelBooking.isPending ? 'Cancelling...' : 'Confirm Cancel'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Print Ticket Dialog */}
      <Dialog open={!!printTicketBooking} onOpenChange={(open) => !open && setPrintTicketBooking(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {printTicketBooking && (
            <TicketPrintView
              booking={printTicketBooking}
              passengerName={profile?.full_name}
              passengerPhone={profile?.phone}
              onClose={() => setPrintTicketBooking(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
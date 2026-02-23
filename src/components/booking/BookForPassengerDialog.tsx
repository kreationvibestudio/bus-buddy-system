import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format, parseISO } from 'date-fns';
import { CalendarIcon, Search, UserPlus } from 'lucide-react';
import { useRoutes } from '@/hooks/useRoutes';
import { useTrips } from '@/hooks/useSchedules';
import { useCreateRoundTripBooking } from '@/hooks/useBookings';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/currency';
import { SeatPicker } from '@/components/booking/SeatPicker';
import { TicketPrintView } from './TicketPrintView';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';

interface BookForPassengerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBookingCreated?: (booking: any) => void;
}

export function BookForPassengerDialog({ open, onOpenChange, onBookingCreated }: BookForPassengerDialogProps) {
  const { data: routes } = useRoutes();
  const { data: trips } = useTrips();
  const createBooking = useCreateRoundTripBooking();
  
  const [passengerSearch, setPassengerSearch] = useState('');
  const [selectedPassengerId, setSelectedPassengerId] = useState<string>('');
  const [passengerName, setPassengerName] = useState('');
  const [passengerPhone, setPassengerPhone] = useState('');
  const [useGuestBooking, setUseGuestBooking] = useState(false);
  
  const [selectedRouteId, setSelectedRouteId] = useState('');
  const [searchDate, setSearchDate] = useState<Date>(new Date());
  const [passengerCount, setPassengerCount] = useState(1);
  
  const [availableTrips, setAvailableTrips] = useState<any[]>([]);
  const [selectedTrip, setSelectedTrip] = useState<any>(null);
  const [selectedSeatNumbers, setSelectedSeatNumbers] = useState<number[]>([]);
  const [createdBooking, setCreatedBooking] = useState<any>(null);

  // Search passengers
  const { data: passengerResults } = useQuery({
    queryKey: ['search-passengers', passengerSearch],
    queryFn: async () => {
      if (!passengerSearch || passengerSearch.length < 2) return [];
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, full_name, phone, email')
        .or(`full_name.ilike.%${passengerSearch}%,phone.ilike.%${passengerSearch}%,email.ilike.%${passengerSearch}%`)
        .limit(10);
      if (error) throw error;
      return data || [];
    },
    enabled: !useGuestBooking && passengerSearch.length >= 2,
  });

  // Get selected route
  const selectedRoute = routes?.find((r: any) => r.id === selectedRouteId);

  // Get fare per seat helper
  const getFarePerSeat = (trip: any, route: any) => {
    return trip?.fare ?? route?.base_fare ?? 0;
  };

  // Filter trips when route and date are selected
  useEffect(() => {
    if (!selectedRouteId || !searchDate || !trips) {
      setAvailableTrips([]);
      return;
    }

    const filtered = trips.filter((t: any) => {
      const tripDate = new Date(t.trip_date);
      const searchDateStr = format(searchDate, 'yyyy-MM-dd');
      const tripDateStr = format(tripDate, 'yyyy-MM-dd');
      return t.route_id === selectedRouteId && tripDateStr === searchDateStr && t.status === 'scheduled';
    }).sort((a: any, b: any) => {
      return a.departure_time.localeCompare(b.departure_time);
    });

    setAvailableTrips(filtered);
  }, [selectedRouteId, searchDate, trips]);

  const handleSelectPassenger = (passenger: any) => {
    setSelectedPassengerId(passenger.user_id);
    setPassengerName(passenger.full_name || '');
    setPassengerPhone(passenger.phone || '');
    setPassengerSearch(passenger.full_name || passenger.email || '');
    setUseGuestBooking(false);
  };

  const handleUseGuestBooking = () => {
    setUseGuestBooking(true);
    setSelectedPassengerId('');
    setPassengerSearch('');
  };

  const handleCreateBooking = async () => {
    if (!selectedTrip) {
      toast.error('Please select a trip');
      return;
    }
    if (selectedSeatNumbers.length !== passengerCount) {
      toast.error(`Please select ${passengerCount} seat${passengerCount > 1 ? 's' : ''}`);
      return;
    }
    if (!useGuestBooking && !selectedPassengerId) {
      toast.error('Please select a passenger or use guest booking');
      return;
    }
    if (useGuestBooking && (!passengerName || !passengerPhone)) {
      toast.error('Please provide passenger name and phone for guest booking');
      return;
    }

    try {
      let userId = selectedPassengerId;
      
      // For guest bookings, we'll use a system user or create via Edge Function
      // For now, staff can book for existing passengers only
      // TODO: Implement guest booking via Edge Function if needed
      if (useGuestBooking) {
        toast.error('Guest booking requires passenger account. Please search for existing passenger or contact admin.');
        return;
      }

      const farePerSeat = getFarePerSeat(selectedTrip, selectedRoute);
      const totalFare = farePerSeat * passengerCount;

      const result = await createBooking.mutateAsync({
        user_id: userId,
        outbound_trip_id: selectedTrip.id,
        return_trip_id: undefined,
        seat_numbers: selectedSeatNumbers,
        passenger_count: passengerCount,
        outbound_fare: totalFare,
        return_fare: 0,
        booking_type: 'one_way',
        payment_method: 'cash',
      });

      const booking = result.outbound;
      setCreatedBooking(booking);
      
      toast.success('Booking created successfully!');
      onBookingCreated?.(booking);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create booking');
    }
  };

  const handleReset = () => {
    setPassengerSearch('');
    setSelectedPassengerId('');
    setPassengerName('');
    setPassengerPhone('');
    setUseGuestBooking(false);
    setSelectedRouteId('');
    setSearchDate(new Date());
    setPassengerCount(1);
    setAvailableTrips([]);
    setSelectedTrip(null);
    setSelectedSeatNumbers([]);
    setCreatedBooking(null);
  };

  const handleClose = () => {
    handleReset();
    onOpenChange(false);
  };

  // Get unique locations from routes
  const locations = routes ? [...new Set(routes.flatMap((r: any) => [r.origin, r.destination]))] : [];

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Book Ticket for Passenger</DialogTitle>
            <DialogDescription>Create a booking for a passenger purchasing over the counter</DialogDescription>
          </DialogHeader>

          {createdBooking ? (
            <div className="space-y-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="font-semibold text-green-900">Booking Created Successfully!</p>
                <p className="text-sm text-green-700">Booking Number: {createdBooking.booking_number}</p>
              </div>
              <TicketPrintView
                booking={createdBooking}
                passengerName={passengerName}
                passengerPhone={passengerPhone}
              />
              <DialogFooter>
                <Button onClick={handleClose}>Close</Button>
                <Button onClick={() => window.print()}>Print Ticket</Button>
              </DialogFooter>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Passenger Selection */}
              <div className="space-y-4">
                <div>
                  <Label>Passenger</Label>
                  {!useGuestBooking ? (
                    <div className="space-y-2">
                      <div className="relative">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search by name, phone, or email..."
                          value={passengerSearch}
                          onChange={(e) => setPassengerSearch(e.target.value)}
                          className="pl-8"
                        />
                      </div>
                      {passengerResults && passengerResults.length > 0 && (
                        <div className="border rounded-md max-h-48 overflow-y-auto">
                          {passengerResults.map((p: any) => (
                            <button
                              key={p.user_id}
                              type="button"
                              onClick={() => handleSelectPassenger(p)}
                              className="w-full text-left p-2 hover:bg-muted flex items-center gap-2"
                            >
                              <UserPlus className="h-4 w-4" />
                              <div>
                                <p className="font-medium">{p.full_name}</p>
                                <p className="text-xs text-muted-foreground">{p.phone || p.email}</p>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                      {selectedPassengerId && (
                        <div className="p-2 bg-muted rounded-md">
                          <p className="text-sm font-medium">{passengerName}</p>
                          {passengerPhone && <p className="text-xs text-muted-foreground">{passengerPhone}</p>}
                        </div>
                      )}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleUseGuestBooking}
                        className="w-full"
                      >
                        <UserPlus className="h-4 w-4 mr-2" />
                        Book as Guest (New Passenger)
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Input
                        placeholder="Passenger Name"
                        value={passengerName}
                        onChange={(e) => setPassengerName(e.target.value)}
                      />
                      <Input
                        placeholder="Phone Number"
                        value={passengerPhone}
                        onChange={(e) => setPassengerPhone(e.target.value)}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setUseGuestBooking(false)}
                      >
                        Search Existing Passenger Instead
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Trip Selection */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>From</Label>
                    <Select value={selectedRouteId} onValueChange={setSelectedRouteId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select origin" />
                      </SelectTrigger>
                      <SelectContent>
                        {routes?.map((route: any) => (
                          <SelectItem key={route.id} value={route.id}>
                            {route.origin} → {route.destination}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !searchDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {searchDate ? format(searchDate, "PPP") : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={searchDate}
                          onSelect={(date) => date && setSearchDate(date)}
                          disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                <div>
                  <Label>Passengers</Label>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => setPassengerCount(Math.max(1, passengerCount - 1))}
                    >
                      -
                    </Button>
                    <span className="w-12 text-center">{passengerCount}</span>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => setPassengerCount(passengerCount + 1)}
                    >
                      +
                    </Button>
                  </div>
                </div>

                {availableTrips.length > 0 && (
                  <div>
                    <Label>Select Trip</Label>
                    <div className="space-y-2 mt-2">
                      {availableTrips.map((trip: any) => (
                        <button
                          key={trip.id}
                          type="button"
                          onClick={() => setSelectedTrip(trip)}
                          className={cn(
                            "w-full text-left p-4 border rounded-lg hover:bg-muted transition-colors",
                            selectedTrip?.id === trip.id && "border-primary bg-primary/5"
                          )}
                        >
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="font-semibold">{trip.departure_time} - {trip.arrival_time}</p>
                              <p className="text-sm text-muted-foreground">
                                {trip.route?.origin} → {trip.route?.destination}
                              </p>
                              <p className="text-sm font-medium mt-1">
                                {formatCurrency(getFarePerSeat(trip, selectedRoute) * passengerCount)} total
                              </p>
                            </div>
                            {trip.available_seats && (
                              <Badge variant="outline">{trip.available_seats} seats available</Badge>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {selectedTrip && (
                  <div>
                    <SeatPicker
                      tripId={selectedTrip.id}
                      passengerCount={passengerCount}
                      value={selectedSeatNumbers}
                      onChange={setSelectedSeatNumbers}
                    />
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={handleClose}>Cancel</Button>
                <Button onClick={handleCreateBooking} disabled={createBooking.isPending}>
                  {createBooking.isPending ? 'Creating...' : 'Create Booking'}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

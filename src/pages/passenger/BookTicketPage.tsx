import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format, parseISO } from 'date-fns';
import { CalendarIcon, Search, Bus, Clock, MapPin, Users, CreditCard, ArrowLeftRight, CheckCircle } from 'lucide-react';
import { useRoutes } from '@/hooks/useRoutes';
import { useTrips } from '@/hooks/useSchedules';
import { useCreateRoundTripBooking } from '@/hooks/useBookings';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/currency';

type BookingStep = 'search' | 'select-outbound' | 'select-return' | 'confirm';
type TripType = 'one-way' | 'round-trip';

export default function BookTicketPage() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const { data: routes } = useRoutes();
  const { data: trips } = useTrips();
  const createBooking = useCreateRoundTripBooking();
  
  // Parse URL params
  const fromParam = searchParams.get('from');
  const toParam = searchParams.get('to');
  const dateParam = searchParams.get('date');
  const passengersParam = searchParams.get('passengers');
  const tripTypeParam = searchParams.get('tripType') as TripType | null;
  const returnDateParam = searchParams.get('returnDate');

  const [tripType, setTripType] = useState<TripType>(tripTypeParam || 'one-way');
  const [selectedRouteId, setSelectedRouteId] = useState<string>('');
  const [searchDate, setSearchDate] = useState<Date | undefined>(dateParam ? parseISO(dateParam) : new Date());
  const [returnDate, setReturnDate] = useState<Date | undefined>(returnDateParam ? parseISO(returnDateParam) : undefined);
  const [passengerCount, setPassengerCount] = useState(passengersParam ? parseInt(passengersParam) : 1);
  
  const [outboundResults, setOutboundResults] = useState<any[]>([]);
  const [returnResults, setReturnResults] = useState<any[]>([]);
  const [selectedOutboundTrip, setSelectedOutboundTrip] = useState<any>(null);
  const [selectedReturnTrip, setSelectedReturnTrip] = useState<any>(null);
  const [step, setStep] = useState<BookingStep>('search');

  // Find matching route based on origin/destination from URL params
  useEffect(() => {
    if (routes && fromParam && toParam) {
      const matchingRoute = routes.find(
        (r: any) => r.origin === fromParam && r.destination === toParam
      );
      if (matchingRoute) {
        setSelectedRouteId(matchingRoute.id);
      }
    }
  }, [routes, fromParam, toParam]);

  // Get unique locations from routes
  const locations = routes ? [...new Set(routes.flatMap((r: any) => [r.origin, r.destination]))] : [];

  // Get the selected route object
  const selectedRoute = routes?.find((r: any) => r.id === selectedRouteId);

  // For round trips, find return route (reverse origin/destination)
  const returnRoute = routes?.find(
    (r: any) => r.origin === selectedRoute?.destination && r.destination === selectedRoute?.origin
  );

  const handleSearch = () => {
    if (!searchDate || !selectedRouteId) {
      toast.error('Please select a route and date');
      return;
    }

    if (tripType === 'round-trip' && !returnDate) {
      toast.error('Please select a return date');
      return;
    }

    const dateStr = format(searchDate, 'yyyy-MM-dd');
    const outbound = trips?.filter(
      (trip: any) => trip.route_id === selectedRouteId && trip.trip_date === dateStr && trip.status !== 'cancelled'
    ) || [];
    
    setOutboundResults(outbound);
    setStep('select-outbound');
    
    if (outbound.length === 0) {
      toast.info('No outbound trips available for this route and date');
    }
  };

  const handleSelectOutbound = async (trip: any) => {
    setSelectedOutboundTrip(trip);
    
    if (tripType === 'round-trip' && returnRoute && returnDate) {
      const returnDateStr = format(returnDate, 'yyyy-MM-dd');
      
      // Query return trips directly from database to avoid caching issues
      const { data: directReturnTrips, error } = await supabase
        .from('trips')
        .select('*, route:routes(*), bus:buses(*)')
        .eq('route_id', returnRoute.id)
        .eq('trip_date', returnDateStr)
        .eq('status', 'scheduled');
      
      if (error) {
        console.error('Error fetching return trips:', error);
        toast.error('Failed to fetch return trips');
        return;
      }
      
      console.log('Return route:', returnRoute);
      console.log('Return date:', returnDateStr);
      console.log('Return trips found:', directReturnTrips);
      
      setReturnResults(directReturnTrips || []);
      setStep('select-return');
      
      if (!directReturnTrips || directReturnTrips.length === 0) {
        toast.info('No return trips available. Please select a different return date.');
      }
    } else {
      setStep('confirm');
    }
  };

  const handleSelectReturn = (trip: any) => {
    setSelectedReturnTrip(trip);
    setStep('confirm');
  };

  const handleConfirmBooking = async () => {
    if (!selectedOutboundTrip || !user) {
      toast.error('Please select a trip');
      return;
    }

    try {
      const seatNumbers = Array.from({ length: passengerCount }, (_, i) => i + 1);
      const outboundFare = (selectedRoute?.base_fare || 0) * passengerCount;
      const returnFare = tripType === 'round-trip' && selectedReturnTrip 
        ? (returnRoute?.base_fare || 0) * passengerCount 
        : 0;

      await createBooking.mutateAsync({
        user_id: user.id,
        outbound_trip_id: selectedOutboundTrip.id,
        return_trip_id: selectedReturnTrip?.id,
        seat_numbers: seatNumbers,
        passenger_count: passengerCount,
        outbound_fare: outboundFare,
        return_fare: returnFare,
        booking_type: tripType === 'round-trip' ? 'round_trip' : 'one_way',
        payment_method: 'card',
      });

      toast.success('Booking confirmed successfully!');
      // Reset all form state for new booking
      setStep('search');
      setSelectedOutboundTrip(null);
      setSelectedReturnTrip(null);
      setOutboundResults([]);
      setReturnResults([]);
      setSelectedRouteId('');
      setTripType('one-way');
      setSearchDate(new Date());
      setReturnDate(undefined);
      setPassengerCount(1);
    } catch (error) {
      toast.error('Failed to create booking');
    }
  };

  const getRouteDetails = (routeId: string) => {
    return routes?.find((r: any) => r.id === routeId);
  };

  const totalFare = () => {
    const outbound = (selectedRoute?.base_fare || 0) * passengerCount;
    const returnAmt = tripType === 'round-trip' && selectedReturnTrip 
      ? (returnRoute?.base_fare || 0) * passengerCount 
      : 0;
    return outbound + returnAmt;
  };

  const getStepNumber = () => {
    switch (step) {
      case 'search': return 1;
      case 'select-outbound': return 2;
      case 'select-return': return 3;
      case 'confirm': return tripType === 'round-trip' ? 4 : 3;
      default: return 1;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-display font-bold">Book a Ticket</h1>
        <p className="text-muted-foreground mt-1">
          {tripType === 'round-trip' ? 'Book your round trip journey' : 'Search for available trips and book your seat'}
        </p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center gap-2 flex-wrap">
        <Badge variant={step === 'search' ? 'default' : 'secondary'}>1. Search</Badge>
        <Separator className="w-4 md:w-8" />
        <Badge variant={step === 'select-outbound' ? 'default' : 'secondary'}>
          2. {tripType === 'round-trip' ? 'Outbound' : 'Select Trip'}
        </Badge>
        {tripType === 'round-trip' && (
          <>
            <Separator className="w-4 md:w-8" />
            <Badge variant={step === 'select-return' ? 'default' : 'secondary'}>3. Return</Badge>
          </>
        )}
        <Separator className="w-4 md:w-8" />
        <Badge variant={step === 'confirm' ? 'default' : 'secondary'}>
          {tripType === 'round-trip' ? '4' : '3'}. Confirm
        </Badge>
      </div>

      {step === 'search' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5 text-primary" />
              Search Trips
            </CardTitle>
            <CardDescription>Find available buses for your journey</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Trip Type Toggle */}
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="tripType"
                  checked={tripType === 'one-way'}
                  onChange={() => {
                    setTripType('one-way');
                    setReturnDate(undefined);
                  }}
                  className="w-4 h-4 text-primary"
                />
                <span className="text-sm font-medium">One Way</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="tripType"
                  checked={tripType === 'round-trip'}
                  onChange={() => setTripType('round-trip')}
                  className="w-4 h-4 text-primary"
                />
                <span className="text-sm font-medium flex items-center gap-1">
                  <ArrowLeftRight className="h-4 w-4" />
                  Round Trip
                </span>
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <Label>Select Route</Label>
                <Select value={selectedRouteId} onValueChange={setSelectedRouteId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a route" />
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

              <div className="space-y-2">
                <Label>Departure Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !searchDate && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {searchDate ? format(searchDate, 'PPP') : 'Pick a date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={searchDate}
                      onSelect={setSearchDate}
                      initialFocus
                      disabled={(date) => date < new Date()}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {tripType === 'round-trip' && (
                <div className="space-y-2">
                  <Label>Return Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full justify-start text-left font-normal',
                          !returnDate && 'text-muted-foreground'
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {returnDate ? format(returnDate, 'PPP') : 'Pick return date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={returnDate}
                        onSelect={setReturnDate}
                        initialFocus
                        disabled={(date) => date < (searchDate || new Date())}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              )}

              <div className="space-y-2">
                <Label>Passengers</Label>
                <Select 
                  value={passengerCount.toString()} 
                  onValueChange={(v) => setPassengerCount(parseInt(v))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5].map((num) => (
                      <SelectItem key={num} value={num.toString()}>
                        {num} Passenger{num > 1 ? 's' : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {tripType === 'round-trip' && selectedRoute && !returnRoute && (
              <div className="p-3 rounded-lg bg-warning/10 border border-warning/20">
                <p className="text-sm text-warning">
                  Note: No return route available from {selectedRoute.destination} to {selectedRoute.origin}. 
                  Please select a different route or book one-way.
                </p>
              </div>
            )}

            <Button 
              onClick={handleSearch} 
              className="w-full md:w-auto"
              disabled={tripType === 'round-trip' && selectedRoute && !returnRoute}
            >
              <Search className="mr-2 h-4 w-4" />
              Search Trips
            </Button>
          </CardContent>
        </Card>
      )}

      {step === 'select-outbound' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h2 className="text-xl font-semibold">
                {tripType === 'round-trip' ? 'Select Outbound Trip' : 'Available Trips'}
              </h2>
              <p className="text-sm text-muted-foreground">
                {selectedRoute?.origin} → {selectedRoute?.destination} on {searchDate && format(searchDate, 'PPP')}
              </p>
            </div>
            <Button variant="outline" onClick={() => setStep('search')}>
              Modify Search
            </Button>
          </div>

          {outboundResults.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <Bus className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No trips found for this route and date</p>
                <Button variant="outline" className="mt-4" onClick={() => setStep('search')}>
                  Try Different Search
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {outboundResults.map((trip: any) => {
                const route = getRouteDetails(trip.route_id);
                return (
                  <Card 
                    key={trip.id} 
                    className="hover:shadow-lg transition-shadow cursor-pointer hover:border-primary"
                    onClick={() => handleSelectOutbound(trip)}
                  >
                    <CardContent className="p-6">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                            <Bus className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-semibold">{route?.name}</h3>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <MapPin className="h-4 w-4" />
                              {route?.origin} → {route?.destination}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-6 flex-wrap">
                          <div className="text-center">
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Clock className="h-4 w-4" />
                              Departure
                            </div>
                            <p className="font-semibold">{trip.departure_time}</p>
                          </div>
                          <div className="text-center">
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Clock className="h-4 w-4" />
                              Arrival
                            </div>
                            <p className="font-semibold">{trip.arrival_time}</p>
                          </div>
                          <div className="text-center">
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Users className="h-4 w-4" />
                              Seats
                            </div>
                            <Badge variant="secondary">{trip.available_seats || 40} left</Badge>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-primary">
                              {formatCurrency(route?.base_fare || 0)}
                            </p>
                            <p className="text-xs text-muted-foreground">per person</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {step === 'select-return' && (
        <div className="space-y-4">
          {/* Selected outbound summary */}
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">Outbound Selected</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedRoute?.origin} → {selectedRoute?.destination} • {selectedOutboundTrip?.departure_time} on {searchDate && format(searchDate, 'PPP')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h2 className="text-xl font-semibold">Select Return Trip</h2>
              <p className="text-sm text-muted-foreground">
                {returnRoute?.origin} → {returnRoute?.destination} on {returnDate && format(returnDate, 'PPP')}
              </p>
            </div>
            <Button variant="outline" onClick={() => setStep('select-outbound')}>
              Change Outbound
            </Button>
          </div>

          {returnResults.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <Bus className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No return trips found for this date</p>
                <Button variant="outline" className="mt-4" onClick={() => setStep('search')}>
                  Try Different Dates
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {returnResults.map((trip: any) => {
                const route = getRouteDetails(trip.route_id);
                return (
                  <Card 
                    key={trip.id} 
                    className="hover:shadow-lg transition-shadow cursor-pointer hover:border-primary"
                    onClick={() => handleSelectReturn(trip)}
                  >
                    <CardContent className="p-6">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-full bg-secondary/20 flex items-center justify-center">
                            <ArrowLeftRight className="h-6 w-6 text-secondary-foreground" />
                          </div>
                          <div>
                            <h3 className="font-semibold">{route?.name}</h3>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <MapPin className="h-4 w-4" />
                              {route?.origin} → {route?.destination}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-6 flex-wrap">
                          <div className="text-center">
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Clock className="h-4 w-4" />
                              Departure
                            </div>
                            <p className="font-semibold">{trip.departure_time}</p>
                          </div>
                          <div className="text-center">
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Clock className="h-4 w-4" />
                              Arrival
                            </div>
                            <p className="font-semibold">{trip.arrival_time}</p>
                          </div>
                          <div className="text-center">
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Users className="h-4 w-4" />
                              Seats
                            </div>
                            <Badge variant="secondary">{trip.available_seats || 40} left</Badge>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-primary">
                              {formatCurrency(route?.base_fare || 0)}
                            </p>
                            <p className="text-xs text-muted-foreground">per person</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {step === 'confirm' && selectedOutboundTrip && (
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-4">
            {/* Outbound Trip Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bus className="h-5 w-5 text-primary" />
                  {tripType === 'round-trip' ? 'Outbound Trip' : 'Trip Details'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Route</span>
                  <span className="font-medium">{selectedRoute?.name}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">From</span>
                  <span className="font-medium">{selectedRoute?.origin}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">To</span>
                  <span className="font-medium">{selectedRoute?.destination}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Date</span>
                  <span className="font-medium">{selectedOutboundTrip.trip_date}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Departure</span>
                  <span className="font-medium">{selectedOutboundTrip.departure_time}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Arrival</span>
                  <span className="font-medium">{selectedOutboundTrip.arrival_time}</span>
                </div>
              </CardContent>
            </Card>

            {/* Return Trip Details */}
            {tripType === 'round-trip' && selectedReturnTrip && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ArrowLeftRight className="h-5 w-5 text-secondary-foreground" />
                    Return Trip
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Route</span>
                    <span className="font-medium">{returnRoute?.name}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">From</span>
                    <span className="font-medium">{returnRoute?.origin}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">To</span>
                    <span className="font-medium">{returnRoute?.destination}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Date</span>
                    <span className="font-medium">{selectedReturnTrip.trip_date}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Departure</span>
                    <span className="font-medium">{selectedReturnTrip.departure_time}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Arrival</span>
                    <span className="font-medium">{selectedReturnTrip.arrival_time}</span>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Booking Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Trip Type</span>
                <Badge variant="outline">
                  {tripType === 'round-trip' ? 'Round Trip' : 'One Way'}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Passengers</span>
                <span className="font-medium">{passengerCount}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">Outbound fare ({passengerCount}x)</span>
                <span className="font-medium">
                  {formatCurrency((selectedRoute?.base_fare || 0) * passengerCount)}
                </span>
              </div>
              {tripType === 'round-trip' && selectedReturnTrip && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Return fare ({passengerCount}x)</span>
                  <span className="font-medium">
                    {formatCurrency((returnRoute?.base_fare || 0) * passengerCount)}
                  </span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between text-lg">
                <span className="font-semibold">Total</span>
                <span className="font-bold text-primary">{formatCurrency(totalFare())}</span>
              </div>

              <div className="pt-4 space-y-3">
                <Button onClick={handleConfirmBooking} className="w-full" disabled={createBooking.isPending}>
                  <CreditCard className="mr-2 h-4 w-4" />
                  {createBooking.isPending ? 'Processing...' : 'Confirm & Pay'}
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full" 
                  onClick={() => setStep(tripType === 'round-trip' ? 'select-return' : 'select-outbound')}
                >
                  Back to Trip Selection
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

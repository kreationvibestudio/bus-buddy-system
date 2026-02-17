import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Bus, Search, Minus, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useRoutes } from '@/hooks/useRoutes';

const HeroBookingForm = () => {
  const navigate = useNavigate();
  const { data: routes, isLoading: routesLoading } = useRoutes();
  
  const [tripType, setTripType] = useState<'one-way' | 'round-trip'>('one-way');
  const [fromLocation, setFromLocation] = useState('');
  const [toLocation, setToLocation] = useState('');
  const [departureDate, setDepartureDate] = useState<Date>();
  const [returnDate, setReturnDate] = useState<Date>();
  const [adults, setAdults] = useState(1);
  const [bookingNumber, setBookingNumber] = useState('');

  // Get unique locations from routes
  const locations = routes ? [...new Set(routes.flatMap(r => [r.origin, r.destination]))] : [];

  const handleProceed = () => {
    const params = new URLSearchParams();
    if (fromLocation) params.set('from', fromLocation);
    if (toLocation) params.set('to', toLocation);
    if (departureDate) params.set('date', format(departureDate, 'yyyy-MM-dd'));
    if (adults) params.set('passengers', adults.toString());
    params.set('tripType', tripType);
    if (tripType === 'round-trip' && returnDate) {
      params.set('returnDate', format(returnDate, 'yyyy-MM-dd'));
    }
    
    // Redirect to auth, after login user goes to /book with params
    navigate(`/auth?redirect=/book&${params.toString()}`);
  };

  const handleCheckBooking = () => {
    if (bookingNumber) {
      navigate(`/auth?redirect=/my-bookings&search=${bookingNumber}`);
    }
  };

  return (
    <div className="w-full max-w-md bg-card rounded-2xl shadow-2xl border border-border overflow-hidden">
      <Tabs defaultValue="book" className="w-full">
        <TabsList className="w-full grid grid-cols-3 rounded-none h-14 bg-muted/50">
          <TabsTrigger 
            value="book" 
            className="rounded-none data-[state=active]:bg-primary data-[state=active]:text-primary-foreground h-full text-sm font-medium"
          >
            Book a Seat
          </TabsTrigger>
          <TabsTrigger 
            value="hire" 
            className="rounded-none data-[state=active]:bg-primary data-[state=active]:text-primary-foreground h-full text-sm font-medium"
          >
            Hire a Bus
          </TabsTrigger>
          <TabsTrigger 
            value="status" 
            className="rounded-none data-[state=active]:bg-primary data-[state=active]:text-primary-foreground h-full text-sm font-medium"
          >
            Check Booking
          </TabsTrigger>
        </TabsList>

        <TabsContent value="book" className="p-6 space-y-5 mt-0">
          {/* Trip Type Toggle */}
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="tripType"
                checked={tripType === 'one-way'}
                onChange={() => setTripType('one-way')}
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
              <span className="text-sm font-medium">Round Trip</span>
            </label>
          </div>

          {/* From Location */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-muted-foreground">Travelling From</Label>
            <Select value={fromLocation} onValueChange={setFromLocation}>
              <SelectTrigger className="h-12 bg-background">
                <SelectValue placeholder="Select departure city" />
              </SelectTrigger>
              <SelectContent className="bg-popover z-50">
                {locations.map((location) => (
                  <SelectItem key={location} value={location}>
                    {location}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* To Location */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-muted-foreground">Travelling To</Label>
            <Select value={toLocation} onValueChange={setToLocation}>
              <SelectTrigger className="h-12 bg-background">
                <SelectValue placeholder="Select destination city" />
              </SelectTrigger>
              <SelectContent className="bg-popover z-50">
                {locations.filter(l => l !== fromLocation).map((location) => (
                  <SelectItem key={location} value={location}>
                    {location}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Departure Date */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-muted-foreground">Departure Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full h-12 justify-start text-left font-normal bg-background",
                    !departureDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {departureDate ? format(departureDate, "PPP") : "Select date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-popover z-50" align="start">
                <Calendar
                  mode="single"
                  selected={departureDate}
                  onSelect={setDepartureDate}
                  disabled={(date) => date < new Date()}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Return Date (for round trip) */}
          {tripType === 'round-trip' && (
            <div className="space-y-2">
              <Label className="text-sm font-medium text-muted-foreground">Return Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full h-12 justify-start text-left font-normal bg-background",
                      !returnDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {returnDate ? format(returnDate, "PPP") : "Select return date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-popover z-50" align="start">
                  <Calendar
                    mode="single"
                    selected={returnDate}
                    onSelect={setReturnDate}
                    disabled={(date) => date < (departureDate || new Date())}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          )}

          {/* Adults Counter */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-muted-foreground">Adults</Label>
            <div className="flex items-center h-12 border rounded-md bg-background">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-full rounded-r-none"
                onClick={() => setAdults(Math.max(1, adults - 1))}
                disabled={adults <= 1}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <div className="flex-1 text-center font-medium">{adults}</div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-full rounded-l-none"
                onClick={() => setAdults(Math.min(10, adults + 1))}
                disabled={adults >= 10}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Proceed Button */}
          <Button 
            onClick={handleProceed} 
            className="w-full h-12 text-base font-semibold gradient-primary hover:opacity-90 transition-opacity"
            disabled={!fromLocation || !toLocation || !departureDate}
          >
            Proceed
          </Button>
        </TabsContent>

        <TabsContent value="hire" className="p-6 space-y-5 mt-0">
          <div className="text-center py-8">
            <Bus className="h-16 w-16 mx-auto text-primary mb-4" />
            <h3 className="text-xl font-semibold mb-2">Hire a Bus</h3>
            <p className="text-muted-foreground mb-6">
              Need to charter a bus for your group, event, or special occasion?
            </p>
            <Button 
              onClick={() => navigate('/auth')}
              className="w-full h-12 text-base font-semibold gradient-primary hover:opacity-90"
            >
              Request a Quote
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="status" className="p-6 space-y-5 mt-0">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-muted-foreground">Booking Number</Label>
              <Input
                placeholder="Enter your booking number"
                value={bookingNumber}
                onChange={(e) => setBookingNumber(e.target.value)}
                className="h-12 bg-background"
              />
            </div>
            <Button 
              onClick={handleCheckBooking}
              className="w-full h-12 text-base font-semibold gradient-primary hover:opacity-90"
              disabled={!bookingNumber}
            >
              <Search className="mr-2 h-4 w-4" />
              Check Status
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default HeroBookingForm;

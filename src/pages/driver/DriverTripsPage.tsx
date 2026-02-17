import { useState } from 'react';
import { format, isToday, isTomorrow, parseISO } from 'date-fns';
import { useDriverTrips, useUpcomingDriverTrips, DriverTrip } from '@/hooks/useDriverTrips';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Bus, 
  MapPin, 
  Clock, 
  CalendarDays, 
  ChevronRight,
  Navigation,
  Users
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

export default function DriverTripsPage() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [viewMode, setViewMode] = useState<'upcoming' | 'date'>('upcoming');
  const dateString = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : undefined;
  
  const { data: upcomingTrips, isLoading: upcomingLoading } = useUpcomingDriverTrips();
  const { data: dateTrips, isLoading: dateLoading } = useDriverTrips(dateString);
  const navigate = useNavigate();

  const displayTrips = viewMode === 'upcoming' ? upcomingTrips : dateTrips;
  const isLoading = viewMode === 'upcoming' ? upcomingLoading : dateLoading;

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'scheduled':
        return <Badge variant="secondary">Scheduled</Badge>;
      case 'in_progress':
        return <Badge className="bg-info text-info-foreground">In Progress</Badge>;
      case 'completed':
        return <Badge className="bg-success text-success-foreground">Completed</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status || 'Pending'}</Badge>;
    }
  };

  const getDateLabel = (date: Date | undefined) => {
    if (!date) return 'Select date';
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    return format(date, 'EEE, MMM d');
  };

  const TripCard = ({ trip }: { trip: DriverTrip }) => (
    <Card 
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => navigate(`/driver/trip/${trip.id}`)}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <Bus className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold">{trip.bus?.registration_number}</p>
              <p className="text-sm text-muted-foreground">{trip.bus?.model}</p>
            </div>
          </div>
          {getStatusBadge(trip.status)}
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="h-4 w-4 text-success" />
            <span className="font-medium">{trip.route?.origin}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Navigation className="h-4 w-4 text-destructive" />
            <span className="font-medium">{trip.route?.destination}</span>
          </div>
        </div>

        <div className="flex items-center justify-between mt-4 pt-3 border-t">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>{trip.departure_time}</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span>{trip.available_seats ?? trip.bus?.capacity ?? '--'} seats</span>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Trips</h1>
          <p className="text-muted-foreground">View and manage your assigned trips</p>
        </div>
      </div>

      <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'upcoming' | 'date')}>
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="date">By Date</TabsTrigger>
          </TabsList>
          
          {viewMode === 'date' && (
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <CalendarDays className="h-4 w-4" />
                  {getDateLabel(selectedDate)}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          )}
        </div>

        <TabsContent value="upcoming" className="mt-4">
          {renderTripsContent()}
        </TabsContent>
        
        <TabsContent value="date" className="mt-4">
          {renderTripsContent()}
        </TabsContent>
      </Tabs>
    </div>
  );

  function renderTripsContent() {
    if (isLoading) {
      return (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-24 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      );
    }
    
    if (displayTrips && displayTrips.length > 0) {
      return (
        <div className="space-y-4">
          {displayTrips.map((trip) => (
            <TripCard key={trip.id} trip={trip} />
          ))}
        </div>
      );
    }
    
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Bus className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-1">No trips found</h3>
          <p className="text-muted-foreground text-center">
            {viewMode === 'upcoming' 
              ? "You don't have any upcoming trips assigned"
              : `You don't have any trips assigned for ${getDateLabel(selectedDate).toLowerCase()}`
            }
          </p>
        </CardContent>
      </Card>
    );
  }
}

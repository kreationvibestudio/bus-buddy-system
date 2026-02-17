import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Users, 
  Search, 
  Bus,
  Phone,
  UserCheck
} from 'lucide-react';
import { format } from 'date-fns';
import { sampleCurrentTrip, samplePassengerManifest, PassengerManifestEntry } from '@/data/sampleDriverData';

interface TripInfo {
  id: string;
  trip_date: string;
  departure_time: string;
  status: string | null;
  route: {
    name: string;
    origin: string;
    destination: string;
  } | null;
  bus: {
    registration_number: string;
    capacity: number;
  } | null;
}

export default function DriverPassengersPage() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch today's trip
  const { data: currentTrip, isLoading } = useQuery({
    queryKey: ['driver-current-trip', user?.id],
    queryFn: async () => {
      // Get driver ID
      const { data: driverData, error: driverError } = await supabase
        .from('drivers')
        .select('id')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (driverError) throw driverError;
      if (!driverData) return null;

      // Get today's active trip
      const today = format(new Date(), 'yyyy-MM-dd');
      const { data: tripData, error: tripError } = await supabase
        .from('trips')
        .select(`
          id,
          trip_date,
          departure_time,
          status,
          route:routes(name, origin, destination),
          bus:buses(registration_number, capacity)
        `)
        .eq('driver_id', driverData.id)
        .eq('trip_date', today)
        .in('status', ['scheduled', 'in_progress'])
        .order('departure_time', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (tripError) throw tripError;
      return tripData as TripInfo | null;
    },
    enabled: !!user?.id,
    refetchInterval: 30000,
  });

  // Fetch passengers for the trip - in real implementation, this would join with profiles
  const { data: passengers } = useQuery({
    queryKey: ['trip-passengers-manifest', currentTrip?.id],
    queryFn: async () => {
      if (!currentTrip?.id) return [];
      
      // In a real implementation, this would fetch from bookings joined with passenger details
      // For now, return empty array to show sample data
      return [] as PassengerManifestEntry[];
    },
    enabled: !!currentTrip?.id,
  });

  // Use sample data if no real data exists
  const displayTrip = currentTrip || sampleCurrentTrip as unknown as TripInfo;
  const displayPassengers = (passengers && passengers.length > 0) 
    ? passengers 
    : samplePassengerManifest;
  const hasRealData = !!currentTrip && !!passengers && passengers.length > 0;

  // Filter passengers by search term
  const filteredPassengers = displayPassengers.filter(passenger =>
    passenger.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    passenger.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    passenger.phone.includes(searchTerm) ||
    passenger.seatNumber.toString().includes(searchTerm)
  );

  const totalPassengers = displayPassengers.length;
  const busCapacity = displayTrip.bus?.capacity || 42;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Passenger Manifest</h1>
        <p className="text-muted-foreground">
          {displayTrip.route?.origin} → {displayTrip.route?.destination}
        </p>
        {!hasRealData && (
          <Badge variant="outline" className="mt-2">Sample Data</Badge>
        )}
      </div>

      {/* Trip Info Card */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Bus className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold">{displayTrip.bus?.registration_number}</p>
                <p className="text-sm text-muted-foreground">
                  Departure: {displayTrip.departure_time}
                </p>
              </div>
            </div>
            <div className="text-right">
              <Badge className={displayTrip.status === 'in_progress' ? 'bg-info text-info-foreground' : ''}>
                {displayTrip.status === 'in_progress' ? 'In Progress' : 'Scheduled'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Total Passengers Card */}
      <Card>
        <CardContent className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-success/10">
              <UserCheck className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalPassengers}</p>
              <p className="text-sm text-muted-foreground">Total Passengers</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-lg font-semibold text-muted-foreground">
              {busCapacity - totalPassengers} seats available
            </p>
            <p className="text-sm text-muted-foreground">of {busCapacity} capacity</p>
          </div>
        </CardContent>
      </Card>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name, phone, or seat number..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Passenger Manifest Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Passengers ({filteredPassengers.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {filteredPassengers.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">Seat</TableHead>
                    <TableHead>Passenger Name</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Next of Kin</TableHead>
                    <TableHead>NoK Phone</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPassengers
                    .sort((a, b) => a.seatNumber - b.seatNumber)
                    .map((passenger) => (
                    <TableRow key={passenger.id}>
                      <TableCell className="font-bold text-primary">
                        {passenger.seatNumber}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">
                          {passenger.firstName} {passenger.lastName}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {passenger.boardingStop} → {passenger.alightingStop}
                        </div>
                      </TableCell>
                      <TableCell>
                        <a 
                          href={`tel:${passenger.phone.replace(/\s/g, '')}`}
                          className="flex items-center gap-1 text-primary hover:underline"
                        >
                          <Phone className="h-3 w-3" />
                          {passenger.phone}
                        </a>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {passenger.nextOfKinName}
                      </TableCell>
                      <TableCell>
                        <a 
                          href={`tel:${passenger.nextOfKinPhone.replace(/\s/g, '')}`}
                          className="flex items-center gap-1 text-muted-foreground hover:text-primary hover:underline"
                        >
                          <Phone className="h-3 w-3" />
                          {passenger.nextOfKinPhone}
                        </a>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No passengers found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
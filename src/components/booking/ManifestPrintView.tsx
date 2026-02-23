import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface PassengerManifestEntry {
  booking_number: string;
  seat_number: number;
  passenger_name: string;
  passenger_phone?: string;
  passenger_count: number;
  total_fare: number;
}

interface ManifestPrintViewProps {
  trip: {
    id: string;
    trip_date: string;
    departure_time: string;
    arrival_time: string;
    route?: {
      name: string;
      origin: string;
      destination: string;
    } | null;
    bus?: {
      registration_number: string;
      capacity: number;
    } | null;
  };
  passengers: PassengerManifestEntry[];
  onClose?: () => void;
}

export function ManifestPrintView({ trip, passengers, onClose }: ManifestPrintViewProps) {
  const handlePrint = () => {
    window.print();
  };

  const sortedPassengers = [...passengers].sort((a, b) => a.seat_number - b.seat_number);
  const totalPassengers = passengers.reduce((sum, p) => sum + p.passenger_count, 0);
  const totalRevenue = passengers.reduce((sum, p) => sum + p.total_fare, 0);

  return (
    <div className="space-y-4">
      {/* Print button - hidden when printing */}
      <div className="flex justify-end gap-2 print:hidden">
        {onClose && (
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        )}
        <Button onClick={handlePrint} className="gap-2">
          <Printer className="h-4 w-4" />
          Print Manifest
        </Button>
      </div>

      {/* Manifest content - optimized for printing */}
      <div className="bg-white p-8 border-2 border-dashed border-gray-300 max-w-4xl mx-auto print:border-none print:p-4">
        {/* Header */}
        <div className="text-center mb-6 print:mb-4">
          <h1 className="text-3xl font-bold print:text-2xl">FleetMaster Bus</h1>
          <p className="text-sm text-muted-foreground print:text-xs">EagleLine Transportation</p>
        </div>

        <div className="border-t-2 border-b-2 border-primary py-4 my-4 print:py-2 print:my-2">
          <div className="text-center">
            <p className="text-sm text-muted-foreground print:text-xs">PASSENGER MANIFEST</p>
          </div>
        </div>

        {/* Trip Details */}
        <div className="grid grid-cols-2 gap-4 mb-6 print:mb-4 print:gap-2">
          <div>
            <p className="text-xs text-muted-foreground print:text-xs">Route</p>
            <p className="text-lg font-bold print:text-base">
              {trip.route?.origin || 'Origin'} → {trip.route?.destination || 'Destination'}
            </p>
            {trip.route?.name && (
              <p className="text-sm text-muted-foreground print:text-xs">{trip.route.name}</p>
            )}
          </div>
          <div>
            <p className="text-xs text-muted-foreground print:text-xs">Date & Time</p>
            <p className="font-semibold print:text-sm">
              {format(new Date(trip.trip_date), 'EEE, MMM d, yyyy')} at {trip.departure_time}
            </p>
          </div>
        </div>

        {trip.bus && (
          <div className="mb-4 print:mb-2">
            <p className="text-xs text-muted-foreground print:text-xs">Bus</p>
            <p className="font-semibold print:text-sm">{trip.bus.registration_number}</p>
          </div>
        )}

        {/* Passenger Table */}
        <div className="mt-6 print:mt-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="print:text-xs">Seat</TableHead>
                <TableHead className="print:text-xs">Booking #</TableHead>
                <TableHead className="print:text-xs">Passenger Name</TableHead>
                <TableHead className="print:text-xs">Phone</TableHead>
                <TableHead className="print:text-xs">Passengers</TableHead>
                <TableHead className="text-right print:text-xs">Fare</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedPassengers.map((passenger, idx) => (
                <TableRow key={idx}>
                  <TableCell className="font-medium print:text-xs">{passenger.seat_number}</TableCell>
                  <TableCell className="font-mono print:text-xs">{passenger.booking_number}</TableCell>
                  <TableCell className="print:text-xs">{passenger.passenger_name}</TableCell>
                  <TableCell className="print:text-xs">{passenger.passenger_phone || '-'}</TableCell>
                  <TableCell className="print:text-xs">{passenger.passenger_count}</TableCell>
                  <TableCell className="text-right print:text-xs">{passenger.total_fare.toLocaleString('en-NG', { style: 'currency', currency: 'NGN' })}</TableCell>
                </TableRow>
              ))}
              {sortedPassengers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8 print:text-xs">
                    No passengers booked for this trip
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Summary */}
        <div className="mt-6 pt-4 border-t print:mt-4 print:pt-2">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-semibold print:text-xs">Total Passengers: {totalPassengers}</p>
              <p className="text-sm font-semibold print:text-xs">Total Bookings: {passengers.length}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold print:text-xs">Total Revenue</p>
              <p className="text-xl font-bold print:text-lg">{totalRevenue.toLocaleString('en-NG', { style: 'currency', currency: 'NGN' })}</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center text-xs text-muted-foreground print:mt-4 print:text-xs">
          <p>Generated on {format(new Date(), 'MMM d, yyyy HH:mm')}</p>
        </div>
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          @page {
            margin: 0.5cm;
            size: A4 landscape;
          }
          body * {
            visibility: hidden;
          }
          .manifest-print-content,
          .manifest-print-content * {
            visibility: visible;
          }
          .manifest-print-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}

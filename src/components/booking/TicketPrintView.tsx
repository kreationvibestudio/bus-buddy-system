import { format } from 'date-fns';
import { formatCurrency } from '@/lib/currency';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';

interface TicketPrintViewProps {
  booking: {
    booking_number: string;
    passenger_count: number;
    seat_numbers: number[];
    total_fare: number;
    booked_at: string;
    trip?: {
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
      } | null;
    } | null;
  };
  passengerName?: string;
  passengerPhone?: string;
  onClose?: () => void;
}

export function TicketPrintView({ booking, passengerName, passengerPhone, onClose }: TicketPrintViewProps) {
  const handlePrint = () => {
    window.print();
  };

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
          Print Ticket
        </Button>
      </div>

      {/* Ticket content - optimized for printing */}
      <div className="bg-white p-8 border-2 border-dashed border-gray-300 max-w-2xl mx-auto print:border-none print:p-4">
        {/* Header */}
        <div className="text-center mb-6 print:mb-4">
          <h1 className="text-3xl font-bold print:text-2xl">FleetMaster Bus</h1>
          <p className="text-sm text-muted-foreground print:text-xs">EagleLine Transportation</p>
        </div>

        <div className="border-t-2 border-b-2 border-primary py-4 my-4 print:py-2 print:my-2">
          <div className="text-center">
            <p className="text-sm text-muted-foreground print:text-xs">BOOKING CONFIRMATION</p>
            <p className="text-2xl font-bold font-mono print:text-xl">{booking.booking_number}</p>
          </div>
        </div>

        {/* Passenger Info */}
        {(passengerName || passengerPhone) && (
          <div className="mb-4 print:mb-2">
            <h3 className="text-sm font-semibold mb-2 print:text-xs">Passenger Details</h3>
            <div className="space-y-1 text-sm print:text-xs">
              {passengerName && <p><span className="font-medium">Name:</span> {passengerName}</p>}
              {passengerPhone && <p><span className="font-medium">Phone:</span> {passengerPhone}</p>}
            </div>
          </div>
        )}

        {/* Trip Details */}
        {booking.trip && (
          <div className="space-y-4 print:space-y-2">
            <div>
              <h3 className="text-sm font-semibold mb-2 print:text-xs">Route</h3>
              <p className="text-lg font-bold print:text-base">
                {booking.trip.route?.origin || 'Origin'} → {booking.trip.route?.destination || 'Destination'}
              </p>
              {booking.trip.route?.name && (
                <p className="text-sm text-muted-foreground print:text-xs">{booking.trip.route.name}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 print:gap-2">
              <div>
                <p className="text-xs text-muted-foreground print:text-xs">Date</p>
                <p className="font-semibold print:text-sm">{format(new Date(booking.trip.trip_date), 'EEE, MMM d, yyyy')}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground print:text-xs">Departure Time</p>
                <p className="font-semibold print:text-sm">{booking.trip.departure_time}</p>
              </div>
            </div>

            {booking.trip.bus && (
              <div>
                <p className="text-xs text-muted-foreground print:text-xs">Bus</p>
                <p className="font-semibold print:text-sm">{booking.trip.bus.registration_number}</p>
              </div>
            )}
          </div>
        )}

        {/* Seat & Passenger Info */}
        <div className="grid grid-cols-2 gap-4 mt-6 print:mt-4 print:gap-2">
          <div>
            <p className="text-xs text-muted-foreground print:text-xs">Seat{booking.seat_numbers.length > 1 ? 's' : ''}</p>
            <p className="font-semibold print:text-sm">{booking.seat_numbers.join(', ')}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground print:text-xs">Passenger{booking.passenger_count > 1 ? 's' : ''}</p>
            <p className="font-semibold print:text-sm">{booking.passenger_count}</p>
          </div>
        </div>

        {/* Fare */}
        <div className="border-t-2 border-primary mt-6 pt-4 print:mt-4 print:pt-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-semibold print:text-xs">Total Fare</span>
            <span className="text-xl font-bold print:text-lg">{formatCurrency(booking.total_fare)}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center text-xs text-muted-foreground print:mt-4 print:text-xs">
          <p>Booked on {format(new Date(booking.booked_at), 'MMM d, yyyy HH:mm')}</p>
          <p className="mt-2 print:mt-1">Please arrive at the terminal 15 minutes before departure</p>
          <p className="mt-1">Present this ticket at boarding</p>
        </div>
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          @page {
            margin: 0.5cm;
            size: A4;
          }
          body * {
            visibility: hidden;
          }
          .ticket-print-content,
          .ticket-print-content * {
            visibility: visible;
          }
          .ticket-print-content {
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

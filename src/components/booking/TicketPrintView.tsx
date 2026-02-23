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

/** Build plain HTML for ticket so we can print in a dedicated window (one page, POS width, no app chrome). */
function buildTicketPrintDocument(props: TicketPrintViewProps): string {
  const { booking, passengerName, passengerPhone } = props;
  const route = booking.trip?.route;
  const origin = route?.origin ?? 'Origin';
  const destination = route?.destination ?? 'Destination';
  const routeName = route?.name ?? '';
  const tripDate = booking.trip?.trip_date ? format(new Date(booking.trip.trip_date), 'EEE, MMM d, yyyy') : '';
  const depTime = booking.trip?.departure_time ?? '';
  const busReg = booking.trip?.bus?.registration_number ?? '';
  const bookedAt = format(new Date(booking.booked_at), 'MMM d, yyyy HH:mm');
  const totalFare = formatCurrency(booking.total_fare);
  const seats = booking.seat_numbers?.join(', ') ?? '';
  const passengerBlock =
    passengerName || passengerPhone
      ? `
    <div class="block">
      <div class="label">Passenger Details</div>
      ${passengerName ? `<div>Name: ${escapeHtml(passengerName)}</div>` : ''}
      ${passengerPhone ? `<div>Phone: ${escapeHtml(passengerPhone)}</div>` : ''}
    </div>`
      : '';
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Ticket ${escapeHtml(booking.booking_number)}</title>
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; padding: 8px; font-family: system-ui, sans-serif; font-size: 12px; color: #111; }
    .ticket { max-width: 80mm; margin: 0 auto; }
    .center { text-align: center; }
    .bold { font-weight: 700; }
    .mt { margin-top: 6px; }
    .mt2 { margin-top: 10px; }
    .pt { padding-top: 8px; border-top: 2px solid #2563eb; }
    .label { font-size: 10px; color: #666; margin-bottom: 2px; }
    h1 { font-size: 18px; margin: 0 0 2px 0; }
    .sub { font-size: 10px; color: #666; }
    .booking-no { font-size: 16px; letter-spacing: 0.05em; }
    .row { display: flex; justify-content: space-between; gap: 8px; }
    @page { size: 80mm auto; margin: 4mm; }
    @media print { body { padding: 0; } .ticket { max-width: none; width: 80mm; } }
  </style>
</head>
<body>
  <div class="ticket">
    <div class="center">
      <h1>FleetMaster Bus</h1>
      <p class="sub">EagleLine Transportation</p>
    </div>
    <div class="center pt mt">
      <div class="label">BOOKING CONFIRMATION</div>
      <div class="booking-no bold">${escapeHtml(booking.booking_number)}</div>
    </div>
    ${passengerBlock}
    <div class="block mt2">
      <div class="label">Route</div>
      <div class="bold">${escapeHtml(origin)} → ${escapeHtml(destination)}</div>
      ${routeName ? `<div class="sub">${escapeHtml(routeName)}</div>` : ''}
    </div>
    <div class="row mt">
      <div><div class="label">Date</div><div>${escapeHtml(tripDate)}</div></div>
      <div><div class="label">Departure Time</div><div>${escapeHtml(depTime)}</div></div>
    </div>
    ${busReg ? `<div class="mt"><div class="label">Bus</div><div>${escapeHtml(busReg)}</div></div>` : ''}
    <div class="row mt">
      <div><div class="label">Seat${booking.seat_numbers?.length > 1 ? 's' : ''}</div><div>${escapeHtml(seats)}</div></div>
      <div><div class="label">Passenger${booking.passenger_count > 1 ? 's' : ''}</div><div>${booking.passenger_count}</div></div>
    </div>
    <div class="pt mt row">
      <span class="label">Total Fare</span>
      <span class="bold">${escapeHtml(totalFare)}</span>
    </div>
    <div class="center mt2 sub">
      <p>Booked on ${escapeHtml(bookedAt)}</p>
      <p>Please arrive at the terminal 15 minutes before departure</p>
      <p>Present this ticket at boarding</p>
    </div>
  </div>
</body>
</html>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function TicketPrintView({ booking, passengerName, passengerPhone, onClose }: TicketPrintViewProps) {
  const handlePrint = () => {
    const doc = buildTicketPrintDocument({ booking, passengerName, passengerPhone, onClose });
    const win = window.open('', '_blank', 'noopener,noreferrer');
    if (win) {
      win.document.write(doc);
      win.document.close();
      win.focus();
      win.onload = () => {
        win.print();
        win.afterprint = () => win.close();
        setTimeout(() => win.close(), 500);
      };
      return;
    }
    // Popup blocked: print from a hidden iframe so we still get one receipt-sized page
    const iframe = document.createElement('iframe');
    iframe.setAttribute('style', 'position:absolute;width:0;height:0;border:0;');
    document.body.appendChild(iframe);
    const iframeWin = iframe.contentWindow;
    const iframeDoc = iframeWin?.document;
    if (iframeDoc && iframeWin) {
      iframeDoc.open();
      iframeDoc.write(doc);
      iframeDoc.close();
      const cleanup = () => {
        try { document.body.removeChild(iframe); } catch { /* already removed */ }
      };
      iframeWin.onload = () => {
        iframeWin.print();
        iframeWin.onafterprint = cleanup;
        setTimeout(cleanup, 3000);
      };
    } else {
      document.body.removeChild(iframe);
    }
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
    </div>
  );
}

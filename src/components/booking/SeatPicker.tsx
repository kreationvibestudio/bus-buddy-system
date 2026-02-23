import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { useTakenSeatsForTrip } from '@/hooks/useBookings';

interface SeatPickerProps {
  tripId: string | null;
  passengerCount: number;
  value: number[];
  onChange: (seats: number[]) => void;
  label?: string;
  className?: string;
}

export function SeatPicker({ tripId, passengerCount, value, onChange, label = 'Select seats', className }: SeatPickerProps) {
  const { data, isLoading } = useTakenSeatsForTrip(tripId);
  const { takenSeats = [], capacity = 40 } = data ?? {};
  const takenSet = useMemo(() => new Set(takenSeats), [takenSeats]);

  const handleToggle = (seat: number) => {
    if (takenSet.has(seat)) return;
    const next = value.includes(seat)
      ? value.filter((s) => s !== seat)
      : value.length < passengerCount
        ? [...value, seat].sort((a, b) => a - b)
        : [...value.slice(1), seat].sort((a, b) => a - b);
    onChange(next);
  };

  if (!tripId) return null;
  if (isLoading) return <div className={cn('text-sm text-muted-foreground', className)}>Loading seats…</div>;

  const seats = Array.from({ length: capacity }, (_, i) => i + 1);
  const cols = 4;
  const rows = Math.ceil(seats.length / cols);

  return (
    <div className={cn('space-y-2', className)}>
      <p className="text-sm font-medium">{label}</p>
      <p className="text-xs text-muted-foreground">Choose {passengerCount} seat{passengerCount > 1 ? 's' : ''}. Click to select.</p>
      <div className="inline-grid gap-2" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 2.5rem))` }}>
        {seats.map((seat) => {
          const taken = takenSet.has(seat);
          const selected = value.includes(seat);
          return (
            <button
              key={seat}
              type="button"
              disabled={taken}
              onClick={() => handleToggle(seat)}
              className={cn(
                'h-10 w-10 rounded-lg border text-sm font-medium transition-colors',
                taken && 'cursor-not-allowed border-muted bg-muted/50 text-muted-foreground',
                !taken && selected && 'border-primary bg-primary text-primary-foreground',
                !taken && !selected && 'border-border bg-background hover:border-primary hover:bg-primary/10'
              )}
            >
              {taken ? '—' : seat}
            </button>
          );
        })}
      </div>
      {value.length > 0 && (
        <p className="text-xs text-muted-foreground">
          Selected: {value.join(', ')}
        </p>
      )}
    </div>
  );
}

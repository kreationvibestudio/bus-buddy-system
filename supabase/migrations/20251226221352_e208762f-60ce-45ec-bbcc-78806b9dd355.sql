-- Create enum for booking type
CREATE TYPE public.booking_type AS ENUM ('one_way', 'round_trip');

-- Add round trip columns to bookings table
ALTER TABLE public.bookings 
ADD COLUMN booking_type public.booking_type NOT NULL DEFAULT 'one_way',
ADD COLUMN linked_booking_id uuid REFERENCES public.bookings(id) ON DELETE SET NULL,
ADD COLUMN is_return_leg boolean NOT NULL DEFAULT false;

-- Create index for linked bookings
CREATE INDEX idx_bookings_linked_booking ON public.bookings(linked_booking_id) WHERE linked_booking_id IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.bookings.linked_booking_id IS 'For round trips, links the outbound and return bookings together';
COMMENT ON COLUMN public.bookings.is_return_leg IS 'True if this booking is the return leg of a round trip';
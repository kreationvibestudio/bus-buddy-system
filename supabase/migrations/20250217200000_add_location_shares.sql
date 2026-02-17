-- Table for passengers to share live bus location with contacts
-- Share token allows unauthenticated access to view bus location via Edge Function
CREATE TABLE IF NOT EXISTS public.location_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  share_token TEXT NOT NULL UNIQUE,
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_location_shares_token ON public.location_shares(share_token);
CREATE INDEX IF NOT EXISTS idx_location_shares_booking ON public.location_shares(booking_id);

ALTER TABLE public.location_shares ENABLE ROW LEVEL SECURITY;

-- Passengers can create shares for their own bookings
CREATE POLICY "Users can create shares for own bookings"
  ON public.location_shares FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.bookings
      WHERE bookings.id = booking_id AND bookings.user_id = auth.uid()
    )
  );

-- Users can view their own shares
CREATE POLICY "Users can view own shares"
  ON public.location_shares FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.bookings
      WHERE bookings.id = booking_id AND bookings.user_id = auth.uid()
    )
  );

-- Users can delete their own shares
CREATE POLICY "Users can delete own shares"
  ON public.location_shares FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.bookings
      WHERE bookings.id = booking_id AND bookings.user_id = auth.uid()
    )
  );

COMMENT ON TABLE public.location_shares IS 'Share tokens for passengers to share live bus location with contacts';

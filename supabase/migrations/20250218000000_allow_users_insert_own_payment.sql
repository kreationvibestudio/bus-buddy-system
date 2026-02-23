-- Allow users to insert a payment record for their own booking (e.g. "Pay at terminal")
CREATE POLICY "Users can insert payment for own booking"
  ON public.payments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.bookings
      WHERE bookings.id = payments.booking_id AND bookings.user_id = auth.uid()
    )
  );


-- Allow drivers to update their assigned trips (start/end trip)
CREATE POLICY "Drivers can update assigned trips"
ON public.trips
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM drivers
    WHERE drivers.user_id = auth.uid()
    AND drivers.id = trips.driver_id
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM drivers
    WHERE drivers.user_id = auth.uid()
    AND drivers.id = trips.driver_id
  )
);

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "System can insert locations" ON public.bus_locations;

-- Create a proper policy that only allows drivers to insert locations for their assigned bus
CREATE POLICY "Drivers can insert own bus locations" 
ON public.bus_locations 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM drivers d
    JOIN buses b ON b.current_driver_id = d.id
    WHERE d.user_id = auth.uid() AND b.id = bus_id
  )
);
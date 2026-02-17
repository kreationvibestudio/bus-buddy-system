-- Drop existing restrictive policies on drivers table
DROP POLICY IF EXISTS "Admin can manage drivers" ON public.drivers;
DROP POLICY IF EXISTS "Drivers can view own record" ON public.drivers;
DROP POLICY IF EXISTS "Staff can view driver operational data" ON public.drivers;

-- Recreate as permissive policies (default behavior)
CREATE POLICY "Admin can manage drivers" 
ON public.drivers 
FOR ALL 
TO authenticated 
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Drivers can view own record" 
ON public.drivers 
FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

CREATE POLICY "Staff can view all drivers" 
ON public.drivers 
FOR SELECT 
TO authenticated 
USING (public.has_role(auth.uid(), 'staff'::app_role));

CREATE POLICY "Mechanics can view drivers" 
ON public.drivers 
FOR SELECT 
TO authenticated 
USING (public.has_role(auth.uid(), 'mechanic'::app_role));

CREATE POLICY "Accounts can view drivers" 
ON public.drivers 
FOR SELECT 
TO authenticated 
USING (public.has_role(auth.uid(), 'accounts'::app_role));
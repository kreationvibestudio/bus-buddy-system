-- Add WITH CHECK clause to existing admin policy for full UPDATE support
DROP POLICY IF EXISTS "Admin can manage profiles" ON public.profiles;

CREATE POLICY "Admin can manage profiles" 
ON public.profiles 
FOR ALL 
TO authenticated 
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
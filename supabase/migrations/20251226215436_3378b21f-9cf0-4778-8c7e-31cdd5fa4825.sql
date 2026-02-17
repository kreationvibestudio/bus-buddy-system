-- Fix the Security Definer View issue by recreating with SECURITY INVOKER
DROP VIEW IF EXISTS public.drivers_operational;

CREATE VIEW public.drivers_operational 
WITH (security_invoker = true)
AS
SELECT 
  d.id,
  d.user_id,
  d.status,
  d.rating,
  d.total_trips,
  d.hire_date,
  p.full_name,
  p.avatar_url
FROM public.drivers d
LEFT JOIN public.profiles p ON p.user_id = d.user_id;

-- Re-grant access to the view
GRANT SELECT ON public.drivers_operational TO authenticated;
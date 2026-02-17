-- Create a trigger function to auto-create driver record when driver role is assigned
CREATE OR REPLACE FUNCTION public.handle_driver_role_assignment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only trigger when a 'driver' role is assigned
  IF NEW.role = 'driver' THEN
    -- Check if driver record already exists for this user
    IF NOT EXISTS (SELECT 1 FROM public.drivers WHERE user_id = NEW.user_id) THEN
      -- Create a placeholder driver record
      INSERT INTO public.drivers (user_id, license_number, license_expiry, status)
      VALUES (
        NEW.user_id,
        'DL-PENDING-' || substr(NEW.user_id::text, 1, 8),
        CURRENT_DATE + INTERVAL '1 year',
        'active'
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger on user_roles table
DROP TRIGGER IF EXISTS on_driver_role_assigned ON public.user_roles;
CREATE TRIGGER on_driver_role_assigned
  AFTER INSERT ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_driver_role_assignment();
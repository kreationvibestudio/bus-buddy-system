-- Create driver_leaves table for leave management
CREATE TABLE public.driver_leaves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES public.drivers(id) ON DELETE CASCADE,
  leave_type TEXT NOT NULL DEFAULT 'annual',
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  approved_by UUID,
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.driver_leaves ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admin can manage leaves" ON public.driver_leaves
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Staff can view leaves" ON public.driver_leaves
  FOR SELECT USING (public.has_role(auth.uid(), 'staff'));

CREATE POLICY "Drivers can view own leaves" ON public.driver_leaves
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM drivers WHERE drivers.id = driver_leaves.driver_id AND drivers.user_id = auth.uid())
  );

CREATE POLICY "Drivers can create own leave requests" ON public.driver_leaves
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM drivers WHERE drivers.id = driver_leaves.driver_id AND drivers.user_id = auth.uid())
  );

-- Update trigger
CREATE TRIGGER update_driver_leaves_updated_at
  BEFORE UPDATE ON public.driver_leaves
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to check for expiring leaves and create notifications
CREATE OR REPLACE FUNCTION public.notify_leave_expiring()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  leave_record RECORD;
  driver_user_id UUID;
  admin_record RECORD;
  days_left INTEGER;
BEGIN
  -- Find leaves ending in the next 3 days that are still active
  FOR leave_record IN 
    SELECT dl.*, d.user_id as driver_user_id, p.full_name as driver_name
    FROM driver_leaves dl
    JOIN drivers d ON d.id = dl.driver_id
    JOIN profiles p ON p.user_id = d.user_id
    WHERE dl.status = 'approved' 
      AND dl.end_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '3 days'
  LOOP
    days_left := leave_record.end_date - CURRENT_DATE;
    
    -- Notify driver
    INSERT INTO notifications (user_id, title, message, type, related_id)
    VALUES (
      leave_record.driver_user_id,
      'Leave Ending Soon',
      'Your ' || leave_record.leave_type || ' leave ends in ' || days_left || ' day(s) on ' || to_char(leave_record.end_date, 'Mon DD, YYYY'),
      'leave_expiring',
      leave_record.id
    )
    ON CONFLICT DO NOTHING;
    
    -- Notify all admins
    FOR admin_record IN SELECT ur.user_id FROM user_roles ur WHERE ur.role = 'admin'
    LOOP
      INSERT INTO notifications (user_id, title, message, type, related_id)
      VALUES (
        admin_record.user_id,
        'Driver Leave Ending',
        leave_record.driver_name || '''s ' || leave_record.leave_type || ' leave ends in ' || days_left || ' day(s)',
        'leave_expiring',
        leave_record.id
      )
      ON CONFLICT DO NOTHING;
    END LOOP;
  END LOOP;
END;
$$;
-- Create notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'general',
  is_read BOOLEAN NOT NULL DEFAULT false,
  related_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can only see their own notifications
CREATE POLICY "Users can view own notifications"
ON public.notifications
FOR SELECT
USING (auth.uid() = user_id);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications"
ON public.notifications
FOR UPDATE
USING (auth.uid() = user_id);

-- System can insert notifications
CREATE POLICY "System can insert notifications"
ON public.notifications
FOR INSERT
WITH CHECK (true);

-- Admin can manage all notifications
CREATE POLICY "Admin can manage notifications"
ON public.notifications
FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Function to notify admins when a stock request is created
CREATE OR REPLACE FUNCTION public.notify_admins_on_stock_request()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_record RECORD;
  requester_name TEXT;
  item_name TEXT;
BEGIN
  -- Only trigger on new pending requests
  IF NEW.status = 'pending' THEN
    -- Get requester name
    SELECT p.full_name INTO requester_name
    FROM profiles p
    WHERE p.user_id = NEW.requested_by;
    
    -- Get item name
    SELECT i.name INTO item_name
    FROM inventory_items i
    WHERE i.id = NEW.item_id;
    
    -- Insert notification for each admin
    FOR admin_record IN 
      SELECT ur.user_id FROM user_roles ur WHERE ur.role = 'admin'
    LOOP
      INSERT INTO notifications (user_id, title, message, type, related_id)
      VALUES (
        admin_record.user_id,
        'New Parts Request',
        COALESCE(requester_name, 'A user') || ' requested ' || NEW.quantity_requested || 'x ' || COALESCE(item_name, 'item'),
        'parts_request',
        NEW.id
      );
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Function to notify storekeepers when admin approves
CREATE OR REPLACE FUNCTION public.notify_storekeepers_on_approval()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  storekeeper_record RECORD;
  item_name TEXT;
BEGIN
  -- Only trigger when status changes to admin_approved
  IF OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'admin_approved' THEN
    -- Get item name
    SELECT i.name INTO item_name
    FROM inventory_items i
    WHERE i.id = NEW.item_id;
    
    -- Insert notification for each storekeeper
    FOR storekeeper_record IN 
      SELECT ur.user_id FROM user_roles ur WHERE ur.role = 'storekeeper'
    LOOP
      INSERT INTO notifications (user_id, title, message, type, related_id)
      VALUES (
        storekeeper_record.user_id,
        'Parts Request Approved',
        'Admin approved request for ' || NEW.quantity_requested || 'x ' || COALESCE(item_name, 'item') || ' - Ready for dispatch',
        'parts_request',
        NEW.id
      );
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create triggers
CREATE TRIGGER on_stock_request_created
  AFTER INSERT ON public.stock_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_admins_on_stock_request();

CREATE TRIGGER on_stock_request_approved
  AFTER UPDATE ON public.stock_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_storekeepers_on_approval();
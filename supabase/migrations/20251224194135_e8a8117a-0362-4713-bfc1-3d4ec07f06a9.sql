-- =============================================
-- PHASE 1: Add Missing Tables for Bus Management System
-- =============================================

-- 1. STATIONS TABLE (Reusable across routes)
CREATE TABLE public.stations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT UNIQUE,
  address TEXT,
  city TEXT,
  latitude NUMERIC,
  longitude NUMERIC,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.stations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view stations" ON public.stations
  FOR SELECT USING (true);

CREATE POLICY "Admin can manage stations" ON public.stations
  FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Staff can manage stations" ON public.stations
  FOR ALL USING (has_role(auth.uid(), 'staff'));

CREATE TRIGGER update_stations_updated_at
  BEFORE UPDATE ON public.stations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. ROUTE_STATIONS TABLE (Junction table)
CREATE TABLE public.route_stations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  route_id UUID NOT NULL REFERENCES public.routes(id) ON DELETE CASCADE,
  station_id UUID NOT NULL REFERENCES public.stations(id) ON DELETE CASCADE,
  stop_order INTEGER NOT NULL,
  distance_from_origin_km NUMERIC,
  fare_from_origin NUMERIC,
  estimated_time_minutes INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(route_id, station_id),
  UNIQUE(route_id, stop_order)
);

ALTER TABLE public.route_stations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view route stations" ON public.route_stations
  FOR SELECT USING (true);

CREATE POLICY "Admin can manage route stations" ON public.route_stations
  FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Staff can manage route stations" ON public.route_stations
  FOR ALL USING (has_role(auth.uid(), 'staff'));

-- 3. SEATS TABLE
CREATE TABLE public.seats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bus_id UUID NOT NULL REFERENCES public.buses(id) ON DELETE CASCADE,
  seat_number TEXT NOT NULL,
  seat_type TEXT DEFAULT 'standard',
  seat_row INTEGER,
  deck INTEGER DEFAULT 1,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(bus_id, seat_number)
);

ALTER TABLE public.seats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view seats" ON public.seats
  FOR SELECT USING (true);

CREATE POLICY "Admin can manage seats" ON public.seats
  FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Staff can manage seats" ON public.seats
  FOR ALL USING (has_role(auth.uid(), 'staff'));

-- 4. PAYMENTS TABLE
CREATE TYPE public.payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded');

CREATE TABLE public.payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  payment_method TEXT,
  transaction_id TEXT,
  status public.payment_status NOT NULL DEFAULT 'pending',
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own payments" ON public.payments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.bookings 
      WHERE bookings.id = payments.booking_id 
      AND bookings.user_id = auth.uid()
    )
  );

CREATE POLICY "Admin can manage payments" ON public.payments
  FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Accounts can manage payments" ON public.payments
  FOR ALL USING (has_role(auth.uid(), 'accounts'));

CREATE POLICY "Staff can view payments" ON public.payments
  FOR SELECT USING (has_role(auth.uid(), 'staff'));

CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5. SUPPLIERS TABLE
CREATE TABLE public.suppliers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  contact_person TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Storekeeper can manage suppliers" ON public.suppliers
  FOR ALL USING (has_role(auth.uid(), 'storekeeper') OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Staff can view suppliers" ON public.suppliers
  FOR SELECT USING (has_role(auth.uid(), 'staff'));

CREATE TRIGGER update_suppliers_updated_at
  BEFORE UPDATE ON public.suppliers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 6. Add supplier_id to inventory_items
ALTER TABLE public.inventory_items 
  ADD COLUMN supplier_id UUID REFERENCES public.suppliers(id);

-- 7. STOCK_MOVEMENTS TABLE
CREATE TABLE public.stock_movements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  item_id UUID NOT NULL REFERENCES public.inventory_items(id) ON DELETE CASCADE,
  movement_type TEXT NOT NULL CHECK (movement_type IN ('in', 'out', 'adjustment')),
  quantity INTEGER NOT NULL,
  reference_type TEXT,
  reference_id UUID,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Storekeeper can manage stock movements" ON public.stock_movements
  FOR ALL USING (has_role(auth.uid(), 'storekeeper') OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Mechanic can view stock movements" ON public.stock_movements
  FOR SELECT USING (has_role(auth.uid(), 'mechanic'));

-- 8. STOCK_REQUESTS TABLE
CREATE TYPE public.stock_request_status AS ENUM ('pending', 'approved', 'rejected', 'fulfilled');

CREATE TABLE public.stock_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  requested_by UUID NOT NULL REFERENCES auth.users(id),
  item_id UUID NOT NULL REFERENCES public.inventory_items(id),
  quantity_requested INTEGER NOT NULL,
  quantity_approved INTEGER,
  status public.stock_request_status NOT NULL DEFAULT 'pending',
  work_order_id UUID REFERENCES public.work_orders(id),
  notes TEXT,
  approved_by UUID REFERENCES auth.users(id),
  fulfilled_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.stock_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own requests" ON public.stock_requests
  FOR SELECT USING (auth.uid() = requested_by);

CREATE POLICY "Users can create requests" ON public.stock_requests
  FOR INSERT WITH CHECK (auth.uid() = requested_by);

CREATE POLICY "Storekeeper can manage requests" ON public.stock_requests
  FOR ALL USING (has_role(auth.uid(), 'storekeeper') OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Mechanic can manage requests" ON public.stock_requests
  FOR ALL USING (has_role(auth.uid(), 'mechanic'));

CREATE TRIGGER update_stock_requests_updated_at
  BEFORE UPDATE ON public.stock_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 9. COMPLAINTS TABLE
CREATE TYPE public.complaint_status AS ENUM ('open', 'in_progress', 'resolved', 'closed');

CREATE TABLE public.complaints (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  booking_id UUID REFERENCES public.bookings(id),
  trip_id UUID REFERENCES public.trips(id),
  category TEXT,
  subject TEXT NOT NULL,
  description TEXT,
  status public.complaint_status NOT NULL DEFAULT 'open',
  priority TEXT DEFAULT 'medium',
  assigned_to UUID REFERENCES auth.users(id),
  resolution TEXT,
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own complaints" ON public.complaints
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create complaints" ON public.complaints
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admin can manage complaints" ON public.complaints
  FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Staff can manage complaints" ON public.complaints
  FOR ALL USING (has_role(auth.uid(), 'staff'));

CREATE TRIGGER update_complaints_updated_at
  BEFORE UPDATE ON public.complaints
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 10. INCIDENTS TABLE
CREATE TYPE public.incident_severity AS ENUM ('low', 'medium', 'high', 'critical');

CREATE TABLE public.incidents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  driver_id UUID NOT NULL REFERENCES public.drivers(id),
  trip_id UUID REFERENCES public.trips(id),
  bus_id UUID REFERENCES public.buses(id),
  incident_type TEXT NOT NULL,
  severity public.incident_severity NOT NULL DEFAULT 'medium',
  description TEXT NOT NULL,
  location_description TEXT,
  latitude NUMERIC,
  longitude NUMERIC,
  reported_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT DEFAULT 'open',
  resolution TEXT,
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Driver can view own incidents" ON public.incidents
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.drivers 
      WHERE drivers.id = incidents.driver_id 
      AND drivers.user_id = auth.uid()
    )
  );

CREATE POLICY "Driver can create incidents" ON public.incidents
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.drivers 
      WHERE drivers.id = incidents.driver_id 
      AND drivers.user_id = auth.uid()
    )
  );

CREATE POLICY "Admin can manage incidents" ON public.incidents
  FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Staff can manage incidents" ON public.incidents
  FOR ALL USING (has_role(auth.uid(), 'staff'));

CREATE TRIGGER update_incidents_updated_at
  BEFORE UPDATE ON public.incidents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 11. MESSAGES TABLE
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  from_user_id UUID NOT NULL REFERENCES auth.users(id),
  to_user_id UUID NOT NULL REFERENCES auth.users(id),
  subject TEXT,
  body TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own messages" ON public.messages
  FOR SELECT USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);

CREATE POLICY "Users can send messages" ON public.messages
  FOR INSERT WITH CHECK (auth.uid() = from_user_id);

CREATE POLICY "Users can update own received messages" ON public.messages
  FOR UPDATE USING (auth.uid() = to_user_id);

CREATE POLICY "Admin can manage messages" ON public.messages
  FOR ALL USING (has_role(auth.uid(), 'admin'));
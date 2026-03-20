-- ============================================================================
-- EAGLELINE BUS BUDDY SYSTEM - COMPLETE DATABASE SCHEMA
-- ============================================================================
-- This is a consolidated schema from all migrations.
-- Run this in the Supabase SQL Editor to set up your database.
-- ============================================================================

-- ============================================================================
-- PART 1: ENUMS (Custom Types)
-- ============================================================================
-- Note: PostgreSQL doesn't support "CREATE TYPE IF NOT EXISTS"
-- So we use DO blocks to create types only if they don't exist
-- ============================================================================

-- User roles
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'driver', 'passenger', 'storekeeper', 'mechanic', 'staff', 'accounts');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Bus status
DO $$ BEGIN
  CREATE TYPE public.bus_status AS ENUM ('active', 'maintenance', 'out_of_service');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Booking status
DO $$ BEGIN
  CREATE TYPE public.booking_status AS ENUM ('pending', 'confirmed', 'cancelled', 'completed');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Booking type
DO $$ BEGIN
  CREATE TYPE public.booking_type AS ENUM ('one_way', 'round_trip');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Maintenance status
DO $$ BEGIN
  CREATE TYPE public.maintenance_status AS ENUM ('scheduled', 'in_progress', 'completed', 'cancelled');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Work order status
DO $$ BEGIN
  CREATE TYPE public.work_order_status AS ENUM ('pending', 'assigned', 'in_progress', 'completed', 'cancelled');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Payment status
DO $$ BEGIN
  CREATE TYPE public.payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Stock request status
DO $$ BEGIN
  CREATE TYPE public.stock_request_status AS ENUM ('pending', 'approved', 'admin_approved', 'rejected', 'fulfilled');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Complaint status
DO $$ BEGIN
  CREATE TYPE public.complaint_status AS ENUM ('open', 'in_progress', 'resolved', 'closed');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Incident severity
DO $$ BEGIN
  CREATE TYPE public.incident_severity AS ENUM ('low', 'medium', 'high', 'critical');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Job card status
DO $$ BEGIN
  CREATE TYPE public.job_card_status AS ENUM (
    'draft',
    'inspection_complete',
    'in_progress',
    'awaiting_parts',
    'completed',
    'closed'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Fault repair status
DO $$ BEGIN
  CREATE TYPE public.fault_repair_status AS ENUM (
    'pending',
    'in_progress',
    'completed',
    'deferred'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ============================================================================
-- PART 2: CORE TABLES
-- ============================================================================

-- Profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- User roles table
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- States table (Nigerian states)
CREATE TABLE IF NOT EXISTS public.states (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  code TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Stations table
CREATE TABLE IF NOT EXISTS public.stations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT UNIQUE,
  address TEXT,
  city TEXT,
  state_id UUID REFERENCES public.states(id),
  latitude NUMERIC,
  longitude NUMERIC,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Buses table
CREATE TABLE IF NOT EXISTS public.buses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_number TEXT NOT NULL UNIQUE,
  model TEXT NOT NULL,
  manufacturer TEXT,
  year INTEGER,
  capacity INTEGER NOT NULL DEFAULT 40,
  status bus_status NOT NULL DEFAULT 'active',
  current_driver_id UUID,
  fuel_type TEXT DEFAULT 'diesel',
  last_maintenance_date DATE,
  next_maintenance_date DATE,
  mileage INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Drivers table
CREATE TABLE IF NOT EXISTS public.drivers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  license_number TEXT NOT NULL UNIQUE,
  license_expiry DATE NOT NULL,
  date_of_birth DATE,
  address TEXT,
  emergency_contact TEXT,
  emergency_phone TEXT,
  hire_date DATE DEFAULT CURRENT_DATE,
  status TEXT DEFAULT 'active',
  rating DECIMAL(2,1) DEFAULT 5.0,
  total_trips INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add foreign key for buses.current_driver_id
ALTER TABLE public.buses 
ADD CONSTRAINT fk_buses_driver 
FOREIGN KEY (current_driver_id) REFERENCES public.drivers(id) ON DELETE SET NULL;

-- Driver leaves table
CREATE TABLE IF NOT EXISTS public.driver_leaves (
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

-- Routes table
CREATE TABLE IF NOT EXISTS public.routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  origin TEXT NOT NULL,
  destination TEXT NOT NULL,
  distance_km DECIMAL(10,2),
  estimated_duration_minutes INTEGER,
  base_fare DECIMAL(10,2) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Route stops table
CREATE TABLE IF NOT EXISTS public.route_stops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id UUID REFERENCES public.routes(id) ON DELETE CASCADE NOT NULL,
  stop_name TEXT NOT NULL,
  stop_order INTEGER NOT NULL,
  distance_from_origin_km DECIMAL(10,2),
  estimated_time_from_origin_minutes INTEGER,
  fare_from_origin DECIMAL(10,2),
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Route stations junction table
CREATE TABLE IF NOT EXISTS public.route_stations (
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

-- Seats table
CREATE TABLE IF NOT EXISTS public.seats (
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

-- Schedules table
CREATE TABLE IF NOT EXISTS public.schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id UUID REFERENCES public.routes(id) ON DELETE CASCADE NOT NULL,
  bus_id UUID REFERENCES public.buses(id) ON DELETE SET NULL,
  driver_id UUID REFERENCES public.drivers(id) ON DELETE SET NULL,
  departure_time TIME NOT NULL,
  arrival_time TIME NOT NULL,
  days_of_week INTEGER[] DEFAULT '{1,2,3,4,5,6,0}',
  is_active BOOLEAN DEFAULT true,
  effective_from DATE DEFAULT CURRENT_DATE,
  effective_until DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Trips table
CREATE TABLE IF NOT EXISTS public.trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id UUID REFERENCES public.schedules(id) ON DELETE SET NULL,
  route_id UUID REFERENCES public.routes(id) ON DELETE CASCADE NOT NULL,
  bus_id UUID REFERENCES public.buses(id) ON DELETE SET NULL,
  driver_id UUID REFERENCES public.drivers(id) ON DELETE SET NULL,
  trip_date DATE NOT NULL,
  departure_time TIME NOT NULL,
  actual_departure_time TIME,
  arrival_time TIME NOT NULL,
  actual_arrival_time TIME,
  status TEXT DEFAULT 'scheduled',
  available_seats INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Bookings table
CREATE TABLE IF NOT EXISTS public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_number TEXT NOT NULL UNIQUE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  trip_id UUID REFERENCES public.trips(id) ON DELETE CASCADE NOT NULL,
  boarding_stop_id UUID REFERENCES public.route_stops(id),
  alighting_stop_id UUID REFERENCES public.route_stops(id),
  seat_numbers INTEGER[] NOT NULL,
  passenger_count INTEGER NOT NULL DEFAULT 1,
  total_fare DECIMAL(10,2) NOT NULL,
  status booking_status NOT NULL DEFAULT 'pending',
  booking_type booking_type NOT NULL DEFAULT 'one_way',
  linked_booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  is_return_leg BOOLEAN NOT NULL DEFAULT false,
  payment_status TEXT DEFAULT 'pending',
  payment_method TEXT,
  booked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for linked bookings
CREATE INDEX IF NOT EXISTS idx_bookings_linked_booking ON public.bookings(linked_booking_id) WHERE linked_booking_id IS NOT NULL;

-- Payments table
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  payment_method TEXT,
  transaction_id TEXT,
  status payment_status NOT NULL DEFAULT 'pending',
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Bus locations table
CREATE TABLE IF NOT EXISTS public.bus_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bus_id UUID REFERENCES public.buses(id) ON DELETE CASCADE NOT NULL,
  trip_id UUID REFERENCES public.trips(id) ON DELETE SET NULL,
  latitude DECIMAL(10,8) NOT NULL,
  longitude DECIMAL(11,8) NOT NULL,
  speed DECIMAL(5,2),
  heading DECIMAL(5,2),
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- PART 3: INVENTORY & MAINTENANCE TABLES
-- ============================================================================

-- Suppliers table
CREATE TABLE IF NOT EXISTS public.suppliers (
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

-- Inventory categories table
CREATE TABLE IF NOT EXISTS public.inventory_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Inventory items table
CREATE TABLE IF NOT EXISTS public.inventory_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES public.inventory_categories(id) ON DELETE SET NULL,
  supplier_id UUID REFERENCES public.suppliers(id),
  name TEXT NOT NULL,
  sku TEXT UNIQUE,
  description TEXT,
  quantity INTEGER NOT NULL DEFAULT 0,
  min_quantity INTEGER DEFAULT 5,
  unit TEXT DEFAULT 'piece',
  unit_cost DECIMAL(10,2),
  location TEXT,
  supplier TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Stock movements table
CREATE TABLE IF NOT EXISTS public.stock_movements (
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

-- Maintenance records table
CREATE TABLE IF NOT EXISTS public.maintenance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bus_id UUID REFERENCES public.buses(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL,
  description TEXT,
  scheduled_date DATE NOT NULL,
  completed_date DATE,
  status maintenance_status NOT NULL DEFAULT 'scheduled',
  cost DECIMAL(10,2),
  mechanic_id UUID REFERENCES public.drivers(id) ON DELETE SET NULL,
  odometer_reading INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Job cards table
CREATE TABLE IF NOT EXISTS public.job_cards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_card_number TEXT NOT NULL UNIQUE,
  bus_id UUID NOT NULL REFERENCES public.buses(id) ON DELETE CASCADE,
  driver_id UUID REFERENCES public.drivers(id) ON DELETE SET NULL,
  mechanic_id UUID NOT NULL,
  odometer_reading INTEGER NOT NULL,
  reason_for_visit TEXT NOT NULL,
  customer_complaint TEXT,
  status job_card_status NOT NULL DEFAULT 'draft',
  priority TEXT NOT NULL DEFAULT 'medium',
  estimated_completion TIMESTAMP WITH TIME ZONE,
  actual_completion TIMESTAMP WITH TIME ZONE,
  total_labor_hours NUMERIC(10,2) DEFAULT 0,
  total_cost NUMERIC(12,2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Vehicle inspections table
CREATE TABLE IF NOT EXISTS public.vehicle_inspections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_card_id UUID NOT NULL REFERENCES public.job_cards(id) ON DELETE CASCADE,
  inspection_type TEXT NOT NULL DEFAULT 'pre_work',
  fuel_level TEXT,
  exterior_condition JSONB DEFAULT '{}',
  interior_condition TEXT,
  tire_front_left JSONB DEFAULT '{"condition": "good", "tread_depth": "", "pressure": ""}',
  tire_front_right JSONB DEFAULT '{"condition": "good", "tread_depth": "", "pressure": ""}',
  tire_rear_left JSONB DEFAULT '{"condition": "good", "tread_depth": "", "pressure": ""}',
  tire_rear_right JSONB DEFAULT '{"condition": "good", "tread_depth": "", "pressure": ""}',
  spare_tire JSONB DEFAULT '{"present": true, "condition": "good"}',
  lights_working BOOLEAN DEFAULT true,
  horn_working BOOLEAN DEFAULT true,
  wipers_working BOOLEAN DEFAULT true,
  mirrors_condition TEXT,
  battery_condition TEXT,
  fluid_levels JSONB DEFAULT '{"oil": "ok", "coolant": "ok", "brake_fluid": "ok", "power_steering": "ok", "windshield_washer": "ok"}',
  personal_items TEXT,
  inspected_by UUID NOT NULL,
  inspected_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  photos JSONB DEFAULT '[]',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Job card faults table
CREATE TABLE IF NOT EXISTS public.job_card_faults (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_card_id UUID NOT NULL REFERENCES public.job_cards(id) ON DELETE CASCADE,
  fault_code TEXT,
  fault_category TEXT NOT NULL,
  description TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'moderate',
  diagnosis TEXT,
  repair_action TEXT,
  repair_status fault_repair_status NOT NULL DEFAULT 'pending',
  labor_hours NUMERIC(10,2) DEFAULT 0,
  parts_used JSONB DEFAULT '[]',
  logged_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Work orders table
CREATE TABLE IF NOT EXISTS public.work_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  maintenance_id UUID REFERENCES public.maintenance_records(id) ON DELETE CASCADE,
  job_card_id UUID REFERENCES public.job_cards(id) ON DELETE SET NULL,
  bus_id UUID REFERENCES public.buses(id) ON DELETE CASCADE NOT NULL,
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT DEFAULT 'medium',
  status work_order_status NOT NULL DEFAULT 'pending',
  due_date DATE,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for work orders
CREATE INDEX IF NOT EXISTS idx_work_orders_job_card_id ON public.work_orders(job_card_id);

-- Parts usage table
CREATE TABLE IF NOT EXISTS public.parts_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id UUID REFERENCES public.work_orders(id) ON DELETE CASCADE NOT NULL,
  item_id UUID REFERENCES public.inventory_items(id) ON DELETE CASCADE NOT NULL,
  quantity INTEGER NOT NULL,
  issued_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Stock requests table
CREATE TABLE IF NOT EXISTS public.stock_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  requested_by UUID NOT NULL REFERENCES auth.users(id),
  item_id UUID NOT NULL REFERENCES public.inventory_items(id),
  quantity_requested INTEGER NOT NULL,
  quantity_approved INTEGER,
  status stock_request_status NOT NULL DEFAULT 'pending',
  work_order_id UUID REFERENCES public.work_orders(id),
  notes TEXT,
  approved_by UUID REFERENCES auth.users(id),
  fulfilled_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ============================================================================
-- PART 4: FINANCE & ACCOUNTS TABLES
-- ============================================================================

-- Transactions table
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,
  category TEXT NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  description TEXT,
  reference_id UUID,
  reference_type TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Payroll table
CREATE TABLE IF NOT EXISTS public.payroll (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID REFERENCES public.drivers(id) ON DELETE CASCADE NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  base_salary DECIMAL(10,2) NOT NULL,
  bonus DECIMAL(10,2) DEFAULT 0,
  deductions DECIMAL(10,2) DEFAULT 0,
  net_amount DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'pending',
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- PART 5: COMMUNICATION & SUPPORT TABLES
-- ============================================================================

-- Complaints table
CREATE TABLE IF NOT EXISTS public.complaints (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  booking_id UUID REFERENCES public.bookings(id),
  trip_id UUID REFERENCES public.trips(id),
  category TEXT,
  subject TEXT NOT NULL,
  description TEXT,
  status complaint_status NOT NULL DEFAULT 'open',
  priority TEXT DEFAULT 'medium',
  assigned_to UUID REFERENCES auth.users(id),
  resolution TEXT,
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Incidents table
CREATE TABLE IF NOT EXISTS public.incidents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  driver_id UUID NOT NULL REFERENCES public.drivers(id),
  trip_id UUID REFERENCES public.trips(id),
  bus_id UUID REFERENCES public.buses(id),
  incident_type TEXT NOT NULL,
  severity incident_severity NOT NULL DEFAULT 'medium',
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

-- Messages table
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  from_user_id UUID NOT NULL REFERENCES auth.users(id),
  to_user_id UUID NOT NULL REFERENCES auth.users(id),
  subject TEXT,
  body TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'general',
  is_read BOOLEAN NOT NULL DEFAULT false,
  related_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Security audit log
CREATE TABLE IF NOT EXISTS public.security_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id UUID,
  accessed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  ip_address TEXT,
  user_agent TEXT
);

-- ============================================================================
-- PART 6: FUNCTIONS
-- ============================================================================

-- Update timestamp function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Check user role function
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Get user role function
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_roles WHERE user_id = _user_id LIMIT 1
$$;

-- Handle new user signup function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email),
    NEW.email
  );
  
  -- Default role is passenger
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'passenger');
  
  RETURN NEW;
END;
$$;

-- Generate booking number function
CREATE OR REPLACE FUNCTION public.generate_booking_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.booking_number := 'BK' || TO_CHAR(NOW(), 'YYYYMMDD') || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
  RETURN NEW;
END;
$$;

-- Generate job card number function
CREATE OR REPLACE FUNCTION public.generate_job_card_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.job_card_number := 'JC-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Handle driver role assignment function
CREATE OR REPLACE FUNCTION public.handle_driver_role_assignment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.role = 'driver' THEN
    IF NOT EXISTS (SELECT 1 FROM public.drivers WHERE user_id = NEW.user_id) THEN
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

-- Payroll authorization check
CREATE OR REPLACE FUNCTION public.is_payroll_authorized(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('accounts', 'admin')
  )
$$;

-- Notify admins on stock request function
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
  IF NEW.status = 'pending' THEN
    SELECT p.full_name INTO requester_name
    FROM profiles p
    WHERE p.user_id = NEW.requested_by;
    
    SELECT i.name INTO item_name
    FROM inventory_items i
    WHERE i.id = NEW.item_id;
    
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

-- Notify storekeepers on approval function
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
  IF OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'admin_approved' THEN
    SELECT i.name INTO item_name
    FROM inventory_items i
    WHERE i.id = NEW.item_id;
    
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

-- ============================================================================
-- PART 7: TRIGGERS
-- ============================================================================

-- Auth user created trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Booking number trigger
DROP TRIGGER IF EXISTS set_booking_number ON public.bookings;
CREATE TRIGGER set_booking_number
  BEFORE INSERT ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.generate_booking_number();

-- Job card number trigger
DROP TRIGGER IF EXISTS generate_job_card_number_trigger ON public.job_cards;
CREATE TRIGGER generate_job_card_number_trigger
  BEFORE INSERT ON public.job_cards
  FOR EACH ROW EXECUTE FUNCTION public.generate_job_card_number();

-- Driver role assignment trigger
DROP TRIGGER IF EXISTS on_driver_role_assigned ON public.user_roles;
CREATE TRIGGER on_driver_role_assigned
  AFTER INSERT ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.handle_driver_role_assignment();

-- Stock request notifications
DROP TRIGGER IF EXISTS on_stock_request_created ON public.stock_requests;
CREATE TRIGGER on_stock_request_created
  AFTER INSERT ON public.stock_requests
  FOR EACH ROW EXECUTE FUNCTION public.notify_admins_on_stock_request();

DROP TRIGGER IF EXISTS on_stock_request_approved ON public.stock_requests;
CREATE TRIGGER on_stock_request_approved
  AFTER UPDATE ON public.stock_requests
  FOR EACH ROW EXECUTE FUNCTION public.notify_storekeepers_on_approval();

-- Updated_at triggers
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS update_buses_updated_at ON public.buses;
CREATE TRIGGER update_buses_updated_at BEFORE UPDATE ON public.buses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS update_drivers_updated_at ON public.drivers;
CREATE TRIGGER update_drivers_updated_at BEFORE UPDATE ON public.drivers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS update_routes_updated_at ON public.routes;
CREATE TRIGGER update_routes_updated_at BEFORE UPDATE ON public.routes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS update_schedules_updated_at ON public.schedules;
CREATE TRIGGER update_schedules_updated_at BEFORE UPDATE ON public.schedules FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS update_trips_updated_at ON public.trips;
CREATE TRIGGER update_trips_updated_at BEFORE UPDATE ON public.trips FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS update_bookings_updated_at ON public.bookings;
CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON public.bookings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS update_inventory_items_updated_at ON public.inventory_items;
CREATE TRIGGER update_inventory_items_updated_at BEFORE UPDATE ON public.inventory_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS update_maintenance_records_updated_at ON public.maintenance_records;
CREATE TRIGGER update_maintenance_records_updated_at BEFORE UPDATE ON public.maintenance_records FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS update_work_orders_updated_at ON public.work_orders;
CREATE TRIGGER update_work_orders_updated_at BEFORE UPDATE ON public.work_orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS update_stations_updated_at ON public.stations;
CREATE TRIGGER update_stations_updated_at BEFORE UPDATE ON public.stations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS update_payments_updated_at ON public.payments;
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS update_suppliers_updated_at ON public.suppliers;
CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON public.suppliers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS update_stock_requests_updated_at ON public.stock_requests;
CREATE TRIGGER update_stock_requests_updated_at BEFORE UPDATE ON public.stock_requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS update_complaints_updated_at ON public.complaints;
CREATE TRIGGER update_complaints_updated_at BEFORE UPDATE ON public.complaints FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS update_incidents_updated_at ON public.incidents;
CREATE TRIGGER update_incidents_updated_at BEFORE UPDATE ON public.incidents FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS update_job_cards_updated_at ON public.job_cards;
CREATE TRIGGER update_job_cards_updated_at BEFORE UPDATE ON public.job_cards FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS update_job_card_faults_updated_at ON public.job_card_faults;
CREATE TRIGGER update_job_card_faults_updated_at BEFORE UPDATE ON public.job_card_faults FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS update_driver_leaves_updated_at ON public.driver_leaves;
CREATE TRIGGER update_driver_leaves_updated_at BEFORE UPDATE ON public.driver_leaves FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- PART 8: VIEWS
-- ============================================================================

-- Drivers operational view (security invoker)
CREATE OR REPLACE VIEW public.drivers_operational 
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

GRANT SELECT ON public.drivers_operational TO authenticated;

-- ============================================================================
-- PART 9: ENABLE ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.states ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.buses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_leaves ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.route_stops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.route_stations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bus_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_card_faults ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parts_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PART 10: ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admin can manage profiles" ON public.profiles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- User roles policies
CREATE POLICY "Admin can manage roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can view own role" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);

-- States policies
CREATE POLICY "Anyone can view states" ON public.states FOR SELECT USING (true);
CREATE POLICY "Admin can manage states" ON public.states FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Stations policies
CREATE POLICY "Anyone can view stations" ON public.stations FOR SELECT USING (true);
CREATE POLICY "Admin can manage stations" ON public.stations FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Staff can manage stations" ON public.stations FOR ALL USING (has_role(auth.uid(), 'staff'));

-- Buses policies
CREATE POLICY "Anyone can view active buses" ON public.buses FOR SELECT USING (true);
CREATE POLICY "Admin can manage buses" ON public.buses FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Staff can manage buses" ON public.buses FOR ALL USING (public.has_role(auth.uid(), 'staff'));

-- Drivers policies
CREATE POLICY "Admin can manage drivers" ON public.drivers FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Drivers can view own record" ON public.drivers FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Staff can view all drivers" ON public.drivers FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'staff'::app_role));
CREATE POLICY "Mechanics can view drivers" ON public.drivers FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'mechanic'::app_role));
CREATE POLICY "Accounts can view drivers" ON public.drivers FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'accounts'::app_role));

-- Driver leaves policies
CREATE POLICY "Admin can manage leaves" ON public.driver_leaves FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Staff can view leaves" ON public.driver_leaves FOR SELECT USING (public.has_role(auth.uid(), 'staff'));
CREATE POLICY "Drivers can view own leaves" ON public.driver_leaves FOR SELECT USING (EXISTS (SELECT 1 FROM drivers WHERE drivers.id = driver_leaves.driver_id AND drivers.user_id = auth.uid()));
CREATE POLICY "Drivers can create own leave requests" ON public.driver_leaves FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM drivers WHERE drivers.id = driver_leaves.driver_id AND drivers.user_id = auth.uid()));

-- Routes policies
CREATE POLICY "Anyone can view routes" ON public.routes FOR SELECT USING (true);
CREATE POLICY "Admin can manage routes" ON public.routes FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Staff can manage routes" ON public.routes FOR ALL USING (public.has_role(auth.uid(), 'staff'));

-- Route stops policies
CREATE POLICY "Anyone can view route stops" ON public.route_stops FOR SELECT USING (true);
CREATE POLICY "Admin can manage route stops" ON public.route_stops FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Route stations policies
CREATE POLICY "Anyone can view route stations" ON public.route_stations FOR SELECT USING (true);
CREATE POLICY "Admin can manage route stations" ON public.route_stations FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Staff can manage route stations" ON public.route_stations FOR ALL USING (has_role(auth.uid(), 'staff'));

-- Seats policies
CREATE POLICY "Anyone can view seats" ON public.seats FOR SELECT USING (true);
CREATE POLICY "Admin can manage seats" ON public.seats FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Staff can manage seats" ON public.seats FOR ALL USING (has_role(auth.uid(), 'staff'));

-- Schedules policies
CREATE POLICY "Anyone can view schedules" ON public.schedules FOR SELECT USING (true);
CREATE POLICY "Admin can manage schedules" ON public.schedules FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Staff can manage schedules" ON public.schedules FOR ALL USING (public.has_role(auth.uid(), 'staff'));

-- Trips policies
CREATE POLICY "Anyone can view trips" ON public.trips FOR SELECT USING (true);
CREATE POLICY "Admin can manage trips" ON public.trips FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Staff can manage trips" ON public.trips FOR ALL USING (public.has_role(auth.uid(), 'staff'));
CREATE POLICY "Drivers can view assigned trips" ON public.trips FOR SELECT USING (EXISTS (SELECT 1 FROM public.drivers WHERE user_id = auth.uid() AND id = trips.driver_id));
CREATE POLICY "Drivers can update assigned trips" ON public.trips FOR UPDATE USING (EXISTS (SELECT 1 FROM drivers WHERE drivers.user_id = auth.uid() AND drivers.id = trips.driver_id)) WITH CHECK (EXISTS (SELECT 1 FROM drivers WHERE drivers.user_id = auth.uid() AND drivers.id = trips.driver_id));

-- Bookings policies
CREATE POLICY "Users can view own bookings" ON public.bookings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create bookings" ON public.bookings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own bookings" ON public.bookings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admin can manage bookings" ON public.bookings FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Staff can view bookings" ON public.bookings FOR SELECT USING (public.has_role(auth.uid(), 'staff'));

-- Payments policies
CREATE POLICY "Users can view own payments" ON public.payments FOR SELECT USING (EXISTS (SELECT 1 FROM public.bookings WHERE bookings.id = payments.booking_id AND bookings.user_id = auth.uid()));
CREATE POLICY "Admin can manage payments" ON public.payments FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Accounts can manage payments" ON public.payments FOR ALL USING (has_role(auth.uid(), 'accounts'));
CREATE POLICY "Staff can view payments" ON public.payments FOR SELECT USING (has_role(auth.uid(), 'staff'));

-- Bus locations policies
CREATE POLICY "Anyone can view bus locations" ON public.bus_locations FOR SELECT USING (true);
CREATE POLICY "Drivers can insert own bus locations" ON public.bus_locations FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM drivers d JOIN buses b ON b.current_driver_id = d.id WHERE d.user_id = auth.uid() AND b.id = bus_id));
CREATE POLICY "Admin can manage locations" ON public.bus_locations FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Suppliers policies
CREATE POLICY "Storekeeper can manage suppliers" ON public.suppliers FOR ALL USING (has_role(auth.uid(), 'storekeeper') OR has_role(auth.uid(), 'admin'));
CREATE POLICY "Staff can view suppliers" ON public.suppliers FOR SELECT USING (has_role(auth.uid(), 'staff'));

-- Inventory policies
CREATE POLICY "Storekeeper can manage inventory categories" ON public.inventory_categories FOR ALL USING (public.has_role(auth.uid(), 'storekeeper') OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Anyone can view categories" ON public.inventory_categories FOR SELECT USING (true);
CREATE POLICY "Storekeeper can manage inventory" ON public.inventory_items FOR ALL USING (public.has_role(auth.uid(), 'storekeeper') OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Mechanic can view inventory" ON public.inventory_items FOR SELECT USING (public.has_role(auth.uid(), 'mechanic'));

-- Stock movements policies
CREATE POLICY "Storekeeper can manage stock movements" ON public.stock_movements FOR ALL USING (has_role(auth.uid(), 'storekeeper') OR has_role(auth.uid(), 'admin'));
CREATE POLICY "Mechanic can view stock movements" ON public.stock_movements FOR SELECT USING (has_role(auth.uid(), 'mechanic'));

-- Stock requests policies
CREATE POLICY "Users can view own requests" ON public.stock_requests FOR SELECT USING (auth.uid() = requested_by);
CREATE POLICY "Users can create requests" ON public.stock_requests FOR INSERT WITH CHECK (auth.uid() = requested_by);
CREATE POLICY "Storekeeper can manage requests" ON public.stock_requests FOR ALL USING (has_role(auth.uid(), 'storekeeper') OR has_role(auth.uid(), 'admin'));
CREATE POLICY "Mechanic can manage requests" ON public.stock_requests FOR ALL USING (has_role(auth.uid(), 'mechanic'));

-- Maintenance policies
CREATE POLICY "Admin can manage maintenance" ON public.maintenance_records FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Mechanic can manage maintenance" ON public.maintenance_records FOR ALL USING (public.has_role(auth.uid(), 'mechanic'));
CREATE POLICY "Staff can view maintenance" ON public.maintenance_records FOR SELECT USING (public.has_role(auth.uid(), 'staff'));

-- Job cards policies
CREATE POLICY "Admin can manage job cards" ON public.job_cards FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Mechanic can manage job cards" ON public.job_cards FOR ALL USING (has_role(auth.uid(), 'mechanic'));
CREATE POLICY "Staff can view job cards" ON public.job_cards FOR SELECT USING (has_role(auth.uid(), 'staff'));
CREATE POLICY "Driver can view own job cards" ON public.job_cards FOR SELECT USING (EXISTS (SELECT 1 FROM drivers WHERE drivers.id = job_cards.driver_id AND drivers.user_id = auth.uid()));

-- Vehicle inspections policies
CREATE POLICY "Admin can manage inspections" ON public.vehicle_inspections FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Mechanic can manage inspections" ON public.vehicle_inspections FOR ALL USING (has_role(auth.uid(), 'mechanic'));
CREATE POLICY "Staff can view inspections" ON public.vehicle_inspections FOR SELECT USING (has_role(auth.uid(), 'staff'));

-- Job card faults policies
CREATE POLICY "Admin can manage faults" ON public.job_card_faults FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Mechanic can manage faults" ON public.job_card_faults FOR ALL USING (has_role(auth.uid(), 'mechanic'));
CREATE POLICY "Staff can view faults" ON public.job_card_faults FOR SELECT USING (has_role(auth.uid(), 'staff'));

-- Work orders policies
CREATE POLICY "Admin can manage work orders" ON public.work_orders FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Mechanic can manage work orders" ON public.work_orders FOR ALL USING (public.has_role(auth.uid(), 'mechanic'));
CREATE POLICY "Assigned user can view work order" ON public.work_orders FOR SELECT USING (auth.uid() = assigned_to);

-- Parts usage policies
CREATE POLICY "Storekeeper can manage parts usage" ON public.parts_usage FOR ALL USING (public.has_role(auth.uid(), 'storekeeper') OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Mechanic can view parts usage" ON public.parts_usage FOR SELECT USING (public.has_role(auth.uid(), 'mechanic'));

-- Transactions policies
CREATE POLICY "Accounts can manage transactions" ON public.transactions FOR ALL USING (public.has_role(auth.uid(), 'accounts') OR public.has_role(auth.uid(), 'admin'));

-- Payroll policies
CREATE POLICY "Accounts can manage payroll" ON public.payroll FOR ALL USING (public.has_role(auth.uid(), 'accounts') OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Drivers can view own payroll" ON public.payroll FOR SELECT USING (EXISTS (SELECT 1 FROM public.drivers WHERE user_id = auth.uid() AND id = payroll.driver_id));

-- Complaints policies
CREATE POLICY "Users can view own complaints" ON public.complaints FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create complaints" ON public.complaints FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admin can manage complaints" ON public.complaints FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Staff can manage complaints" ON public.complaints FOR ALL USING (has_role(auth.uid(), 'staff'));

-- Incidents policies
CREATE POLICY "Driver can view own incidents" ON public.incidents FOR SELECT USING (EXISTS (SELECT 1 FROM public.drivers WHERE drivers.id = incidents.driver_id AND drivers.user_id = auth.uid()));
CREATE POLICY "Driver can create incidents" ON public.incidents FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.drivers WHERE drivers.id = incidents.driver_id AND drivers.user_id = auth.uid()));
CREATE POLICY "Admin can manage incidents" ON public.incidents FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Staff can manage incidents" ON public.incidents FOR ALL USING (has_role(auth.uid(), 'staff'));

-- Messages policies
CREATE POLICY "Users can view own messages" ON public.messages FOR SELECT USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);
CREATE POLICY "Users can send messages" ON public.messages FOR INSERT WITH CHECK (auth.uid() = from_user_id);
CREATE POLICY "Users can update own received messages" ON public.messages FOR UPDATE USING (auth.uid() = to_user_id);
CREATE POLICY "Admin can manage messages" ON public.messages FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Notifications policies
CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "System can insert notifications" ON public.notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin can manage notifications" ON public.notifications FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Security audit log policies
CREATE POLICY "Admin can view audit logs" ON public.security_audit_log FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "System can insert audit logs" ON public.security_audit_log FOR INSERT WITH CHECK (true);

-- ============================================================================
-- PART 11: ENABLE REALTIME
-- ============================================================================

ALTER PUBLICATION supabase_realtime ADD TABLE public.bus_locations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- ============================================================================
-- PART 12: SEED DATA - NIGERIAN STATES
-- ============================================================================

INSERT INTO public.states (name, code) VALUES
  ('Abia', 'AB'),
  ('Adamawa', 'AD'),
  ('Akwa Ibom', 'AK'),
  ('Anambra', 'AN'),
  ('Bauchi', 'BA'),
  ('Bayelsa', 'BY'),
  ('Benue', 'BE'),
  ('Borno', 'BO'),
  ('Cross River', 'CR'),
  ('Delta', 'DE'),
  ('Ebonyi', 'EB'),
  ('Edo', 'ED'),
  ('Ekiti', 'EK'),
  ('Enugu', 'EN'),
  ('Federal Capital Territory', 'FCT'),
  ('Gombe', 'GO'),
  ('Imo', 'IM'),
  ('Jigawa', 'JI'),
  ('Kaduna', 'KD'),
  ('Kano', 'KN'),
  ('Katsina', 'KT'),
  ('Kebbi', 'KB'),
  ('Kogi', 'KO'),
  ('Kwara', 'KW'),
  ('Lagos', 'LA'),
  ('Nasarawa', 'NA'),
  ('Niger', 'NI'),
  ('Ogun', 'OG'),
  ('Ondo', 'ON'),
  ('Osun', 'OS'),
  ('Oyo', 'OY'),
  ('Plateau', 'PL'),
  ('Rivers', 'RI'),
  ('Sokoto', 'SO'),
  ('Taraba', 'TA'),
  ('Yobe', 'YO'),
  ('Zamfara', 'ZA');


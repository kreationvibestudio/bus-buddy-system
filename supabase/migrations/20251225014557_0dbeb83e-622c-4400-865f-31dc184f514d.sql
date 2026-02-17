-- Create job card status enum
CREATE TYPE public.job_card_status AS ENUM (
  'draft',
  'inspection_complete',
  'in_progress',
  'awaiting_parts',
  'completed',
  'closed'
);

-- Create fault repair status enum
CREATE TYPE public.fault_repair_status AS ENUM (
  'pending',
  'in_progress',
  'completed',
  'deferred'
);

-- Create job_cards table
CREATE TABLE public.job_cards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_card_number TEXT NOT NULL UNIQUE,
  bus_id UUID NOT NULL REFERENCES public.buses(id) ON DELETE CASCADE,
  driver_id UUID REFERENCES public.drivers(id) ON DELETE SET NULL,
  mechanic_id UUID NOT NULL,
  odometer_reading INTEGER NOT NULL,
  reason_for_visit TEXT NOT NULL,
  customer_complaint TEXT,
  status public.job_card_status NOT NULL DEFAULT 'draft',
  priority TEXT NOT NULL DEFAULT 'medium',
  estimated_completion TIMESTAMP WITH TIME ZONE,
  actual_completion TIMESTAMP WITH TIME ZONE,
  total_labor_hours NUMERIC(10,2) DEFAULT 0,
  total_cost NUMERIC(12,2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create vehicle_inspections table
CREATE TABLE public.vehicle_inspections (
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

-- Create job_card_faults table
CREATE TABLE public.job_card_faults (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_card_id UUID NOT NULL REFERENCES public.job_cards(id) ON DELETE CASCADE,
  fault_code TEXT,
  fault_category TEXT NOT NULL,
  description TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'moderate',
  diagnosis TEXT,
  repair_action TEXT,
  repair_status public.fault_repair_status NOT NULL DEFAULT 'pending',
  labor_hours NUMERIC(10,2) DEFAULT 0,
  parts_used JSONB DEFAULT '[]',
  logged_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.job_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_card_faults ENABLE ROW LEVEL SECURITY;

-- RLS Policies for job_cards
CREATE POLICY "Admin can manage job cards"
ON public.job_cards FOR ALL
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Mechanic can manage job cards"
ON public.job_cards FOR ALL
USING (has_role(auth.uid(), 'mechanic'));

CREATE POLICY "Staff can view job cards"
ON public.job_cards FOR SELECT
USING (has_role(auth.uid(), 'staff'));

CREATE POLICY "Driver can view own job cards"
ON public.job_cards FOR SELECT
USING (EXISTS (
  SELECT 1 FROM drivers
  WHERE drivers.id = job_cards.driver_id
  AND drivers.user_id = auth.uid()
));

-- RLS Policies for vehicle_inspections
CREATE POLICY "Admin can manage inspections"
ON public.vehicle_inspections FOR ALL
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Mechanic can manage inspections"
ON public.vehicle_inspections FOR ALL
USING (has_role(auth.uid(), 'mechanic'));

CREATE POLICY "Staff can view inspections"
ON public.vehicle_inspections FOR SELECT
USING (has_role(auth.uid(), 'staff'));

-- RLS Policies for job_card_faults
CREATE POLICY "Admin can manage faults"
ON public.job_card_faults FOR ALL
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Mechanic can manage faults"
ON public.job_card_faults FOR ALL
USING (has_role(auth.uid(), 'mechanic'));

CREATE POLICY "Staff can view faults"
ON public.job_card_faults FOR SELECT
USING (has_role(auth.uid(), 'staff'));

-- Create function to generate job card number
CREATE OR REPLACE FUNCTION public.generate_job_card_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.job_card_number := 'JC-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for job card number generation
CREATE TRIGGER generate_job_card_number_trigger
BEFORE INSERT ON public.job_cards
FOR EACH ROW
EXECUTE FUNCTION public.generate_job_card_number();

-- Create trigger for updated_at on job_cards
CREATE TRIGGER update_job_cards_updated_at
BEFORE UPDATE ON public.job_cards
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger for updated_at on job_card_faults
CREATE TRIGGER update_job_card_faults_updated_at
BEFORE UPDATE ON public.job_card_faults
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
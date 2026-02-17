-- Create states table for Nigerian states
CREATE TABLE public.states (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  code TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.states ENABLE ROW LEVEL SECURITY;

-- Anyone can view states
CREATE POLICY "Anyone can view states"
ON public.states
FOR SELECT
USING (true);

-- Only admin can manage states
CREATE POLICY "Admin can manage states"
ON public.states
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add state_id to stations table
ALTER TABLE public.stations ADD COLUMN state_id UUID REFERENCES public.states(id);

-- Insert all 36 Nigerian states + FCT
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
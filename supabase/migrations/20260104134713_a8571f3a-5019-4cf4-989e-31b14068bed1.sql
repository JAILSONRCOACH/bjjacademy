-- Create modalities table
CREATE TABLE public.modalities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  academy_id UUID NOT NULL REFERENCES public.academies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  variant TEXT DEFAULT 'none', -- gi, nogi, none
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.modalities ENABLE ROW LEVEL SECURITY;

-- RLS policies for modalities
CREATE POLICY "Admins can manage modalities" ON public.modalities
FOR ALL USING (
  academy_id = get_user_academy_id(auth.uid()) 
  AND get_user_role(auth.uid()) = 'admin'::user_role
);

CREATE POLICY "Users can view modalities in their academy" ON public.modalities
FOR SELECT USING (
  academy_id = get_user_academy_id(auth.uid())
);

-- Create class_slots table
CREATE TABLE public.class_slots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  academy_id UUID NOT NULL REFERENCES public.academies(id) ON DELETE CASCADE,
  modality_id UUID NOT NULL REFERENCES public.modalities(id) ON DELETE CASCADE,
  instructor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time TIME WITHOUT TIME ZONE NOT NULL,
  end_time TIME WITHOUT TIME ZONE NOT NULL,
  shift TEXT NOT NULL CHECK (shift IN ('morning', 'afternoon', 'night')),
  title TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.class_slots ENABLE ROW LEVEL SECURITY;

-- RLS policies for class_slots
CREATE POLICY "Admins can manage class_slots" ON public.class_slots
FOR ALL USING (
  academy_id = get_user_academy_id(auth.uid()) 
  AND get_user_role(auth.uid()) = 'admin'::user_role
);

CREATE POLICY "Users can view class_slots in their academy" ON public.class_slots
FOR SELECT USING (
  academy_id = get_user_academy_id(auth.uid())
);

-- Create student_registrations table
CREATE TABLE public.student_registrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  academy_id UUID NOT NULL REFERENCES public.academies(id) ON DELETE CASCADE,
  created_by_profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  source TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('link', 'manual')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  
  -- Student data
  name TEXT NOT NULL,
  birth_date DATE,
  cpf TEXT,
  email TEXT,
  phone TEXT,
  sex TEXT DEFAULT 'nao_informado' CHECK (sex IN ('nao_informado', 'masculino', 'feminino')),
  weight_kg NUMERIC,
  belt_current TEXT NOT NULL DEFAULT 'branca' CHECK (belt_current IN ('branca', 'azul', 'roxa', 'marrom', 'preta')),
  stripes INTEGER NOT NULL DEFAULT 0 CHECK (stripes >= 0 AND stripes <= 4),
  
  -- Guardian data
  guardian_name TEXT,
  guardian_phone TEXT,
  is_minor BOOLEAN DEFAULT false,
  
  -- Assignment data
  modality_id UUID REFERENCES public.modalities(id) ON DELETE SET NULL,
  class_slot_id UUID REFERENCES public.class_slots(id) ON DELETE SET NULL,
  instructor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  
  -- Plan data
  plan_id UUID REFERENCES public.plans(id) ON DELETE SET NULL,
  next_due_at DATE,
  grace_days INTEGER DEFAULT 3,
  
  -- Computed
  computed_category TEXT,
  
  -- Status tracking
  rejection_reason TEXT,
  approved_at TIMESTAMP WITH TIME ZONE,
  rejected_at TIMESTAMP WITH TIME ZONE,
  
  -- Token for link registrations
  registration_token TEXT UNIQUE,
  token_expires_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.student_registrations ENABLE ROW LEVEL SECURITY;

-- RLS policies for student_registrations
CREATE POLICY "Admins can manage student_registrations" ON public.student_registrations
FOR ALL USING (
  academy_id = get_user_academy_id(auth.uid()) 
  AND get_user_role(auth.uid()) = 'admin'::user_role
);

CREATE POLICY "Public can insert with valid token" ON public.student_registrations
FOR INSERT WITH CHECK (
  registration_token IS NOT NULL
);

CREATE POLICY "Public can view their own registration by token" ON public.student_registrations
FOR SELECT USING (
  registration_token IS NOT NULL
);

-- Create registration_links table for storing generated links
CREATE TABLE public.registration_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  academy_id UUID NOT NULL REFERENCES public.academies(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  modality_id UUID REFERENCES public.modalities(id) ON DELETE SET NULL,
  class_slot_id UUID REFERENCES public.class_slots(id) ON DELETE SET NULL,
  instructor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  plan_id UUID REFERENCES public.plans(id) ON DELETE SET NULL,
  next_due_at DATE,
  grace_days INTEGER DEFAULT 3,
  used_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.registration_links ENABLE ROW LEVEL SECURITY;

-- RLS policies for registration_links
CREATE POLICY "Admins can manage registration_links" ON public.registration_links
FOR ALL USING (
  academy_id = get_user_academy_id(auth.uid()) 
  AND get_user_role(auth.uid()) = 'admin'::user_role
);

CREATE POLICY "Public can view valid tokens" ON public.registration_links
FOR SELECT USING (
  expires_at > now() AND used_at IS NULL
);

-- Add indexes for performance
CREATE INDEX idx_modalities_academy ON public.modalities(academy_id);
CREATE INDEX idx_class_slots_academy ON public.class_slots(academy_id);
CREATE INDEX idx_class_slots_modality ON public.class_slots(modality_id);
CREATE INDEX idx_student_registrations_academy ON public.student_registrations(academy_id);
CREATE INDEX idx_student_registrations_status ON public.student_registrations(status);
CREATE INDEX idx_registration_links_token ON public.registration_links(token);

-- Create financial status enum
CREATE TYPE public.financial_status AS ENUM ('ok', 'pending', 'overdue');

-- Create students table
CREATE TABLE public.students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id UUID NOT NULL REFERENCES public.academies(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  birth_date DATE,
  responsible_instructor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  belt_current public.belt_type NOT NULL DEFAULT 'white',
  belt_cycle_classes INTEGER NOT NULL DEFAULT 0,
  total_classes INTEGER NOT NULL DEFAULT 0,
  stripes_cached INTEGER NOT NULL DEFAULT 0,
  financial_status public.financial_status NOT NULL DEFAULT 'ok',
  status public.student_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX idx_students_academy_id ON public.students(academy_id);
CREATE INDEX idx_students_responsible_instructor_id ON public.students(responsible_instructor_id);
CREATE INDEX idx_students_profile_id ON public.students(profile_id);

-- Enable RLS
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

-- RLS Policies for students table

-- Admins can do everything in their academy
CREATE POLICY "Admins can manage students in their academy"
ON public.students
FOR ALL
USING (
  academy_id = get_user_academy_id(auth.uid()) 
  AND get_user_role(auth.uid()) = 'admin'
);

-- Professors can view students they are responsible for
CREATE POLICY "Professors can view their assigned students"
ON public.students
FOR SELECT
USING (
  academy_id = get_user_academy_id(auth.uid())
  AND get_user_role(auth.uid()) = 'professor'
  AND responsible_instructor_id = auth.uid()
);

-- Students can view only their own record
CREATE POLICY "Students can view their own record"
ON public.students
FOR SELECT
USING (
  profile_id = auth.uid()
);

-- Trigger for updated_at
CREATE TRIGGER update_students_updated_at
BEFORE UPDATE ON public.students
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- SISTEMA DE GESTÃO DE ACADEMIA DE JIU-JITSU
-- Schema completo: Enums, Tabelas, Triggers e RLS
-- =====================================================

-- 1. ENUMS
-- =====================================================

-- Roles do sistema
CREATE TYPE public.user_role AS ENUM ('admin', 'professor', 'student');

-- Faixas do Jiu-Jitsu (ordem de progressão)
CREATE TYPE public.belt_type AS ENUM ('white', 'blue', 'purple', 'brown', 'black');

-- Status do aluno
CREATE TYPE public.student_status AS ENUM ('active', 'inactive', 'suspended');

-- 2. TABELAS
-- =====================================================

-- Academias (multi-tenant)
CREATE TABLE public.academies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  timezone TEXT NOT NULL DEFAULT 'America/Sao_Paulo',
  logo_url TEXT,
  address TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Perfis de usuários (vinculados ao auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  academy_id UUID NOT NULL REFERENCES public.academies(id) ON DELETE CASCADE,
  role public.user_role NOT NULL DEFAULT 'student',
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  avatar_url TEXT,
  belt public.belt_type NOT NULL DEFAULT 'white',
  stripes INTEGER NOT NULL DEFAULT 0 CHECK (stripes >= 0 AND stripes <= 4),
  status public.student_status NOT NULL DEFAULT 'active',
  birth_date DATE,
  start_date DATE DEFAULT CURRENT_DATE,
  total_classes INTEGER NOT NULL DEFAULT 0,
  classes_since_last_stripe INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Regras de graduação por academia
CREATE TABLE public.belt_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id UUID NOT NULL REFERENCES public.academies(id) ON DELETE CASCADE,
  belt public.belt_type NOT NULL,
  classes_per_stripe INTEGER NOT NULL DEFAULT 30,
  stripes_to_promote INTEGER NOT NULL DEFAULT 4,
  gift_every_classes INTEGER,
  min_age_years INTEGER,
  min_time_months INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(academy_id, belt)
);

-- Aulas/Turmas
CREATE TABLE public.classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id UUID NOT NULL REFERENCES public.academies(id) ON DELETE CASCADE,
  professor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  day_of_week INTEGER CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  max_students INTEGER,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Registro de presenças
CREATE TABLE public.attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id UUID NOT NULL REFERENCES public.academies(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL,
  professor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  checked_in_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Histórico de graduações
CREATE TABLE public.belt_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id UUID NOT NULL REFERENCES public.academies(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  previous_belt public.belt_type,
  previous_stripes INTEGER,
  new_belt public.belt_type NOT NULL,
  new_stripes INTEGER NOT NULL,
  promoted_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reason TEXT,
  classes_at_promotion INTEGER,
  promoted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Brindes/Presentes por presença
CREATE TABLE public.gifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id UUID NOT NULL REFERENCES public.academies(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  gift_name TEXT NOT NULL,
  classes_count INTEGER NOT NULL,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. ÍNDICES
-- =====================================================

CREATE INDEX idx_profiles_academy ON public.profiles(academy_id);
CREATE INDEX idx_profiles_role ON public.profiles(role);
CREATE INDEX idx_profiles_belt ON public.profiles(belt);
CREATE INDEX idx_profiles_status ON public.profiles(status);
CREATE INDEX idx_attendance_student ON public.attendance(student_id);
CREATE INDEX idx_attendance_date ON public.attendance(checked_in_at);
CREATE INDEX idx_attendance_academy ON public.attendance(academy_id);
CREATE INDEX idx_classes_academy ON public.classes(academy_id);
CREATE INDEX idx_belt_history_student ON public.belt_history(student_id);

-- 4. FUNÇÕES E TRIGGERS
-- =====================================================

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Triggers de updated_at
CREATE TRIGGER update_academies_updated_at
  BEFORE UPDATE ON public.academies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_belt_rules_updated_at
  BEFORE UPDATE ON public.belt_rules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_classes_updated_at
  BEFORE UPDATE ON public.classes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Função para verificar role do usuário (security definer para evitar recursão)
CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
RETURNS public.user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = user_id;
$$;

-- Função para verificar academy_id do usuário
CREATE OR REPLACE FUNCTION public.get_user_academy_id(user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT academy_id FROM public.profiles WHERE id = user_id;
$$;

-- Função para verificar se usuário é admin ou professor
CREATE OR REPLACE FUNCTION public.is_admin_or_professor(user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = user_id AND role IN ('admin', 'professor')
  );
$$;

-- Função para processar presença e progressão
CREATE OR REPLACE FUNCTION public.process_attendance_progression()
RETURNS TRIGGER AS $$
DECLARE
  v_student RECORD;
  v_rule RECORD;
  v_next_belt public.belt_type;
  v_should_promote BOOLEAN := FALSE;
  v_should_add_stripe BOOLEAN := FALSE;
BEGIN
  -- Buscar dados do aluno
  SELECT * INTO v_student FROM public.profiles WHERE id = NEW.student_id;
  
  -- Atualizar contadores do aluno
  UPDATE public.profiles 
  SET 
    total_classes = total_classes + 1,
    classes_since_last_stripe = classes_since_last_stripe + 1
  WHERE id = NEW.student_id;
  
  -- Recarregar dados atualizados
  SELECT * INTO v_student FROM public.profiles WHERE id = NEW.student_id;
  
  -- Buscar regra da faixa atual
  SELECT * INTO v_rule 
  FROM public.belt_rules 
  WHERE academy_id = v_student.academy_id AND belt = v_student.belt;
  
  -- Se não tem regra ou é faixa preta com valor alto (travada), não processa
  IF v_rule IS NULL OR v_rule.classes_per_stripe > 99999 THEN
    RETURN NEW;
  END IF;
  
  -- Verificar se deve ganhar grau
  IF v_student.classes_since_last_stripe >= v_rule.classes_per_stripe THEN
    IF v_student.stripes < 4 THEN
      -- Adiciona grau
      UPDATE public.profiles 
      SET 
        stripes = stripes + 1,
        classes_since_last_stripe = 0
      WHERE id = NEW.student_id;
      
      -- Registra no histórico
      INSERT INTO public.belt_history 
        (academy_id, student_id, previous_belt, previous_stripes, new_belt, new_stripes, classes_at_promotion, reason)
      VALUES 
        (v_student.academy_id, NEW.student_id, v_student.belt, v_student.stripes, v_student.belt, v_student.stripes + 1, v_student.total_classes, 'Progressão automática por presença');
    
    ELSIF v_student.stripes = 4 AND v_student.belt != 'black' THEN
      -- Promoção de faixa
      v_next_belt := CASE v_student.belt
        WHEN 'white' THEN 'blue'::public.belt_type
        WHEN 'blue' THEN 'purple'::public.belt_type
        WHEN 'purple' THEN 'brown'::public.belt_type
        WHEN 'brown' THEN 'black'::public.belt_type
        ELSE v_student.belt
      END;
      
      UPDATE public.profiles 
      SET 
        belt = v_next_belt,
        stripes = 0,
        classes_since_last_stripe = 0
      WHERE id = NEW.student_id;
      
      -- Registra no histórico
      INSERT INTO public.belt_history 
        (academy_id, student_id, previous_belt, previous_stripes, new_belt, new_stripes, classes_at_promotion, reason)
      VALUES 
        (v_student.academy_id, NEW.student_id, v_student.belt, v_student.stripes, v_next_belt, 0, v_student.total_classes, 'Promoção automática de faixa');
    END IF;
  END IF;
  
  -- Verificar brinde por presença
  IF v_rule.gift_every_classes IS NOT NULL AND v_student.total_classes > 0 AND (v_student.total_classes % v_rule.gift_every_classes) = 0 THEN
    INSERT INTO public.gifts (academy_id, student_id, gift_name, classes_count)
    VALUES (v_student.academy_id, NEW.student_id, 'Brinde ' || v_student.total_classes || ' aulas', v_student.total_classes);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger para processar progressão após presença
CREATE TRIGGER trigger_process_attendance
  AFTER INSERT ON public.attendance
  FOR EACH ROW EXECUTE FUNCTION public.process_attendance_progression();

-- 5. ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.academies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.belt_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.belt_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gifts ENABLE ROW LEVEL SECURITY;

-- ACADEMIES: Usuários veem apenas sua academia
CREATE POLICY "Users can view their academy"
  ON public.academies FOR SELECT
  USING (id = public.get_user_academy_id(auth.uid()));

CREATE POLICY "Admins can update their academy"
  ON public.academies FOR UPDATE
  USING (id = public.get_user_academy_id(auth.uid()) AND public.get_user_role(auth.uid()) = 'admin');

-- PROFILES: Mesma academia
CREATE POLICY "Users can view profiles in their academy"
  ON public.profiles FOR SELECT
  USING (academy_id = public.get_user_academy_id(auth.uid()));

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (id = auth.uid());

CREATE POLICY "Admins and professors can update any profile in their academy"
  ON public.profiles FOR UPDATE
  USING (
    academy_id = public.get_user_academy_id(auth.uid()) 
    AND public.is_admin_or_professor(auth.uid())
  );

CREATE POLICY "Admins can insert profiles in their academy"
  ON public.profiles FOR INSERT
  WITH CHECK (
    academy_id = public.get_user_academy_id(auth.uid()) 
    AND public.get_user_role(auth.uid()) = 'admin'
  );

CREATE POLICY "Admins can delete profiles in their academy"
  ON public.profiles FOR DELETE
  USING (
    academy_id = public.get_user_academy_id(auth.uid()) 
    AND public.get_user_role(auth.uid()) = 'admin'
  );

-- BELT_RULES: Mesma academia
CREATE POLICY "Users can view belt rules of their academy"
  ON public.belt_rules FOR SELECT
  USING (academy_id = public.get_user_academy_id(auth.uid()));

CREATE POLICY "Admins can manage belt rules"
  ON public.belt_rules FOR ALL
  USING (
    academy_id = public.get_user_academy_id(auth.uid()) 
    AND public.get_user_role(auth.uid()) = 'admin'
  );

-- CLASSES: Mesma academia
CREATE POLICY "Users can view classes in their academy"
  ON public.classes FOR SELECT
  USING (academy_id = public.get_user_academy_id(auth.uid()));

CREATE POLICY "Admins and professors can manage classes"
  ON public.classes FOR ALL
  USING (
    academy_id = public.get_user_academy_id(auth.uid()) 
    AND public.is_admin_or_professor(auth.uid())
  );

-- ATTENDANCE: Mesma academia
CREATE POLICY "Users can view attendance in their academy"
  ON public.attendance FOR SELECT
  USING (academy_id = public.get_user_academy_id(auth.uid()));

CREATE POLICY "Students can view their own attendance"
  ON public.attendance FOR SELECT
  USING (student_id = auth.uid());

CREATE POLICY "Admins and professors can insert attendance"
  ON public.attendance FOR INSERT
  WITH CHECK (
    academy_id = public.get_user_academy_id(auth.uid()) 
    AND public.is_admin_or_professor(auth.uid())
  );

CREATE POLICY "Admins can delete attendance"
  ON public.attendance FOR DELETE
  USING (
    academy_id = public.get_user_academy_id(auth.uid()) 
    AND public.get_user_role(auth.uid()) = 'admin'
  );

-- BELT_HISTORY: Mesma academia
CREATE POLICY "Users can view belt history in their academy"
  ON public.belt_history FOR SELECT
  USING (academy_id = public.get_user_academy_id(auth.uid()));

CREATE POLICY "Students can view their own belt history"
  ON public.belt_history FOR SELECT
  USING (student_id = auth.uid());

CREATE POLICY "Admins and professors can insert belt history"
  ON public.belt_history FOR INSERT
  WITH CHECK (
    academy_id = public.get_user_academy_id(auth.uid()) 
    AND public.is_admin_or_professor(auth.uid())
  );

-- GIFTS: Mesma academia
CREATE POLICY "Users can view gifts in their academy"
  ON public.gifts FOR SELECT
  USING (academy_id = public.get_user_academy_id(auth.uid()));

CREATE POLICY "Students can view their own gifts"
  ON public.gifts FOR SELECT
  USING (student_id = auth.uid());

CREATE POLICY "Admins can manage gifts"
  ON public.gifts FOR ALL
  USING (
    academy_id = public.get_user_academy_id(auth.uid()) 
    AND public.get_user_role(auth.uid()) = 'admin'
  );

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

-- Create attendance status enum
CREATE TYPE public.attendance_status AS ENUM ('pending', 'approved', 'rejected');

-- Create attendance source enum
CREATE TYPE public.attendance_source AS ENUM ('app', 'manual', 'qrcode');

-- Add new columns to attendance table
ALTER TABLE public.attendance 
ADD COLUMN status public.attendance_status NOT NULL DEFAULT 'pending',
ADD COLUMN source public.attendance_source NOT NULL DEFAULT 'app',
ADD COLUMN validated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
ADD COLUMN validated_at TIMESTAMP WITH TIME ZONE;

-- Create index for faster filtering
CREATE INDEX idx_attendance_status ON public.attendance(status);
CREATE INDEX idx_attendance_student_id ON public.attendance(student_id);

-- Create trigger function to update student progression when attendance is approved
CREATE OR REPLACE FUNCTION public.process_attendance_approval()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_student RECORD;
  v_rule RECORD;
  v_next_belt public.belt_type;
BEGIN
  -- Only process when status changes to 'approved'
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
    
    -- Get the student record from students table
    SELECT * INTO v_student FROM public.students WHERE id = NEW.student_id;
    
    IF v_student IS NULL THEN
      RETURN NEW;
    END IF;
    
    -- Increment class counters
    UPDATE public.students 
    SET 
      total_classes = total_classes + 1,
      belt_cycle_classes = belt_cycle_classes + 1
    WHERE id = NEW.student_id;
    
    -- Reload updated student data
    SELECT * INTO v_student FROM public.students WHERE id = NEW.student_id;
    
    -- Get belt rule for current belt
    SELECT * INTO v_rule 
    FROM public.belt_rules 
    WHERE academy_id = v_student.academy_id AND belt = v_student.belt_current;
    
    -- If no rule or black belt with very high value (locked), skip stripe logic
    IF v_rule IS NULL OR v_rule.classes_per_stripe > 99999 THEN
      RETURN NEW;
    END IF;
    
    -- Check if student should earn a stripe
    IF v_student.belt_cycle_classes >= v_rule.classes_per_stripe THEN
      IF v_student.stripes_cached < 4 THEN
        -- Add stripe
        UPDATE public.students 
        SET 
          stripes_cached = stripes_cached + 1,
          belt_cycle_classes = 0
        WHERE id = NEW.student_id;
      ELSIF v_student.stripes_cached >= 4 AND v_student.belt_current != 'black' THEN
        -- Promote belt
        v_next_belt := CASE v_student.belt_current
          WHEN 'white' THEN 'blue'::public.belt_type
          WHEN 'blue' THEN 'purple'::public.belt_type
          WHEN 'purple' THEN 'brown'::public.belt_type
          WHEN 'brown' THEN 'black'::public.belt_type
          ELSE v_student.belt_current
        END;
        
        UPDATE public.students 
        SET 
          belt_current = v_next_belt,
          stripes_cached = 0,
          belt_cycle_classes = 0
        WHERE id = NEW.student_id;
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for attendance approval
DROP TRIGGER IF EXISTS on_attendance_approval ON public.attendance;
CREATE TRIGGER on_attendance_approval
AFTER UPDATE ON public.attendance
FOR EACH ROW
EXECUTE FUNCTION public.process_attendance_approval();

-- Update RLS policies for attendance

-- Drop existing policies first
DROP POLICY IF EXISTS "Admins and professors can insert attendance" ON public.attendance;
DROP POLICY IF EXISTS "Admins can delete attendance" ON public.attendance;
DROP POLICY IF EXISTS "Students can view their own attendance" ON public.attendance;
DROP POLICY IF EXISTS "Users can view attendance in their academy" ON public.attendance;

-- New policies

-- Admin can do everything in their academy
CREATE POLICY "Admins full access to attendance"
ON public.attendance
FOR ALL
USING (
  academy_id = get_user_academy_id(auth.uid()) 
  AND get_user_role(auth.uid()) = 'admin'
);

-- Professors can view and update attendance for their students
CREATE POLICY "Professors can view attendance for their students"
ON public.attendance
FOR SELECT
USING (
  academy_id = get_user_academy_id(auth.uid())
  AND get_user_role(auth.uid()) = 'professor'
  AND student_id IN (
    SELECT id FROM public.students 
    WHERE responsible_instructor_id = auth.uid()
  )
);

CREATE POLICY "Professors can update attendance for their students"
ON public.attendance
FOR UPDATE
USING (
  academy_id = get_user_academy_id(auth.uid())
  AND get_user_role(auth.uid()) = 'professor'
  AND student_id IN (
    SELECT id FROM public.students 
    WHERE responsible_instructor_id = auth.uid()
  )
);

-- Students can view their own attendance
CREATE POLICY "Students view own attendance"
ON public.attendance
FOR SELECT
USING (
  student_id IN (
    SELECT id FROM public.students WHERE profile_id = auth.uid()
  )
);

-- Students can insert their own check-in
CREATE POLICY "Students can check in"
ON public.attendance
FOR INSERT
WITH CHECK (
  academy_id = get_user_academy_id(auth.uid())
  AND student_id IN (
    SELECT id FROM public.students WHERE profile_id = auth.uid()
  )
  AND status = 'pending'
);
-- Create promotion_queue table
CREATE TABLE public.promotion_queue (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  academy_id UUID NOT NULL REFERENCES public.academies(id),
  student_id UUID NOT NULL REFERENCES public.students(id),
  eligible_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'done', 'ignored')),
  notes TEXT,
  processed_at TIMESTAMP WITH TIME ZONE,
  processed_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create belt_promotions table
CREATE TABLE public.belt_promotions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  academy_id UUID NOT NULL REFERENCES public.academies(id),
  student_id UUID NOT NULL REFERENCES public.students(id),
  from_belt public.belt_type NOT NULL,
  from_stripes INTEGER NOT NULL DEFAULT 0,
  to_belt public.belt_type NOT NULL,
  to_stripes INTEGER NOT NULL DEFAULT 0,
  reason TEXT,
  promoted_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create stripe_events table
CREATE TABLE public.stripe_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  academy_id UUID NOT NULL REFERENCES public.academies(id),
  student_id UUID NOT NULL REFERENCES public.students(id),
  previous_stripes INTEGER NOT NULL DEFAULT 0,
  new_stripes INTEGER NOT NULL,
  belt public.belt_type NOT NULL,
  source TEXT NOT NULL DEFAULT 'attendance' CHECK (source IN ('attendance', 'manual', 'promotion')),
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.promotion_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.belt_promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stripe_events ENABLE ROW LEVEL SECURITY;

-- RLS for promotion_queue
CREATE POLICY "Admins full access to promotion_queue"
ON public.promotion_queue FOR ALL
USING (
  academy_id = get_user_academy_id(auth.uid()) 
  AND get_user_role(auth.uid()) = 'admin'
);

CREATE POLICY "Professors can view queue for their students"
ON public.promotion_queue FOR SELECT
USING (
  academy_id = get_user_academy_id(auth.uid())
  AND get_user_role(auth.uid()) = 'professor'
  AND student_id IN (
    SELECT id FROM public.students WHERE responsible_instructor_id = auth.uid()
  )
);

CREATE POLICY "Professors can insert queue for their students"
ON public.promotion_queue FOR INSERT
WITH CHECK (
  academy_id = get_user_academy_id(auth.uid())
  AND get_user_role(auth.uid()) = 'professor'
  AND student_id IN (
    SELECT id FROM public.students WHERE responsible_instructor_id = auth.uid()
  )
);

CREATE POLICY "Professors can update queue for their students"
ON public.promotion_queue FOR UPDATE
USING (
  academy_id = get_user_academy_id(auth.uid())
  AND get_user_role(auth.uid()) = 'professor'
  AND student_id IN (
    SELECT id FROM public.students WHERE responsible_instructor_id = auth.uid()
  )
);

-- RLS for belt_promotions
CREATE POLICY "Admins full access to belt_promotions"
ON public.belt_promotions FOR ALL
USING (
  academy_id = get_user_academy_id(auth.uid()) 
  AND get_user_role(auth.uid()) = 'admin'
);

CREATE POLICY "Professors can view promotions for their students"
ON public.belt_promotions FOR SELECT
USING (
  academy_id = get_user_academy_id(auth.uid())
  AND get_user_role(auth.uid()) = 'professor'
  AND student_id IN (
    SELECT id FROM public.students WHERE responsible_instructor_id = auth.uid()
  )
);

CREATE POLICY "Students can view their own promotions"
ON public.belt_promotions FOR SELECT
USING (
  student_id IN (
    SELECT id FROM public.students WHERE profile_id = auth.uid()
  )
);

-- RLS for stripe_events
CREATE POLICY "Admins full access to stripe_events"
ON public.stripe_events FOR ALL
USING (
  academy_id = get_user_academy_id(auth.uid()) 
  AND get_user_role(auth.uid()) = 'admin'
);

CREATE POLICY "Professors can view stripe events for their students"
ON public.stripe_events FOR SELECT
USING (
  academy_id = get_user_academy_id(auth.uid())
  AND get_user_role(auth.uid()) = 'professor'
  AND student_id IN (
    SELECT id FROM public.students WHERE responsible_instructor_id = auth.uid()
  )
);

CREATE POLICY "Students can view their own stripe events"
ON public.stripe_events FOR SELECT
USING (
  student_id IN (
    SELECT id FROM public.students WHERE profile_id = auth.uid()
  )
);

-- Create the promote_student_belt RPC function
CREATE OR REPLACE FUNCTION public.promote_student_belt(
  p_student_id UUID,
  p_to_belt public.belt_type,
  p_reason TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_student RECORD;
  v_academy_id UUID;
  v_user_role public.user_role;
  v_is_responsible BOOLEAN;
BEGIN
  -- Get current user info
  v_academy_id := get_user_academy_id(auth.uid());
  v_user_role := get_user_role(auth.uid());
  
  -- Get student
  SELECT * INTO v_student FROM public.students WHERE id = p_student_id;
  
  IF v_student IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Aluno não encontrado');
  END IF;
  
  -- Check if student is in same academy
  IF v_student.academy_id != v_academy_id THEN
    RETURN json_build_object('success', false, 'error', 'Aluno não pertence à sua academia');
  END IF;
  
  -- Check permissions
  IF v_user_role = 'professor' THEN
    v_is_responsible := v_student.responsible_instructor_id = auth.uid();
    IF NOT v_is_responsible THEN
      RETURN json_build_object('success', false, 'error', 'Você não é responsável por este aluno');
    END IF;
  ELSIF v_user_role != 'admin' THEN
    RETURN json_build_object('success', false, 'error', 'Permissão negada');
  END IF;
  
  -- Record the promotion in belt_promotions
  INSERT INTO public.belt_promotions (
    academy_id, student_id, from_belt, from_stripes, to_belt, to_stripes, reason, promoted_by
  ) VALUES (
    v_student.academy_id, p_student_id, v_student.belt_current, v_student.stripes_cached, 
    p_to_belt, 0, p_reason, auth.uid()
  );
  
  -- Record stripe reset in stripe_events
  INSERT INTO public.stripe_events (
    academy_id, student_id, previous_stripes, new_stripes, belt, source, created_by
  ) VALUES (
    v_student.academy_id, p_student_id, v_student.stripes_cached, 0, p_to_belt, 'promotion', auth.uid()
  );
  
  -- Update student
  UPDATE public.students SET
    belt_current = p_to_belt,
    stripes_cached = 0,
    belt_cycle_classes = 0
  WHERE id = p_student_id;
  
  -- Close any open promotion queue items
  UPDATE public.promotion_queue SET
    status = 'done',
    processed_at = now(),
    processed_by = auth.uid()
  WHERE student_id = p_student_id AND status = 'open';
  
  RETURN json_build_object('success', true, 'message', 'Faixa promovida com sucesso');
END;
$$;

-- Update process_attendance_approval to also log stripe events
CREATE OR REPLACE FUNCTION public.process_attendance_approval()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_student RECORD;
  v_rule RECORD;
  v_next_belt public.belt_type;
  v_old_stripes INTEGER;
BEGIN
  -- Only process when status changes to 'approved'
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
    
    -- Get the student record from students table
    SELECT * INTO v_student FROM public.students WHERE id = NEW.student_id;
    
    IF v_student IS NULL THEN
      RETURN NEW;
    END IF;
    
    v_old_stripes := v_student.stripes_cached;
    
    -- Increment class counters
    UPDATE public.students 
    SET 
      total_classes = total_classes + 1,
      belt_cycle_classes = belt_cycle_classes + 1
    WHERE id = NEW.student_id;
    
    -- Reload updated student data
    SELECT * INTO v_student FROM public.students WHERE id = NEW.student_id;
    
    -- Get belt rule for current belt
    SELECT * INTO v_rule 
    FROM public.belt_rules 
    WHERE academy_id = v_student.academy_id AND belt = v_student.belt_current;
    
    -- If no rule or black belt with very high value (locked), skip stripe logic
    IF v_rule IS NULL OR v_rule.classes_per_stripe > 99999 THEN
      RETURN NEW;
    END IF;
    
    -- Check if student should earn a stripe
    IF v_student.belt_cycle_classes >= v_rule.classes_per_stripe THEN
      IF v_student.stripes_cached < 4 THEN
        -- Add stripe
        UPDATE public.students 
        SET 
          stripes_cached = stripes_cached + 1,
          belt_cycle_classes = 0
        WHERE id = NEW.student_id;
        
        -- Log stripe event
        INSERT INTO public.stripe_events (
          academy_id, student_id, previous_stripes, new_stripes, belt, source
        ) VALUES (
          v_student.academy_id, NEW.student_id, v_old_stripes, v_student.stripes_cached + 1, 
          v_student.belt_current, 'attendance'
        );
        
      ELSIF v_student.stripes_cached >= 4 AND v_student.belt_current != 'black' THEN
        -- Auto belt promotion (optional - can be disabled)
        v_next_belt := CASE v_student.belt_current
          WHEN 'white' THEN 'blue'::public.belt_type
          WHEN 'blue' THEN 'purple'::public.belt_type
          WHEN 'purple' THEN 'brown'::public.belt_type
          WHEN 'brown' THEN 'black'::public.belt_type
          ELSE v_student.belt_current
        END;
        
        -- Only add to queue, don't auto-promote
        -- Check if not already in queue
        IF NOT EXISTS (
          SELECT 1 FROM public.promotion_queue 
          WHERE student_id = NEW.student_id AND status = 'open'
        ) THEN
          INSERT INTO public.promotion_queue (academy_id, student_id, eligible_at, status)
          VALUES (v_student.academy_id, NEW.student_id, now(), 'open');
        END IF;
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;
-- Allow users to insert their own profile during signup
CREATE POLICY "Users can insert their own profile"
ON public.profiles
FOR INSERT
WITH CHECK (id = auth.uid());

-- Allow users to insert their own student record
CREATE POLICY "Users can insert their own student record"
ON public.students
FOR INSERT
WITH CHECK (profile_id = auth.uid());
-- =========================
-- PLANS (planos de assinatura)
-- =========================
CREATE TABLE IF NOT EXISTS public.plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id uuid NOT NULL REFERENCES public.academies(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  price numeric(12,2) NOT NULL CHECK (price >= 0),
  billing_cycle text NOT NULL DEFAULT 'monthly' CHECK (billing_cycle IN ('weekly', 'monthly', 'quarterly', 'semiannual', 'yearly')),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_plans_academy ON public.plans(academy_id, is_active);
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;

-- Admin can manage plans
CREATE POLICY "plans_admin_all" ON public.plans FOR ALL
USING (academy_id = get_user_academy_id(auth.uid()) AND get_user_role(auth.uid()) = 'admin')
WITH CHECK (academy_id = get_user_academy_id(auth.uid()) AND get_user_role(auth.uid()) = 'admin');

-- All users can view active plans
CREATE POLICY "plans_select_all" ON public.plans FOR SELECT
USING (academy_id = get_user_academy_id(auth.uid()) AND is_active = true);

-- =========================
-- SUBSCRIPTIONS (assinaturas)
-- =========================
DO $$ BEGIN
  CREATE TYPE public.subscription_status AS ENUM ('active', 'canceled', 'paused');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id uuid NOT NULL REFERENCES public.academies(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  plan_id uuid NOT NULL REFERENCES public.plans(id) ON DELETE RESTRICT,
  status public.subscription_status NOT NULL DEFAULT 'active',
  started_at date NOT NULL DEFAULT CURRENT_DATE,
  next_due_at date NOT NULL,
  grace_days integer NOT NULL DEFAULT 3,
  canceled_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_academy ON public.subscriptions(academy_id, status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_student ON public.subscriptions(student_id);
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Admin full access
CREATE POLICY "subscriptions_admin_all" ON public.subscriptions FOR ALL
USING (academy_id = get_user_academy_id(auth.uid()) AND get_user_role(auth.uid()) = 'admin')
WITH CHECK (academy_id = get_user_academy_id(auth.uid()) AND get_user_role(auth.uid()) = 'admin');

-- Students can view their own subscriptions
CREATE POLICY "subscriptions_select_student" ON public.subscriptions FOR SELECT
USING (student_id IN (SELECT id FROM public.students WHERE profile_id = auth.uid()));

-- =========================
-- INVOICES (faturas/mensalidades)
-- =========================
DO $$ BEGIN
  CREATE TYPE public.invoice_status AS ENUM ('open', 'paid', 'overdue', 'canceled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id uuid NOT NULL REFERENCES public.academies(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  subscription_id uuid REFERENCES public.subscriptions(id) ON DELETE SET NULL,
  due_date date NOT NULL,
  amount numeric(12,2) NOT NULL CHECK (amount >= 0),
  status public.invoice_status NOT NULL DEFAULT 'open',
  paid_at timestamptz,
  payment_method text,
  provider_ref text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_invoices_academy_due ON public.invoices(academy_id, due_date, status);
CREATE INDEX IF NOT EXISTS idx_invoices_student ON public.invoices(student_id, due_date);
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- Admin full access
CREATE POLICY "invoices_admin_all" ON public.invoices FOR ALL
USING (academy_id = get_user_academy_id(auth.uid()) AND get_user_role(auth.uid()) = 'admin')
WITH CHECK (academy_id = get_user_academy_id(auth.uid()) AND get_user_role(auth.uid()) = 'admin');

-- Students can view their own invoices
CREATE POLICY "invoices_select_student" ON public.invoices FOR SELECT
USING (student_id IN (SELECT id FROM public.students WHERE profile_id = auth.uid()));

-- =========================
-- EXPENSE CATEGORIES
-- =========================
CREATE TABLE IF NOT EXISTS public.expense_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id uuid NOT NULL REFERENCES public.academies(id) ON DELETE CASCADE,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (academy_id, name)
);

ALTER TABLE public.expense_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "expense_categories_admin" ON public.expense_categories FOR ALL
USING (academy_id = get_user_academy_id(auth.uid()) AND get_user_role(auth.uid()) = 'admin')
WITH CHECK (academy_id = get_user_academy_id(auth.uid()) AND get_user_role(auth.uid()) = 'admin');

-- =========================
-- EXPENSES (despesas)
-- =========================
DO $$ BEGIN
  CREATE TYPE public.expense_type AS ENUM ('fixed', 'variable');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id uuid NOT NULL REFERENCES public.academies(id) ON DELETE CASCADE,
  category_id uuid REFERENCES public.expense_categories(id) ON DELETE SET NULL,
  type public.expense_type NOT NULL DEFAULT 'variable',
  description text NOT NULL,
  amount numeric(12,2) NOT NULL CHECK (amount >= 0),
  due_date date,
  paid_at timestamptz,
  recurring boolean NOT NULL DEFAULT false,
  recurrence_rule text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_expenses_academy_due ON public.expenses(academy_id, due_date);
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "expenses_admin" ON public.expenses FOR ALL
USING (academy_id = get_user_academy_id(auth.uid()) AND get_user_role(auth.uid()) = 'admin')
WITH CHECK (academy_id = get_user_academy_id(auth.uid()) AND get_user_role(auth.uid()) = 'admin');

-- =========================
-- FUNCTION: Create subscription with first invoice
-- =========================
CREATE OR REPLACE FUNCTION public.create_subscription_with_invoice(
  p_student_id uuid,
  p_plan_id uuid,
  p_start_date date DEFAULT CURRENT_DATE,
  p_grace_days integer DEFAULT 3
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_academy_id uuid;
  v_plan RECORD;
  v_subscription_id uuid;
  v_next_due date;
BEGIN
  -- Get academy id
  v_academy_id := get_user_academy_id(auth.uid());
  
  -- Only admin can create subscriptions
  IF get_user_role(auth.uid()) != 'admin' THEN
    RETURN json_build_object('success', false, 'error', 'Permissão negada');
  END IF;
  
  -- Get plan
  SELECT * INTO v_plan FROM public.plans WHERE id = p_plan_id AND academy_id = v_academy_id;
  IF v_plan IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Plano não encontrado');
  END IF;
  
  -- Calculate next due date based on billing cycle
  v_next_due := CASE v_plan.billing_cycle
    WHEN 'weekly' THEN p_start_date + interval '7 days'
    WHEN 'monthly' THEN p_start_date + interval '1 month'
    WHEN 'quarterly' THEN p_start_date + interval '3 months'
    WHEN 'semiannual' THEN p_start_date + interval '6 months'
    WHEN 'yearly' THEN p_start_date + interval '1 year'
    ELSE p_start_date + interval '1 month'
  END;
  
  -- Create subscription
  INSERT INTO public.subscriptions (academy_id, student_id, plan_id, started_at, next_due_at, grace_days)
  VALUES (v_academy_id, p_student_id, p_plan_id, p_start_date, v_next_due, p_grace_days)
  RETURNING id INTO v_subscription_id;
  
  -- Create first invoice
  INSERT INTO public.invoices (academy_id, student_id, subscription_id, due_date, amount, status)
  VALUES (v_academy_id, p_student_id, v_subscription_id, p_start_date, v_plan.price, 'open');
  
  RETURN json_build_object('success', true, 'subscription_id', v_subscription_id);
END;
$$;

-- =========================
-- FUNCTION: Mark invoice as paid and update student status
-- =========================
CREATE OR REPLACE FUNCTION public.mark_invoice_paid(
  p_invoice_id uuid,
  p_method text DEFAULT 'pix'
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invoice RECORD;
  v_academy_id uuid;
BEGIN
  v_academy_id := get_user_academy_id(auth.uid());
  
  IF get_user_role(auth.uid()) != 'admin' THEN
    RETURN json_build_object('success', false, 'error', 'Permissão negada');
  END IF;
  
  -- Get invoice
  SELECT * INTO v_invoice FROM public.invoices WHERE id = p_invoice_id AND academy_id = v_academy_id;
  IF v_invoice IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Fatura não encontrada');
  END IF;
  
  -- Update invoice
  UPDATE public.invoices SET
    status = 'paid',
    paid_at = now(),
    payment_method = p_method
  WHERE id = p_invoice_id;
  
  -- Update student financial status
  UPDATE public.students SET financial_status = 'ok' WHERE id = v_invoice.student_id;
  
  RETURN json_build_object('success', true);
END;
$$;
-- Add CPF column to profiles table
ALTER TABLE public.profiles
ADD COLUMN cpf text;

-- Add index for CPF lookups
CREATE INDEX idx_profiles_cpf ON public.profiles(cpf) WHERE cpf IS NOT NULL;
-- Adicionar campos de periodicidade e forma de pagamento às despesas
ALTER TABLE public.expenses 
ADD COLUMN IF NOT EXISTS recurrence_months INTEGER,
ADD COLUMN IF NOT EXISTS payment_method TEXT;

-- Comentários para documentação
COMMENT ON COLUMN public.expenses.recurrence_months IS 'Periodicidade em meses para despesas recorrentes (1=mensal, 3=trimestral, 6=semestral, 12=anual)';
COMMENT ON COLUMN public.expenses.payment_method IS 'Forma de pagamento utilizada (pix, dinheiro, cartão, boleto, etc.)';
-- Add weight, gender and category columns to students table
ALTER TABLE public.students 
ADD COLUMN IF NOT EXISTS weight numeric,
ADD COLUMN IF NOT EXISTS gender text CHECK (gender IN ('male', 'female')),
ADD COLUMN IF NOT EXISTS category text;

-- Add cpf column to students table (may already exist in profiles, but needed here too)
ALTER TABLE public.students 
ADD COLUMN IF NOT EXISTS cpf text;
-- Add phone, email and guardian fields to students table
ALTER TABLE public.students 
ADD COLUMN phone text,
ADD COLUMN email text,
ADD COLUMN guardian_name text,
ADD COLUMN guardian_phone text;
-- Add 'blocked' value to financial_status enum
ALTER TYPE financial_status ADD VALUE IF NOT EXISTS 'blocked';
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
-- =========================
-- 0) ENUMs (cria se não existir)
-- =========================
do $$ begin
  create type public.modality_variant as enum ('gi','nogi','none');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.shift_type as enum ('morning','afternoon','night');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.sex_type as enum ('nao_informado','masculino','feminino');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.registration_source_type as enum ('link','manual');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.registration_status_type as enum ('pending','approved','rejected');
exception when duplicate_object then null;
end $$;

-- =========================
-- 3) INVITE / LINK DE CADASTRO (token) - new table
-- =========================
create table if not exists public.registration_invites (
  id uuid primary key default gen_random_uuid(),
  academy_id uuid not null,
  token text not null unique,
  created_by_profile_id uuid not null,
  modality_id uuid null references public.modalities(id) on delete restrict,
  class_slot_id uuid null references public.class_slots(id) on delete restrict,
  instructor_profile_id uuid null,
  plan_id uuid null,
  next_due_at date null,
  grace_days int not null default 3 check (grace_days between 0 and 30),
  expires_at timestamptz null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists registration_invites_academy_id_idx on public.registration_invites(academy_id);
create index if not exists registration_invites_token_idx on public.registration_invites(token);

-- =========================
-- 5) MATRÍCULA DO ALUNO NA TURMA (quando aprovado)
-- =========================
create table if not exists public.student_enrollments (
  id uuid primary key default gen_random_uuid(),
  academy_id uuid not null,
  student_id uuid not null,
  class_slot_id uuid not null references public.class_slots(id) on delete restrict,
  status text not null default 'active' check (status in ('active','inactive')),
  created_at timestamptz not null default now(),
  constraint student_enrollments_unique unique (academy_id, student_id, class_slot_id)
);

create index if not exists student_enrollments_academy_id_idx on public.student_enrollments(academy_id);
create index if not exists student_enrollments_student_id_idx on public.student_enrollments(student_id);

-- =========================
-- 6) RLS
-- =========================
alter table public.registration_invites enable row level security;
alter table public.student_enrollments enable row level security;

-- INVITES: SELECT público para tokens válidos; escrita só admin
drop policy if exists "invites_select_public_valid" on public.registration_invites;
create policy "invites_select_public_valid"
on public.registration_invites for select
using (
  active = true 
  and (expires_at is null or expires_at > now())
);

drop policy if exists "invites_admin_all" on public.registration_invites;
create policy "invites_admin_all"
on public.registration_invites for all
to authenticated
using (
  academy_id = get_user_academy_id(auth.uid()) 
  and get_user_role(auth.uid()) = 'admin'::user_role
);

-- ENROLLMENTS: SELECT admin e professor (mesma academy); escrita admin
drop policy if exists "enrollments_select" on public.student_enrollments;
create policy "enrollments_select"
on public.student_enrollments for select
to authenticated
using (
  academy_id = get_user_academy_id(auth.uid())
  and get_user_role(auth.uid()) in ('admin'::user_role, 'professor'::user_role)
);

drop policy if exists "enrollments_admin_all" on public.student_enrollments;
create policy "enrollments_admin_all"
on public.student_enrollments for all
to authenticated
using (
  academy_id = get_user_academy_id(auth.uid()) 
  and get_user_role(auth.uid()) = 'admin'::user_role
);

-- Add guardian constraint to student_registrations if not exists
do $$ begin
  alter table public.student_registrations
    add constraint student_registrations_guardian_required
    check (
      (is_minor = false)
      or (guardian_name is not null and guardian_phone is not null)
    );
exception when duplicate_object then null;
end $$;
-- Change day_of_week from single integer to integer array for multiple days
ALTER TABLE public.class_slots 
  DROP CONSTRAINT IF EXISTS class_slots_day_of_week_check;

ALTER TABLE public.class_slots 
  ALTER COLUMN day_of_week TYPE integer[] USING ARRAY[day_of_week];
-- Allow public read access to registration_invites for valid tokens (public registration flow)
CREATE POLICY "Allow public read access to active registration invites"
ON public.registration_invites
FOR SELECT
USING (active = true);
-- Fix attendance RLS policies to match schema (attendance.student_id references profiles.id)
-- This resolves 403 on student check-in.

ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

-- Drop mismatched policies (they were comparing attendance.student_id to students.id)
DROP POLICY IF EXISTS "Students can check in" ON public.attendance;
DROP POLICY IF EXISTS "Students view own attendance" ON public.attendance;
DROP POLICY IF EXISTS "Professors can view attendance for their students" ON public.attendance;
DROP POLICY IF EXISTS "Professors can update attendance for their students" ON public.attendance;

-- Students: can see their own attendance rows
CREATE POLICY "Students view own attendance"
ON public.attendance
FOR SELECT
USING (student_id = auth.uid());

-- Students: can insert their own check-in (only if they have an active student record)
CREATE POLICY "Students can check in"
ON public.attendance
FOR INSERT
WITH CHECK (
  academy_id = public.get_user_academy_id(auth.uid())
  AND student_id = auth.uid()
  AND status = 'pending'::public.attendance_status
  AND EXISTS (
    SELECT 1
    FROM public.students s
    WHERE s.profile_id = auth.uid()
      AND s.academy_id = academy_id
      AND s.status = 'active'::public.student_status
  )
);

-- Professors: can view attendance for their assigned students
CREATE POLICY "Professors can view attendance for their students"
ON public.attendance
FOR SELECT
USING (
  academy_id = public.get_user_academy_id(auth.uid())
  AND public.get_user_role(auth.uid()) = 'professor'::public.user_role
  AND student_id IN (
    SELECT s.profile_id
    FROM public.students s
    WHERE s.academy_id = public.get_user_academy_id(auth.uid())
      AND s.responsible_instructor_id = auth.uid()
      AND s.profile_id IS NOT NULL
  )
);

-- Professors: can update attendance for their assigned students
CREATE POLICY "Professors can update attendance for their students"
ON public.attendance
FOR UPDATE
USING (
  academy_id = public.get_user_academy_id(auth.uid())
  AND public.get_user_role(auth.uid()) = 'professor'::public.user_role
  AND student_id IN (
    SELECT s.profile_id
    FROM public.students s
    WHERE s.academy_id = public.get_user_academy_id(auth.uid())
      AND s.responsible_instructor_id = auth.uid()
      AND s.profile_id IS NOT NULL
  )
);
-- Fix attendance approval progression to use students linked by profile_id (attendance.student_id references profiles.id)
CREATE OR REPLACE FUNCTION public.process_attendance_approval()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_student RECORD;
  v_rule RECORD;
  v_old_stripes INTEGER;
BEGIN
  -- Only process when status changes to 'approved'
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN

    -- attendance.student_id references profiles.id, so we need to find the student by profile_id
    SELECT * INTO v_student
    FROM public.students
    WHERE profile_id = NEW.student_id
    LIMIT 1;

    IF v_student IS NULL THEN
      RETURN NEW;
    END IF;

    v_old_stripes := v_student.stripes_cached;

    -- Increment counters (approved class)
    UPDATE public.students
    SET
      total_classes = total_classes + 1,
      belt_cycle_classes = belt_cycle_classes + 1
    WHERE id = v_student.id;

    -- Reload updated student
    SELECT * INTO v_student FROM public.students WHERE id = v_student.id;

    -- Get belt rule for current belt
    SELECT * INTO v_rule
    FROM public.belt_rules
    WHERE academy_id = v_student.academy_id AND belt = v_student.belt_current;

    -- If no rule or black belt with very high value (locked), skip stripe logic
    IF v_rule IS NULL OR v_rule.classes_per_stripe > 99999 THEN
      RETURN NEW;
    END IF;

    -- Stripe is earned every N approved classes in the belt cycle
    IF (v_student.belt_cycle_classes % v_rule.classes_per_stripe) = 0 THEN
      IF v_student.stripes_cached < v_rule.stripes_to_promote THEN
        -- Add stripe (do NOT reset belt_cycle_classes; it represents total classes in the belt cycle)
        UPDATE public.students
        SET stripes_cached = stripes_cached + 1
        WHERE id = v_student.id;

        -- Log stripe event (stripe_events.student_id references students.id)
        INSERT INTO public.stripe_events (
          academy_id, student_id, previous_stripes, new_stripes, belt, source
        ) VALUES (
          v_student.academy_id, v_student.id, v_old_stripes, v_old_stripes + 1,
          v_student.belt_current, 'attendance'
        );

      ELSIF v_student.stripes_cached >= v_rule.stripes_to_promote AND v_student.belt_current != 'black' THEN
        -- Eligible for belt promotion: add to queue (promotion_queue.student_id references students.id)
        IF NOT EXISTS (
          SELECT 1 FROM public.promotion_queue
          WHERE student_id = v_student.id AND status = 'open'
        ) THEN
          INSERT INTO public.promotion_queue (academy_id, student_id, eligible_at, status)
          VALUES (v_student.academy_id, v_student.id, now(), 'open');
        END IF;
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Stop counting classes on check-in creation (pending) to avoid double counting.
DROP TRIGGER IF EXISTS trigger_process_attendance ON public.attendance;

-- Secure helper: auto-link a student record (students) to the logged-in student profile when profile_id is missing.
-- It links ONLY when:
--  - logged user is a student
--  - there is a students row in the same academy
--  - students.profile_id is NULL
--  - students.email matches profiles.email for the logged user
CREATE OR REPLACE FUNCTION public.link_my_student_record()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_profile RECORD;
  v_student_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN json_build_object('linked', false, 'reason', 'not_authenticated');
  END IF;

  SELECT id, academy_id, role, email INTO v_profile
  FROM public.profiles
  WHERE id = auth.uid();

  IF v_profile IS NULL THEN
    RETURN json_build_object('linked', false, 'reason', 'profile_not_found');
  END IF;

  IF v_profile.role != 'student' THEN
    RETURN json_build_object('linked', false, 'reason', 'not_student');
  END IF;

  -- Already linked
  IF EXISTS (SELECT 1 FROM public.students WHERE profile_id = auth.uid()) THEN
    RETURN json_build_object('linked', false, 'reason', 'already_linked');
  END IF;

  IF v_profile.email IS NULL THEN
    RETURN json_build_object('linked', false, 'reason', 'missing_email');
  END IF;

  SELECT s.id INTO v_student_id
  FROM public.students s
  WHERE s.academy_id = v_profile.academy_id
    AND s.profile_id IS NULL
    AND s.email IS NOT NULL
    AND lower(s.email) = lower(v_profile.email)
  ORDER BY s.created_at DESC
  LIMIT 1;

  IF v_student_id IS NULL THEN
    RETURN json_build_object('linked', false, 'reason', 'no_match');
  END IF;

  UPDATE public.students
  SET profile_id = auth.uid()
  WHERE id = v_student_id;

  RETURN json_build_object('linked', true, 'student_id', v_student_id);
END;
$$;
-- Add class_slot_id column to attendance table
ALTER TABLE public.attendance 
ADD COLUMN class_slot_id uuid REFERENCES public.class_slots(id);

-- Create index for better performance
CREATE INDEX idx_attendance_class_slot_id ON public.attendance(class_slot_id);
-- Add RLS policy for students to view their own enrollments
DROP POLICY IF EXISTS "Students can view their own enrollments" ON public.student_enrollments;
CREATE POLICY "Students can view their own enrollments"
ON public.student_enrollments FOR SELECT
TO authenticated
USING (
  student_id IN (
    SELECT s.id FROM students s WHERE s.profile_id = auth.uid()
  )
);
-- Fix RLS policy for student_registrations to allow admin inserts
DROP POLICY IF EXISTS "Admins can manage student_registrations" ON public.student_registrations;

-- Create separate policies for SELECT, INSERT, UPDATE, DELETE
CREATE POLICY "Admins can view student_registrations" 
ON public.student_registrations 
FOR SELECT 
USING (
  academy_id = get_user_academy_id(auth.uid()) 
  AND get_user_role(auth.uid()) = 'admin'::user_role
);

CREATE POLICY "Admins can insert student_registrations" 
ON public.student_registrations 
FOR INSERT 
WITH CHECK (
  academy_id = get_user_academy_id(auth.uid()) 
  AND get_user_role(auth.uid()) = 'admin'::user_role
);

CREATE POLICY "Admins can update student_registrations" 
ON public.student_registrations 
FOR UPDATE 
USING (
  academy_id = get_user_academy_id(auth.uid()) 
  AND get_user_role(auth.uid()) = 'admin'::user_role
);

CREATE POLICY "Admins can delete student_registrations" 
ON public.student_registrations 
FOR DELETE 
USING (
  academy_id = get_user_academy_id(auth.uid()) 
  AND get_user_role(auth.uid()) = 'admin'::user_role
);
-- Step 1: Drop the function that depends on belt_type
DROP FUNCTION IF EXISTS public.promote_student_belt(uuid, belt_type, text);

-- Step 2: Drop the process_attendance_progression function that references belt_type
DROP FUNCTION IF EXISTS public.process_attendance_progression();

-- Step 3: Drop old belt_type_new if it exists from failed migration
DROP TYPE IF EXISTS belt_type_new;

-- Step 4: Create new temporary column for each table to hold the text value
ALTER TABLE profiles ADD COLUMN belt_text text;
UPDATE profiles SET belt_text = belt::text;

ALTER TABLE students ADD COLUMN belt_current_text text;
UPDATE students SET belt_current_text = belt_current::text;

ALTER TABLE belt_rules ADD COLUMN belt_text text;
UPDATE belt_rules SET belt_text = belt::text;

ALTER TABLE belt_history ADD COLUMN new_belt_text text;
ALTER TABLE belt_history ADD COLUMN previous_belt_text text;
UPDATE belt_history SET new_belt_text = new_belt::text, previous_belt_text = previous_belt::text;

ALTER TABLE belt_promotions ADD COLUMN from_belt_text text;
ALTER TABLE belt_promotions ADD COLUMN to_belt_text text;
UPDATE belt_promotions SET from_belt_text = from_belt::text, to_belt_text = to_belt::text;

ALTER TABLE stripe_events ADD COLUMN belt_text text;
UPDATE stripe_events SET belt_text = belt::text;

-- Step 5: Drop the old columns
ALTER TABLE profiles DROP COLUMN belt;
ALTER TABLE students DROP COLUMN belt_current;
ALTER TABLE belt_rules DROP COLUMN belt;
ALTER TABLE belt_history DROP COLUMN new_belt;
ALTER TABLE belt_history DROP COLUMN previous_belt;
ALTER TABLE belt_promotions DROP COLUMN from_belt;
ALTER TABLE belt_promotions DROP COLUMN to_belt;
ALTER TABLE stripe_events DROP COLUMN belt;

-- Step 6: Drop old type
DROP TYPE IF EXISTS belt_type;

-- Step 7: Create new belt type enum with all IBJJF belts
CREATE TYPE belt_type AS ENUM (
  'white', 'grey_white', 'grey', 'grey_black',
  'yellow_white', 'yellow', 'yellow_black',
  'orange_white', 'orange', 'orange_black',
  'green_white', 'green', 'green_black',
  'blue', 'purple', 'brown', 'black',
  'red_black', 'red_white', 'red'
);

-- Step 8: Create new columns with new type and copy data
ALTER TABLE profiles ADD COLUMN belt belt_type DEFAULT 'white';
UPDATE profiles SET belt = belt_text::belt_type WHERE belt_text IS NOT NULL;
ALTER TABLE profiles DROP COLUMN belt_text;

ALTER TABLE students ADD COLUMN belt_current belt_type DEFAULT 'white';
UPDATE students SET belt_current = belt_current_text::belt_type WHERE belt_current_text IS NOT NULL;
ALTER TABLE students DROP COLUMN belt_current_text;

ALTER TABLE belt_rules ADD COLUMN belt belt_type;
UPDATE belt_rules SET belt = belt_text::belt_type WHERE belt_text IS NOT NULL;
ALTER TABLE belt_rules DROP COLUMN belt_text;

ALTER TABLE belt_history ADD COLUMN new_belt belt_type;
ALTER TABLE belt_history ADD COLUMN previous_belt belt_type;
UPDATE belt_history SET new_belt = new_belt_text::belt_type WHERE new_belt_text IS NOT NULL;
UPDATE belt_history SET previous_belt = previous_belt_text::belt_type WHERE previous_belt_text IS NOT NULL;
ALTER TABLE belt_history DROP COLUMN new_belt_text;
ALTER TABLE belt_history DROP COLUMN previous_belt_text;

ALTER TABLE belt_promotions ADD COLUMN from_belt belt_type;
ALTER TABLE belt_promotions ADD COLUMN to_belt belt_type;
UPDATE belt_promotions SET from_belt = from_belt_text::belt_type WHERE from_belt_text IS NOT NULL;
UPDATE belt_promotions SET to_belt = to_belt_text::belt_type WHERE to_belt_text IS NOT NULL;
ALTER TABLE belt_promotions DROP COLUMN from_belt_text;
ALTER TABLE belt_promotions DROP COLUMN to_belt_text;

ALTER TABLE stripe_events ADD COLUMN belt belt_type;
UPDATE stripe_events SET belt = belt_text::belt_type WHERE belt_text IS NOT NULL;
ALTER TABLE stripe_events DROP COLUMN belt_text;
-- Recreate the promote_student_belt function with new belt type
CREATE OR REPLACE FUNCTION public.promote_student_belt(
  p_student_id uuid,
  p_to_belt belt_type,
  p_reason text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_student RECORD;
  v_academy_id UUID;
  v_user_role public.user_role;
  v_is_responsible BOOLEAN;
BEGIN
  v_academy_id := get_user_academy_id(auth.uid());
  v_user_role := get_user_role(auth.uid());
  
  SELECT * INTO v_student FROM public.students WHERE id = p_student_id;
  
  IF v_student IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Aluno não encontrado');
  END IF;
  
  IF v_student.academy_id != v_academy_id THEN
    RETURN json_build_object('success', false, 'error', 'Aluno não pertence à sua academia');
  END IF;
  
  IF v_user_role = 'professor' THEN
    v_is_responsible := v_student.responsible_instructor_id = auth.uid();
    IF NOT v_is_responsible THEN
      RETURN json_build_object('success', false, 'error', 'Você não é responsável por este aluno');
    END IF;
  ELSIF v_user_role != 'admin' THEN
    RETURN json_build_object('success', false, 'error', 'Permissão negada');
  END IF;
  
  INSERT INTO public.belt_promotions (
    academy_id, student_id, from_belt, from_stripes, to_belt, to_stripes, reason, promoted_by
  ) VALUES (
    v_student.academy_id, p_student_id, v_student.belt_current, v_student.stripes_cached, 
    p_to_belt, 0, p_reason, auth.uid()
  );
  
  INSERT INTO public.stripe_events (
    academy_id, student_id, previous_stripes, new_stripes, belt, source, created_by
  ) VALUES (
    v_student.academy_id, p_student_id, v_student.stripes_cached, 0, p_to_belt, 'promotion', auth.uid()
  );
  
  UPDATE public.students SET
    belt_current = p_to_belt,
    stripes_cached = 0,
    belt_cycle_classes = 0
  WHERE id = p_student_id;
  
  UPDATE public.promotion_queue SET
    status = 'done',
    processed_at = now(),
    processed_by = auth.uid()
  WHERE student_id = p_student_id AND status = 'open';
  
  RETURN json_build_object('success', true, 'message', 'Faixa promovida com sucesso');
END;
$$;

-- Recreate process_attendance_progression function
CREATE OR REPLACE FUNCTION public.process_attendance_progression()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_student RECORD;
  v_rule RECORD;
  v_next_belt public.belt_type;
BEGIN
  SELECT * INTO v_student FROM public.profiles WHERE id = NEW.student_id;
  
  UPDATE public.profiles 
  SET 
    total_classes = total_classes + 1,
    classes_since_last_stripe = classes_since_last_stripe + 1
  WHERE id = NEW.student_id;
  
  SELECT * INTO v_student FROM public.profiles WHERE id = NEW.student_id;
  
  SELECT * INTO v_rule 
  FROM public.belt_rules 
  WHERE academy_id = v_student.academy_id AND belt = v_student.belt;
  
  IF v_rule IS NULL OR v_rule.classes_per_stripe > 99999 THEN
    RETURN NEW;
  END IF;
  
  IF v_student.classes_since_last_stripe >= v_rule.classes_per_stripe THEN
    IF v_student.stripes < 4 THEN
      UPDATE public.profiles 
      SET 
        stripes = stripes + 1,
        classes_since_last_stripe = 0
      WHERE id = NEW.student_id;
      
      INSERT INTO public.belt_history 
        (academy_id, student_id, previous_belt, previous_stripes, new_belt, new_stripes, classes_at_promotion, reason)
      VALUES 
        (v_student.academy_id, NEW.student_id, v_student.belt, v_student.stripes, v_student.belt, v_student.stripes + 1, v_student.total_classes, 'Progressão automática por presença');
    
    ELSIF v_student.stripes = 4 AND v_student.belt NOT IN ('black', 'red_black', 'red_white', 'red') THEN
      v_next_belt := CASE v_student.belt
        WHEN 'white' THEN 'blue'::public.belt_type
        WHEN 'blue' THEN 'purple'::public.belt_type
        WHEN 'purple' THEN 'brown'::public.belt_type
        WHEN 'brown' THEN 'black'::public.belt_type
        -- Children belts progression
        WHEN 'grey_white' THEN 'grey'::public.belt_type
        WHEN 'grey' THEN 'grey_black'::public.belt_type
        WHEN 'grey_black' THEN 'yellow_white'::public.belt_type
        WHEN 'yellow_white' THEN 'yellow'::public.belt_type
        WHEN 'yellow' THEN 'yellow_black'::public.belt_type
        WHEN 'yellow_black' THEN 'orange_white'::public.belt_type
        WHEN 'orange_white' THEN 'orange'::public.belt_type
        WHEN 'orange' THEN 'orange_black'::public.belt_type
        WHEN 'orange_black' THEN 'green_white'::public.belt_type
        WHEN 'green_white' THEN 'green'::public.belt_type
        WHEN 'green' THEN 'green_black'::public.belt_type
        WHEN 'green_black' THEN 'blue'::public.belt_type
        ELSE v_student.belt
      END;
      
      UPDATE public.profiles 
      SET 
        belt = v_next_belt,
        stripes = 0,
        classes_since_last_stripe = 0
      WHERE id = NEW.student_id;
      
      INSERT INTO public.belt_history 
        (academy_id, student_id, previous_belt, previous_stripes, new_belt, new_stripes, classes_at_promotion, reason)
      VALUES 
        (v_student.academy_id, NEW.student_id, v_student.belt, v_student.stripes, v_next_belt, 0, v_student.total_classes, 'Promoção automática de faixa');
    END IF;
  END IF;
  
  IF v_rule.gift_every_classes IS NOT NULL AND v_student.total_classes > 0 AND (v_student.total_classes % v_rule.gift_every_classes) = 0 THEN
    INSERT INTO public.gifts (academy_id, student_id, gift_name, classes_count)
    VALUES (v_student.academy_id, NEW.student_id, 'Brinde ' || v_student.total_classes || ' aulas', v_student.total_classes);
  END IF;
  
  RETURN NEW;
END;
$$;
-- Drop the old constraint
ALTER TABLE student_registrations DROP CONSTRAINT IF EXISTS student_registrations_belt_current_check;

-- Add new constraint with all belt types (English values from belt_type enum)
ALTER TABLE student_registrations ADD CONSTRAINT student_registrations_belt_current_check 
CHECK (belt_current IN (
  'white', 'grey_white', 'grey', 'grey_black',
  'yellow_white', 'yellow', 'yellow_black',
  'orange_white', 'orange', 'orange_black',
  'green_white', 'green', 'green_black',
  'blue', 'purple', 'brown', 'black',
  'red_black', 'red_white', 'red',
  -- Also keep Portuguese values for backward compatibility
  'branca', 'azul', 'roxa', 'marrom', 'preta'
));
-- Drop the old sex constraint
ALTER TABLE student_registrations DROP CONSTRAINT IF EXISTS student_registrations_sex_check;

-- Add new constraint accepting both English and Portuguese values
ALTER TABLE student_registrations ADD CONSTRAINT student_registrations_sex_check 
CHECK (sex IN (
  'nao_informado', 'masculino', 'feminino',
  'male', 'female', 'not_informed'
) OR sex IS NULL);
-- 1) Add roles array column (without breaking existing role column)
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS roles public.user_role[] NOT NULL
DEFAULT ARRAY['student']::public.user_role[];

-- 2) Backfill: copy existing role to roles array
UPDATE public.profiles
SET roles = ARRAY[role]::public.user_role[]
WHERE roles IS NULL OR array_length(roles, 1) IS NULL OR array_length(roles, 1) = 0;

-- 3) Ensure roles array is never empty
ALTER TABLE public.profiles
ADD CONSTRAINT profiles_roles_not_empty
CHECK (array_length(roles, 1) >= 1);

-- 4) Create/update helper function for RLS and app usage
CREATE OR REPLACE FUNCTION public.has_role(user_id uuid, needed public.user_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = user_id
      AND needed = ANY(p.roles)
  );
$$;
-- Corrige admin: sincroniza roles com role existente
UPDATE public.profiles
SET roles = ARRAY['admin', 'student']::public.user_role[]
WHERE role = 'admin' AND NOT ('admin' = ANY(roles));

-- Corrige professor: sincroniza roles com role existente
UPDATE public.profiles
SET roles = ARRAY['professor', 'student']::public.user_role[]
WHERE role = 'professor' AND NOT ('professor' = ANY(roles));

-- Para quem é SOMENTE student, garantir consistência
UPDATE public.profiles
SET roles = ARRAY['student']::public.user_role[]
WHERE role = 'student' AND (roles IS NULL OR array_length(roles, 1) = 0);
-- Allow multi-role users (e.g., admin+student) to auto-link their student record
CREATE OR REPLACE FUNCTION public.link_my_student_record()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_profile RECORD;
  v_student_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN json_build_object('linked', false, 'reason', 'not_authenticated');
  END IF;

  SELECT id, academy_id, email INTO v_profile
  FROM public.profiles
  WHERE id = auth.uid();

  IF v_profile IS NULL THEN
    RETURN json_build_object('linked', false, 'reason', 'profile_not_found');
  END IF;

  -- Multi-role safe: allow if the user has the 'student' role in the roles array
  IF NOT public.has_role(auth.uid(), 'student'::public.user_role) THEN
    RETURN json_build_object('linked', false, 'reason', 'not_student');
  END IF;

  -- Already linked
  IF EXISTS (SELECT 1 FROM public.students WHERE profile_id = auth.uid()) THEN
    RETURN json_build_object('linked', false, 'reason', 'already_linked');
  END IF;

  IF v_profile.email IS NULL THEN
    RETURN json_build_object('linked', false, 'reason', 'missing_email');
  END IF;

  SELECT s.id INTO v_student_id
  FROM public.students s
  WHERE s.academy_id = v_profile.academy_id
    AND s.profile_id IS NULL
    AND s.email IS NOT NULL
    AND lower(s.email) = lower(v_profile.email)
  ORDER BY s.created_at DESC
  LIMIT 1;

  IF v_student_id IS NULL THEN
    RETURN json_build_object('linked', false, 'reason', 'no_match');
  END IF;

  UPDATE public.students
  SET profile_id = auth.uid()
  WHERE id = v_student_id;

  RETURN json_build_object('linked', true, 'student_id', v_student_id);
END;
$$;
-- Enum para status do contrato
CREATE TYPE public.contract_status AS ENUM ('draft', 'sent', 'signed', 'manual_signed', 'void');

-- Enum para método de assinatura
CREATE TYPE public.signature_method AS ENUM ('digital', 'manual');

-- Tabela de templates de contrato
CREATE TABLE public.contract_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id uuid NOT NULL REFERENCES public.academies(id) ON DELETE CASCADE,
  title text NOT NULL,
  version integer NOT NULL DEFAULT 1,
  body_html text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Tabela de contratos (instâncias)
CREATE TABLE public.contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id uuid NOT NULL REFERENCES public.academies(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  template_id uuid NOT NULL REFERENCES public.contract_templates(id),
  status public.contract_status NOT NULL DEFAULT 'draft',
  contract_token text UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  sent_at timestamptz,
  signed_at timestamptz,
  voided_at timestamptz,
  voided_reason text,
  pdf_url text,
  signed_pdf_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Tabela de assinaturas
CREATE TABLE public.contract_signatures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id uuid NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  signer_profile_id uuid REFERENCES public.profiles(id),
  signer_name text NOT NULL,
  signer_document text NOT NULL,
  method public.signature_method NOT NULL DEFAULT 'digital',
  signature_svg text,
  accepted_at timestamptz NOT NULL DEFAULT now(),
  ip_address text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Índices
CREATE INDEX idx_contract_templates_academy ON public.contract_templates(academy_id);
CREATE INDEX idx_contracts_academy ON public.contracts(academy_id);
CREATE INDEX idx_contracts_student ON public.contracts(student_id);
CREATE INDEX idx_contracts_token ON public.contracts(contract_token);
CREATE INDEX idx_contract_signatures_contract ON public.contract_signatures(contract_id);

-- RLS
ALTER TABLE public.contract_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contract_signatures ENABLE ROW LEVEL SECURITY;

-- Policies para contract_templates
CREATE POLICY "Admins can manage contract_templates"
  ON public.contract_templates FOR ALL
  USING (academy_id = get_user_academy_id(auth.uid()) AND get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Users can view active templates"
  ON public.contract_templates FOR SELECT
  USING (academy_id = get_user_academy_id(auth.uid()) AND is_active = true);

-- Policies para contracts
CREATE POLICY "Admins can manage contracts"
  ON public.contracts FOR ALL
  USING (academy_id = get_user_academy_id(auth.uid()) AND get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Students can view their own contracts"
  ON public.contracts FOR SELECT
  USING (student_id IN (SELECT id FROM public.students WHERE profile_id = auth.uid()));

CREATE POLICY "Public can view contract by token"
  ON public.contracts FOR SELECT
  USING (contract_token IS NOT NULL);

CREATE POLICY "Students can update their own contracts to signed"
  ON public.contracts FOR UPDATE
  USING (student_id IN (SELECT id FROM public.students WHERE profile_id = auth.uid()))
  WITH CHECK (status IN ('sent', 'signed'));

-- Policies para contract_signatures
CREATE POLICY "Admins can manage signatures"
  ON public.contract_signatures FOR ALL
  USING (contract_id IN (
    SELECT id FROM public.contracts WHERE academy_id = get_user_academy_id(auth.uid())
  ) AND get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Students can insert their own signature"
  ON public.contract_signatures FOR INSERT
  WITH CHECK (contract_id IN (
    SELECT c.id FROM public.contracts c
    JOIN public.students s ON s.id = c.student_id
    WHERE s.profile_id = auth.uid()
  ));

CREATE POLICY "Students can view their own signatures"
  ON public.contract_signatures FOR SELECT
  USING (contract_id IN (
    SELECT c.id FROM public.contracts c
    JOIN public.students s ON s.id = c.student_id
    WHERE s.profile_id = auth.uid()
  ));

-- Trigger para updated_at
CREATE TRIGGER update_contract_templates_updated_at
  BEFORE UPDATE ON public.contract_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_contracts_updated_at
  BEFORE UPDATE ON public.contracts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
-- Add suspension columns to students
ALTER TABLE public.students
ADD COLUMN IF NOT EXISTS suspended_reason text,
ADD COLUMN IF NOT EXISTS suspended_at timestamptz;

-- Add payment provider columns to invoices
ALTER TABLE public.invoices
ADD COLUMN IF NOT EXISTS provider text DEFAULT 'mercadopago',
ADD COLUMN IF NOT EXISTS external_reference text,
ADD COLUMN IF NOT EXISTS provider_payment_id text,
ADD COLUMN IF NOT EXISTS checkout_url text,
ADD COLUMN IF NOT EXISTS pix_qr_base64 text,
ADD COLUMN IF NOT EXISTS pix_copiaecola text;

-- Create index for external_reference lookups
CREATE INDEX IF NOT EXISTS idx_invoices_external_reference ON public.invoices(external_reference);

-- Create function to suspend overdue students (called by cron)
CREATE OR REPLACE FUNCTION public.suspend_overdue_students()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_suspended_count integer := 0;
BEGIN
  -- Update students with overdue invoices (3+ days past due)
  UPDATE public.students s
  SET 
    status = 'suspended',
    suspended_reason = 'Inadimplência - fatura vencida há mais de 3 dias',
    suspended_at = now()
  WHERE s.id IN (
    SELECT DISTINCT i.student_id
    FROM public.invoices i
    WHERE i.status IN ('open', 'overdue')
      AND i.due_date < (CURRENT_DATE - interval '3 days')
  )
  AND s.status = 'active';
  
  GET DIAGNOSTICS v_suspended_count = ROW_COUNT;
  
  -- Mark old open invoices as overdue
  UPDATE public.invoices
  SET status = 'overdue'
  WHERE status = 'open'
    AND due_date < CURRENT_DATE;
  
  RETURN json_build_object('suspended_count', v_suspended_count);
END;
$$;

-- Create function to reactivate student when payment is received
CREATE OR REPLACE FUNCTION public.reactivate_student_on_payment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- When invoice is marked as paid
  IF NEW.status = 'paid' AND (OLD.status IS NULL OR OLD.status != 'paid') THEN
    -- Check if student has no other unpaid overdue invoices
    IF NOT EXISTS (
      SELECT 1 FROM public.invoices
      WHERE student_id = NEW.student_id
        AND id != NEW.id
        AND status IN ('open', 'overdue')
        AND due_date < CURRENT_DATE
    ) THEN
      -- Reactivate student
      UPDATE public.students
      SET 
        status = 'active',
        suspended_reason = NULL,
        suspended_at = NULL
      WHERE id = NEW.student_id
        AND status = 'suspended';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for automatic reactivation
DROP TRIGGER IF EXISTS trigger_reactivate_on_payment ON public.invoices;
CREATE TRIGGER trigger_reactivate_on_payment
  AFTER UPDATE ON public.invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.reactivate_student_on_payment();
-- =========================================================
-- INVOICES: CAMPOS ADICIONAIS PARA PIX MERCADO PAGO
-- =========================================================

-- provider_status para tracking separado do status interno
ALTER TABLE public.invoices
ADD COLUMN IF NOT EXISTS provider_status text NOT NULL DEFAULT 'pending';
-- pending | paid | canceled | expired

-- Data de expiração do QR Pix
ALTER TABLE public.invoices
ADD COLUMN IF NOT EXISTS pix_expires_at timestamptz;

-- =========================================================
-- ÍNDICES ÚTEIS
-- =========================================================

CREATE INDEX IF NOT EXISTS idx_invoices_status_due
ON public.invoices(provider_status, due_date);

CREATE UNIQUE INDEX IF NOT EXISTS ux_invoices_provider_payment_id
ON public.invoices(provider_payment_id)
WHERE provider_payment_id IS NOT NULL;
-- Add PIX-specific columns to invoices table
ALTER TABLE public.invoices 
ADD COLUMN IF NOT EXISTS pix_qr_base64 TEXT,
ADD COLUMN IF NOT EXISTS pix_copiaecola TEXT,
ADD COLUMN IF NOT EXISTS pix_expires_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS provider_status TEXT DEFAULT 'pending';

-- Add comment for clarity
COMMENT ON COLUMN public.invoices.pix_qr_base64 IS 'Base64 encoded PIX QR code image';
COMMENT ON COLUMN public.invoices.pix_copiaecola IS 'PIX copy-paste code';
COMMENT ON COLUMN public.invoices.pix_expires_at IS 'PIX expiration timestamp';
COMMENT ON COLUMN public.invoices.provider_status IS 'Payment provider status: pending, paid, canceled, expired';
-- Fix 1: student_registrations - Replace insecure public SELECT policy
-- The current policy allows anyone to view all registrations that have a token
-- New policy requires the token to be provided as a query filter

DROP POLICY IF EXISTS "Public can view their own registration by token" ON public.student_registrations;

-- Create a secure policy that only allows viewing a specific registration when the exact token is provided
-- This uses a RLS technique where the policy checks if the token matches what's being queried
CREATE POLICY "Public can view registration by matching token" 
ON public.student_registrations 
FOR SELECT 
USING (
  -- Only allow access if the user is an authenticated admin OR
  -- the query is filtering by the exact registration_token value
  (
    (get_user_role(auth.uid()) = 'admin' AND academy_id = get_user_academy_id(auth.uid()))
  ) OR (
    -- For public access, require that the registration_token column equals 
    -- the value being searched (this works with .eq() queries)
    registration_token IS NOT NULL AND registration_token = current_setting('request.jwt.claims', true)::json->>'registration_token'
  )
);

-- Actually, the above approach won't work well. Let's use a simpler approach:
-- Remove the overly permissive policy and keep only the admin policy
-- Public access should go through the edge function which uses service role

DROP POLICY IF EXISTS "Public can view registration by matching token" ON public.student_registrations;

-- The existing admin policy handles authenticated admin access
-- For public registration viewing, they should only see confirmation, not query the table directly

-- Fix 2: contracts - Replace insecure public SELECT policy
-- The current policy allows anyone to view all contracts that have a token

DROP POLICY IF EXISTS "Public can view contract by token" ON public.contracts;

-- For contracts, we need public access for the signing flow
-- Create a function to safely check if a provided token matches
CREATE OR REPLACE FUNCTION public.check_contract_token(provided_token text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.contracts 
    WHERE contract_token = provided_token
  );
$$;

-- The public contract viewing should happen through the existing authenticated queries
-- or we need a different approach. Let's check what the ContractSign page uses.

-- For the contract signing page, students access via token in URL
-- The query uses .eq('contract_token', token) so we need to allow that specific access pattern
-- We'll create a policy that's restrictive but allows the token-based lookup

-- Re-add a secure version: only accessible if querying by exact token match
-- This requires the RPC or a different approach

-- Let's create an RPC function for secure public contract access by token
CREATE OR REPLACE FUNCTION public.get_contract_by_token(p_token text)
RETURNS TABLE (
  id uuid,
  academy_id uuid,
  student_id uuid,
  template_id uuid,
  status contract_status,
  sent_at timestamptz,
  signed_at timestamptz,
  voided_at timestamptz,
  created_at timestamptz,
  updated_at timestamptz,
  signed_pdf_url text,
  contract_token text,
  voided_reason text,
  pdf_url text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only return if exact token match, prevents enumeration
  RETURN QUERY
  SELECT 
    c.id, c.academy_id, c.student_id, c.template_id, c.status,
    c.sent_at, c.signed_at, c.voided_at, c.created_at, c.updated_at,
    c.signed_pdf_url, c.contract_token, c.voided_reason, c.pdf_url
  FROM contracts c
  WHERE c.contract_token = p_token
    AND c.contract_token IS NOT NULL
    AND c.status != 'void';
END;
$$;

-- Similarly for student_registrations public lookup
CREATE OR REPLACE FUNCTION public.get_registration_by_token(p_token text)
RETURNS TABLE (
  id uuid,
  academy_id uuid,
  name text,
  status text,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only return minimal info for confirmation, not PII
  RETURN QUERY
  SELECT 
    r.id, r.academy_id, r.name, r.status, r.created_at
  FROM student_registrations r
  WHERE r.registration_token = p_token
    AND r.registration_token IS NOT NULL;
END;
$$;

-- Grant execute to anon and authenticated roles
GRANT EXECUTE ON FUNCTION public.get_contract_by_token(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_registration_by_token(text) TO anon, authenticated;
-- Create Enum for SaaS Subscription Status
CREATE TYPE public.saas_subscription_status AS ENUM ('trialing', 'active', 'past_due', 'canceled', 'incomplete');

-- Create Table: academy_subscriptions
CREATE TABLE public.academy_subscriptions (
    academy_id UUID NOT NULL REFERENCES public.academies(id) ON DELETE CASCADE,
    status public.saas_subscription_status NOT NULL DEFAULT 'trialing',
    trial_end TIMESTAMP WITH TIME ZONE,
    current_period_end TIMESTAMP WITH TIME ZONE,
    payment_provider TEXT DEFAULT 'mercadopago',
    external_customer_id TEXT,
    external_subscription_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (academy_id)
);

-- Enable RLS
ALTER TABLE public.academy_subscriptions ENABLE ROW LEVEL SECURITY;

-- Policy: Academies can view their own subscription status
CREATE POLICY "Admins can view their academy subscription" ON public.academy_subscriptions
    FOR SELECT
    USING (auth.uid() IN (
        SELECT id FROM public.profiles 
        WHERE academy_id = academy_subscriptions.academy_id 
        AND role = 'admin'
    ));

-- Function: Check if academy has access (SaaS Logic)
CREATE OR REPLACE FUNCTION public.academy_has_access(_academy_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    -- If no subscription exists, deny access (or allow if you want a default fallback, but strict is better)
    -- For now, let's be strict: must have a subscription entry.
    RETURN EXISTS (
        SELECT 1 
        FROM public.academy_subscriptions
        WHERE academy_id = _academy_id
        AND (
            status IN ('trialing', 'active')
            OR (
                status = 'past_due' 
                AND current_period_end > (now() - INTERVAL '3 days') -- 3 days grace period
            )
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

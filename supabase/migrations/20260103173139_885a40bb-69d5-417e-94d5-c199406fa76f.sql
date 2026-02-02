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
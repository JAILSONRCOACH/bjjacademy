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
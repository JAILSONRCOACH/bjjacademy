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
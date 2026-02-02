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
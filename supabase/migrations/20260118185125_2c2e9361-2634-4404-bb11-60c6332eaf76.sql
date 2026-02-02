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
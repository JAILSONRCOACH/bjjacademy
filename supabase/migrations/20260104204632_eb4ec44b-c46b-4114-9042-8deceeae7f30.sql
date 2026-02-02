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

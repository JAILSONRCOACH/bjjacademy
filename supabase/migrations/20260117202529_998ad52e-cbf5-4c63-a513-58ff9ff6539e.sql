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
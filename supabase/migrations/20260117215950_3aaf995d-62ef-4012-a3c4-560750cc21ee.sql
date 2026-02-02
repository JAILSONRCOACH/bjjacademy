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
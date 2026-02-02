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
-- Add phone, email and guardian fields to students table
ALTER TABLE public.students 
ADD COLUMN phone text,
ADD COLUMN email text,
ADD COLUMN guardian_name text,
ADD COLUMN guardian_phone text;
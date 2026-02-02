-- Add CPF column to profiles table
ALTER TABLE public.profiles
ADD COLUMN cpf text;

-- Add index for CPF lookups
CREATE INDEX idx_profiles_cpf ON public.profiles(cpf) WHERE cpf IS NOT NULL;
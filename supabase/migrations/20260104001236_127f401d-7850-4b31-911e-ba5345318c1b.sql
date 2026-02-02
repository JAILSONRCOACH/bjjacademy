-- Add weight, gender and category columns to students table
ALTER TABLE public.students 
ADD COLUMN IF NOT EXISTS weight numeric,
ADD COLUMN IF NOT EXISTS gender text CHECK (gender IN ('male', 'female')),
ADD COLUMN IF NOT EXISTS category text;

-- Add cpf column to students table (may already exist in profiles, but needed here too)
ALTER TABLE public.students 
ADD COLUMN IF NOT EXISTS cpf text;
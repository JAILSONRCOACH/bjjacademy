-- Migration: Add academy_id to registration_invites
-- This allows each registration link to be tied to a specific academy

ALTER TABLE public.registration_invites
ADD COLUMN IF NOT EXISTS academy_id UUID REFERENCES public.academies(id) ON DELETE CASCADE;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_registration_invites_academy_id 
ON public.registration_invites(academy_id);

-- Update existing invites to have academy_id (if needed for migration)
-- This query assumes you want to backfill based on existing links
-- Adjust logic as needed for your data
UPDATE public.registration_invites ri
SET academy_id = (
  SELECT p.academy_id 
  FROM public.profiles p
  WHERE p.id = ri.instructor_profile_id
  LIMIT 1
)
WHERE ri.academy_id IS NULL AND ri.instructor_profile_id IS NOT NULL;

COMMENT ON COLUMN public.registration_invites.academy_id IS 'Links registration invite to specific academy for SaaS multi-tenancy';

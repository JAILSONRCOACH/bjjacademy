-- ADD ONBOARDING COLUMN
DO $$ 
BEGIN 
    ALTER TABLE public.academies ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;
    ALTER TABLE public.academies ADD COLUMN IF NOT EXISTS onboarding_step INTEGER DEFAULT 0;
EXCEPTION 
    WHEN duplicate_column THEN NULL; 
END $$;

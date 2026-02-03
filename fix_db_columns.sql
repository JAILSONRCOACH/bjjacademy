-- Add missing columns to match Frontend Logic
-- Run this in Supabase SQL Editor

DO $$ 
BEGIN 
    -- Identification
    ALTER TABLE public.academies ADD COLUMN IF NOT EXISTS cnpj text;
    ALTER TABLE public.academies ADD COLUMN IF NOT EXISTS cpf text;
    ALTER TABLE public.academies ADD COLUMN IF NOT EXISTS razao_social text;
    ALTER TABLE public.academies ADD COLUMN IF NOT EXISTS responsible_name text;
    
    -- Contact
    ALTER TABLE public.academies ADD COLUMN IF NOT EXISTS phone text;
    ALTER TABLE public.academies ADD COLUMN IF NOT EXISTS whatsapp text;
    ALTER TABLE public.academies ADD COLUMN IF NOT EXISTS email text;
    
    -- Structured Data
    ALTER TABLE public.academies ADD COLUMN IF NOT EXISTS address_json jsonb DEFAULT '{}'::jsonb;
    ALTER TABLE public.academies ADD COLUMN IF NOT EXISTS bank_info jsonb DEFAULT '{}'::jsonb;

EXCEPTION 
    WHEN duplicate_column THEN NULL; 
END $$;

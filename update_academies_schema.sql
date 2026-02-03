-- UPDATE ACADEMIES SCHEMA & RLS
-- 1. Add missing columns for detailed address and banking info
DO $$ 
BEGIN 
    -- Address Fields
    ALTER TABLE public.academies ADD COLUMN IF NOT EXISTS address_zip TEXT;
    ALTER TABLE public.academies ADD COLUMN IF NOT EXISTS address_street TEXT;
    ALTER TABLE public.academies ADD COLUMN IF NOT EXISTS address_number TEXT;
    ALTER TABLE public.academies ADD COLUMN IF NOT EXISTS address_complement TEXT;
    ALTER TABLE public.academies ADD COLUMN IF NOT EXISTS address_neighborhood TEXT;
    ALTER TABLE public.academies ADD COLUMN IF NOT EXISTS address_city TEXT;
    ALTER TABLE public.academies ADD COLUMN IF NOT EXISTS address_state TEXT;
    
    -- Document (CNPJ/CPF)
    ALTER TABLE public.academies ADD COLUMN IF NOT EXISTS document TEXT;
    ALTER TABLE public.academies ADD COLUMN IF NOT EXISTS doc_type TEXT DEFAULT 'cnpj'; -- 'cnpj' or 'cpf'
    
    -- Responsible
    ALTER TABLE public.academies ADD COLUMN IF NOT EXISTS responsible_name TEXT;
    ALTER TABLE public.academies ADD COLUMN IF NOT EXISTS responsible_cpf TEXT;

    -- Banking Info (JSONB for flexibility, or columns)
    ALTER TABLE public.academies ADD COLUMN IF NOT EXISTS bank_info JSONB DEFAULT '{}'::jsonb;
    -- structure: { bank_code, branch, branch_digit, account, account_digit, type, holder_name, holder_document }

EXCEPTION 
    WHEN duplicate_column THEN NULL; 
END $$;

-- 2. FIX RLS FOR ACADEMIES
-- Allow Super Admins to view ALL academies
ALTER TABLE public.academies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Super Admins can view all academies" ON public.academies;
CREATE POLICY "Super Admins can view all academies"
ON public.academies FOR SELECT
USING (
  public.check_is_super_admin() = true -- Uses the secure function we created
  OR
  id = public.get_user_academy_id(auth.uid()) -- Or user belongs to it
);

-- Allow Admins to update their own academy
DROP POLICY IF EXISTS "Admins can update own academy" ON public.academies;
CREATE POLICY "Admins can update own academy"
ON public.academies FOR UPDATE
USING (
  id = public.get_user_academy_id(auth.uid())
  OR
  public.check_is_super_admin() = true
);

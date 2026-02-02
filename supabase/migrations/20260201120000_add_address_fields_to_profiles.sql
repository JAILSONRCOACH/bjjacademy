-- Add address and personal document fields to profiles for contract generation
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS rg TEXT,
ADD COLUMN IF NOT EXISTS address_street TEXT,
ADD COLUMN IF NOT EXISTS address_number TEXT,
ADD COLUMN IF NOT EXISTS address_complement TEXT,
ADD COLUMN IF NOT EXISTS address_neighborhood TEXT,
ADD COLUMN IF NOT EXISTS address_city TEXT,
ADD COLUMN IF NOT EXISTS address_state TEXT,
ADD COLUMN IF NOT EXISTS address_zip TEXT;

-- Add index for state (common filter)
CREATE INDEX IF NOT EXISTS idx_profiles_address_state ON public.profiles(address_state) WHERE address_state IS NOT NULL;

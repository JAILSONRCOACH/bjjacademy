-- Promote jailsonrcoach@gmail.com to Super Admin
-- This handles cases where the profile might be missing or role is wrong.

-- 1. Ensure Profile Exists (idempotent, relies on Auth ID match)
-- We cannot easily INSERT if we don't know the exact UUID from here without querying.
-- BUT we can update based on email if the trigger created it.

UPDATE public.profiles
SET 
    is_super_admin = true,
    role = 'admin' -- Ensure they have at least a basic role to pass other checks
WHERE email = 'jailsonrcoach@gmail.com';

-- Verify full access in case of RLS blocking
-- This is just a check, no action needed if policies are fixed.

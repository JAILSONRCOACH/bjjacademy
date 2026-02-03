-- Force confirm the user email in case it's pending
-- This requires high privileges (postgres role usually has it in Supabase SQL Editor)

UPDATE auth.users
SET email_confirmed_at = NOW(),
    updated_at = NOW()
WHERE email = 'jailsonrcoach@gmail.com';

-- Also ensure the profile exists and is linked
-- If the profile is missing, we might need to recreate it manually or trigger.

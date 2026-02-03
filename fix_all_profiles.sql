-- =====================================================
-- FIX ALL PROFILES & PERMISSIONS
-- =====================================================

-- 1. Ensure basic RLS policy exists for Profiles (Users can see own profile)
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" 
ON public.profiles FOR SELECT 
USING (auth.uid() = id);

-- 2. Ensure Super Admin Policy
DROP POLICY IF EXISTS "Super Admins can view all profiles" ON public.profiles;
CREATE POLICY "Super Admins can view all profiles"
ON public.profiles FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND is_super_admin = true
  )
);

-- 3. FIX ORPHAN PROFILES (Missing Academy ID)
-- This links any profile without an academy to the "System Academy" (or first one found)

DO $$
DECLARE
    sys_academy_id UUID;
BEGIN
    -- Get or Create System Academy
    SELECT id INTO sys_academy_id FROM public.academies LIMIT 1;
    IF sys_academy_id IS NULL THEN
        INSERT INTO public.academies (name) VALUES ('System Academy') RETURNING id INTO sys_academy_id;
    END IF;

    -- Update Profiles with NULL academy_id
    UPDATE public.profiles
    SET academy_id = sys_academy_id
    WHERE academy_id IS NULL;
    
    -- Ensure Super Admin (jailsonrcoach) has correct permissions
    UPDATE public.profiles
    SET is_super_admin = true, role = 'admin', academy_id = sys_academy_id
    WHERE email = 'jailsonrcoach@gmail.com';

END $$;

-- 4. ENSURE MAISA IS LINKED (If she is the new academy)
-- If her profile is missing entirely (auth exists but profile doesn't), we create it.
-- We try to find an academy named like 'Maisa' or created recently, otherwise System Academy.

DO $$
DECLARE
    user_rec RECORD;
    new_academy_id UUID;
BEGIN
    FOR user_rec IN SELECT * FROM auth.users LOOP
        -- If profile does NOT exist for this auth user
        IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = user_rec.id) THEN
            
            -- Try to find their academy (most recent one?)
            SELECT id INTO new_academy_id FROM public.academies ORDER BY created_at DESC LIMIT 1;
            
            INSERT INTO public.profiles (id, academy_id, email, name, role)
            VALUES (
                user_rec.id, 
                new_academy_id, 
                user_rec.email, 
                'Admin Recuperado', 
                'admin'
            );
            RAISE NOTICE 'Perfil recuperado para %', user_rec.email;
        END IF;
    END LOOP;
END $$;

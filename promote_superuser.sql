-- Promote an existing user to Super Admin (safe / idempotent)
-- Run in Supabase SQL Editor.
-- Update `target_email` if needed.

DO $$
DECLARE
    target_email TEXT := 'jailsonrcoach@gmail.com';
    target_user_id UUID;
    target_academy_id UUID;
BEGIN
    -- 1) Find auth user
    SELECT id INTO target_user_id
    FROM auth.users
    WHERE email = target_email
    LIMIT 1;

    IF target_user_id IS NULL THEN
        RAISE EXCEPTION 'Usuário % não encontrado em auth.users', target_email;
    END IF;

    -- 2) Ensure email is confirmed (avoids login block)
    UPDATE auth.users
    SET email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
        updated_at = NOW()
    WHERE id = target_user_id;

    -- 3) Ensure we have a valid academy_id (profiles.academy_id is required)
    SELECT academy_id INTO target_academy_id
    FROM public.profiles
    WHERE id = target_user_id
    LIMIT 1;

    IF target_academy_id IS NULL THEN
        SELECT id INTO target_academy_id
        FROM public.academies
        ORDER BY created_at
        LIMIT 1;
    END IF;

    IF target_academy_id IS NULL THEN
        INSERT INTO public.academies (name)
        VALUES ('System Academy')
        RETURNING id INTO target_academy_id;
    END IF;

    -- 4) Upsert profile with admin + super admin privileges
    INSERT INTO public.profiles (
        id,
        academy_id,
        email,
        name,
        role,
        roles,
        status,
        is_super_admin,
        created_at,
        updated_at
    )
    VALUES (
        target_user_id,
        target_academy_id,
        target_email,
        'Super Admin',
        'admin'::user_role,
        ARRAY['admin']::user_role[],
        'active',
        true,
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO UPDATE
    SET
        academy_id = EXCLUDED.academy_id,
        email = EXCLUDED.email,
        role = 'admin'::user_role,
        roles = ARRAY['admin']::user_role[],
        status = 'active',
        is_super_admin = true,
        updated_at = NOW();

    RAISE NOTICE 'OK: % promovido para Super Admin (user_id=%).', target_email, target_user_id;
END $$;

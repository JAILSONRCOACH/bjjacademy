-- FIX MISSING PROFILE V2 (Handle Not Null academy_id)

DO $$
DECLARE
    target_email TEXT := 'jailsonrcoach@gmail.com';
    user_record auth.users%ROWTYPE;
    default_academy_id UUID;
BEGIN
    -- 1. Get the Auth User
    SELECT * INTO user_record FROM auth.users WHERE email = target_email;

    IF user_record.id IS NULL THEN
        RAISE EXCEPTION 'Erro: Usuário % não encontrado. Crie a conta primeiro.', target_email;
    END IF;

    -- 2. Find ANY valid academy to attach (since Super Admin transcends academies)
    -- Or create a placeholder one if none exists.
    SELECT id INTO default_academy_id FROM public.academies LIMIT 1;

    IF default_academy_id IS NULL THEN
        INSERT INTO public.academies (name) VALUES ('System Academy') RETURNING id INTO default_academy_id;
    END IF;

    -- 3. Upsert Profile
    INSERT INTO public.profiles (
        id, 
        academy_id, 
        email, 
        name, 
        role, 
        is_super_admin, 
        created_at, 
        updated_at
    )
    VALUES (
        user_record.id,
        default_academy_id,
        target_email,
        'Super Admin',
        'admin',
        true,
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO UPDATE
    SET is_super_admin = true,
        role = 'admin',
        -- Ensure academy_id is valid if it was somehow null (though constraint prevents that)
        academy_id = EXCLUDED.academy_id;

    RAISE NOTICE 'Sucesso! Perfil corrigido para % vinculado à academia %', target_email, default_academy_id;
END $$;

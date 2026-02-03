-- FIX MISSING PROFILE & GRANT SUPER ADMIN
-- Run this in Supabase SQL Editor

DO $$
DECLARE
    target_email TEXT := 'jailsonrcoach@gmail.com';
    user_record auth.users%ROWTYPE;
BEGIN
    -- 1. Get the Auth User
    SELECT * INTO user_record FROM auth.users WHERE email = target_email;

    IF user_record.id IS NULL THEN
        RAISE EXCEPTION 'Erro: Usuário % não encontrado em auth.users. Crie a conta primeiro.', target_email;
    END IF;

    -- 2. Ensure Profile Exists (Insert if missing)
    INSERT INTO public.profiles (id, email, name, role, is_super_admin, created_at, updated_at)
    VALUES (
        user_record.id,
        target_email,
        'Super Admin', -- Nome padrão
        'admin',       -- Role fundamental
        true,          -- ACCESS GRANTED
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO UPDATE
    SET is_super_admin = true,
        role = 'admin'; -- Garante que tenha role

    RAISE NOTICE 'Sucesso! Perfil corrigido e acesso liberado para %', target_email;
END $$;

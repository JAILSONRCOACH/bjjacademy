-- SCRIPT PARA VINCULAR O USUÁRIO CRIADO A UMA NOVA ACADEMIA E ASSINATURA
-- Cole isso no Editor SQL do Supabase

DO $$
DECLARE
    -- Substitua pelo ID do usuário que você criou
    v_user_id UUID := '2879267e-7ac5-4028-bd9d-1ef591d6da90';
    v_user_email TEXT := 'jailsonrcoach@gmail.com';
    v_academy_name TEXT := 'BJJ Academy Principal';
    
    v_academy_id UUID;
BEGIN
    -- 1. Criar a Academia
    INSERT INTO public.academies (name)
    VALUES (v_academy_name)
    RETURNING id INTO v_academy_id;

    -- 2. Criar o Perfil de Admin
    -- CORREÇÃO: Cast explícito de ARRAY['admin'] para user_role[]
    INSERT INTO public.profiles (id, academy_id, email, name, role, roles, status)
    VALUES (
        v_user_id, 
        v_academy_id, 
        v_user_email, 
        'Admin Principal', 
        'admin'::user_role, 
        ARRAY['admin']::user_role[], 
        'active'
    )
    ON CONFLICT (id) DO UPDATE 
    SET academy_id = EXCLUDED.academy_id, role = 'admin'::user_role, status = 'active';

    -- 3. Criar a Assinatura Trial (7 dias)
    INSERT INTO public.academy_subscriptions (academy_id, status, trial_end, payment_provider)
    VALUES (v_academy_id, 'trialing', now() + interval '7 days', 'mercadopago')
    ON CONFLICT (academy_id) DO NOTHING;

    RAISE NOTICE 'Academia % criada com ID % para o usuário %', v_academy_name, v_academy_id, v_user_email;
END $$;

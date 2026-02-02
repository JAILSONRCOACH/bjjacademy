-- SCRIPT COMPLETO DE RECUPERAÇÃO E SETUP
-- Este script cria as tabelas que faltam E vincula seu usuário.

-- 1. Criar Type ENUM se não existir
DO $$ BEGIN
    CREATE TYPE public.saas_subscription_status AS ENUM ('trialing', 'active', 'past_due', 'canceled', 'incomplete');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Criar tabela de assinaturas se não existir
CREATE TABLE IF NOT EXISTS public.academy_subscriptions (
    academy_id UUID NOT NULL REFERENCES public.academies(id) ON DELETE CASCADE,
    status public.saas_subscription_status NOT NULL DEFAULT 'trialing',
    trial_end TIMESTAMP WITH TIME ZONE,
    current_period_end TIMESTAMP WITH TIME ZONE,
    payment_provider TEXT DEFAULT 'mercadopago',
    external_customer_id TEXT,
    external_subscription_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (academy_id)
);

-- 3. Função de verificação de acesso (SaaS Logic)
CREATE OR REPLACE FUNCTION public.academy_has_access(_academy_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM public.academy_subscriptions
        WHERE academy_id = _academy_id
        AND (
            status IN ('trialing', 'active')
            OR (
                status = 'past_due' 
                AND current_period_end > (now() - INTERVAL '3 days')
            )
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 4. BOOTSTRAP DO SEU USUÁRIO
DO $$
DECLARE
    v_user_id UUID := '2879267e-7ac5-4028-bd9d-1ef591d6da90';
    v_user_email TEXT := 'jailsonrcoach@gmail.com';
    v_academy_name TEXT := 'BJJ Academy Principal';
    
    v_academy_id UUID;
BEGIN
    -- Criar Academia
    INSERT INTO public.academies (name)
    VALUES (v_academy_name)
    RETURNING id INTO v_academy_id;

    -- Criar Perfil (Com correção de CAST)
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

    -- Criar Assinatura Trial
    INSERT INTO public.academy_subscriptions (academy_id, status, trial_end, payment_provider)
    VALUES (v_academy_id, 'trialing', now() + interval '7 days', 'mercadopago')
    ON CONFLICT (academy_id) DO NOTHING;

    RAISE NOTICE 'SUCESSO TOTAL! Tabela criada e usuario vinculado.';
END $$;

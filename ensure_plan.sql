-- FIX PLAN TABLE AND INSERT PRO PLAN
-- This script first adds the missing column, then inserts the plan.

-- 1. Specify that we want to add the column if it doesn't exist
DO $$ 
BEGIN 
    ALTER TABLE public.saas_plans ADD COLUMN description TEXT;
EXCEPTION 
    WHEN duplicate_column THEN NULL; 
END $$;

-- 2. Insert the Plan
INSERT INTO public.saas_plans (name, description, price, interval, features)
VALUES (
    'Plano Pro',
    'Acesso completo ao sistema de gestão.',
    9900, -- R$ 99,00
    'month',
    '{"max_students": 500, "all_features": true}'
)
ON CONFLICT DO NOTHING;

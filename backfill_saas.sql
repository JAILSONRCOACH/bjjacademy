-- =====================================================
-- BACKFILL SAAS SUBSCRIPTIONS
-- =====================================================
-- This script creates subscription records for existing academies
-- that were created before the SaaS module was implemented.

INSERT INTO public.saas_subscriptions (academy_id, status, trial_end)
SELECT 
    id as academy_id,
    'trial' as status, -- Defaulting to trial so you can approve them manually or set to 'active'
    NOW() + INTERVAL '30 days' as trial_end -- Giving them 30 days grace period
FROM 
    public.academies a
WHERE 
    NOT EXISTS (
        SELECT 1 FROM public.saas_subscriptions s 
        WHERE s.academy_id = a.id
    );

-- Optional: If you want to automatically set ALL existing ones to 'active' immediately:
-- UPDATE public.saas_subscriptions SET status = 'active' WHERE status = 'trial';

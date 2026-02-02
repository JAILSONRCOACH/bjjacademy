-- Create Enum for SaaS Subscription Status
CREATE TYPE public.saas_subscription_status AS ENUM ('trialing', 'active', 'past_due', 'canceled', 'incomplete');

-- Create Table: academy_subscriptions
CREATE TABLE public.academy_subscriptions (
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

-- Enable RLS
ALTER TABLE public.academy_subscriptions ENABLE ROW LEVEL SECURITY;

-- Policy: Academies can view their own subscription status
CREATE POLICY "Admins can view their academy subscription" ON public.academy_subscriptions
    FOR SELECT
    USING (auth.uid() IN (
        SELECT id FROM public.profiles 
        WHERE academy_id = academy_subscriptions.academy_id 
        AND role = 'admin'
    ));

-- Function: Check if academy has access (SaaS Logic)
CREATE OR REPLACE FUNCTION public.academy_has_access(_academy_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    -- If no subscription exists, deny access (or allow if you want a default fallback, but strict is better)
    -- For now, let's be strict: must have a subscription entry.
    RETURN EXISTS (
        SELECT 1 
        FROM public.academy_subscriptions
        WHERE academy_id = _academy_id
        AND (
            status IN ('trialing', 'active')
            OR (
                status = 'past_due' 
                AND current_period_end > (now() - INTERVAL '3 days') -- 3 days grace period
            )
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

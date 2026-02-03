-- =====================================================
-- SAAS MANAGEMENT SCHEMA
-- =====================================================

-- 1. ENUMS
-- =====================================================
DO $$ BEGIN
    CREATE TYPE public.saas_status AS ENUM ('trial', 'active', 'past_due', 'canceled', 'lifetime');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. TABLES
-- =====================================================

-- SaaS Plans
CREATE TABLE IF NOT EXISTS public.saas_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  price INTEGER NOT NULL, -- price in cents (e.g., 9990 = R$ 99,90)
  interval TEXT NOT NULL DEFAULT 'month', -- 'month', 'year'
  features JSONB DEFAULT '{}'::jsonb,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- SaaS Subscriptions
CREATE TABLE IF NOT EXISTS public.saas_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id UUID NOT NULL REFERENCES public.academies(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES public.saas_plans(id),
  pagarme_subscription_id TEXT,
  pagarme_customer_id TEXT,
  status public.saas_status NOT NULL DEFAULT 'trial',
  current_period_end TIMESTAMPTZ,
  trial_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(academy_id) -- One subscription per academy
);

-- 3. RLS POLICIES
-- =====================================================

ALTER TABLE public.saas_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saas_subscriptions ENABLE ROW LEVEL SECURITY;

-- Plans are readable by everyone (public pricing)
DROP POLICY IF EXISTS "Public read access to plans" ON public.saas_plans;
CREATE POLICY "Public read access to plans"
  ON public.saas_plans FOR SELECT
  USING (true);

-- Subscriptions:
-- Academy Admins can view their own subscription
DROP POLICY IF EXISTS "Academy admins can view their own subscription" ON public.saas_subscriptions;
CREATE POLICY "Academy admins can view their own subscription"
  ON public.saas_subscriptions FOR SELECT
  USING (academy_id = public.get_user_academy_id(auth.uid()));

-- 4. SUPER ADMIN LOGIC
-- =====================================================
-- Add is_super_admin to profiles if not exists
DO $$ BEGIN
    ALTER TABLE public.profiles ADD COLUMN is_super_admin BOOLEAN DEFAULT false;
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

-- Policy for Super Admins to view all subscriptions
DROP POLICY IF EXISTS "Super Admins can view all subscriptions" ON public.saas_subscriptions;
CREATE POLICY "Super Admins can view all subscriptions"
  ON public.saas_subscriptions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_super_admin = true
    )
  );

-- Policy for Super Admins to update subscriptions (e.g. manual release)
DROP POLICY IF EXISTS "Super Admins can update all subscriptions" ON public.saas_subscriptions;
CREATE POLICY "Super Admins can update all subscriptions"
  ON public.saas_subscriptions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_super_admin = true
    )
  );

-- Policy for Super Admins to view all profiles (to manage users)
DROP POLICY IF EXISTS "Super Admins can view all profiles" ON public.profiles;
CREATE POLICY "Super Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_super_admin = true
    )
  );
  
-- Policy for Super Admins to update profiles
DROP POLICY IF EXISTS "Super Admins can update all profiles" ON public.profiles;
CREATE POLICY "Super Admins can update all profiles"
  ON public.profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_super_admin = true
    )
  );

-- 5. TRIGGERS
-- =====================================================
-- Update timestamp
DROP TRIGGER IF EXISTS update_saas_plans_updated_at ON public.saas_plans;
CREATE TRIGGER update_saas_plans_updated_at
  BEFORE UPDATE ON public.saas_plans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_saas_subscriptions_updated_at ON public.saas_subscriptions;
CREATE TRIGGER update_saas_subscriptions_updated_at
  BEFORE UPDATE ON public.saas_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to automatically create a subscription row when an academy is created
CREATE OR REPLACE FUNCTION public.handle_new_academy_subscription()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.saas_subscriptions (academy_id, status, trial_end)
  VALUES (
    NEW.id, 
    'trial',
    NOW() + INTERVAL '7 days' -- 7 Day Free Trial
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_academy_created_create_subscription ON public.academies;
CREATE TRIGGER on_academy_created_create_subscription
  AFTER INSERT ON public.academies
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_academy_subscription();

-- 6. ACCESS CONTROL RPC
-- =====================================================
CREATE OR REPLACE FUNCTION public.academy_has_access(_academy_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_status public.saas_status;
  v_trial_end TIMESTAMPTZ;
BEGIN
  SELECT status, trial_end INTO v_status, v_trial_end
  FROM public.saas_subscriptions
  WHERE academy_id = _academy_id;

  -- If no subscription found, assume trial/legacy allow? 
  -- Let's enable default trial behavior or block. 
  -- For safety of existing users (since migration might lag), let's allow if NULL, 
  -- BUT we created a trigger for new ones. Existing ones will be NULL.
  -- Strategy: If NULL, insert a default 'trial' row? Or just Allow.
  IF v_status IS NULL THEN
     RETURN TRUE; -- Legacy/Transition period
  END IF;

  IF v_status = 'active' OR v_status = 'lifetime' THEN
    RETURN TRUE;
  END IF;

  IF v_status = 'trial' THEN
    IF NOW() < v_trial_end THEN
       RETURN TRUE;
    ELSE
       RETURN FALSE; -- Trial expired
    END IF; 
  END IF;

  RETURN FALSE; -- past_due, canceled
END;
$$;

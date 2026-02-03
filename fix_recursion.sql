-- =====================================================
-- FIX RLS INFINITE RECURSION
-- =====================================================

-- 1. Create a Security Definer function to check Super Admin status
-- This bypasses RLS to avoid the infinite loop
CREATE OR REPLACE FUNCTION public.check_is_super_admin(user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT COALESCE(
    (SELECT is_super_admin FROM public.profiles WHERE id = user_id),
    false
  );
$$;

-- 2. Update Policies to use this function instead of direct subquery

-- PROFILES Policies
DROP POLICY IF EXISTS "Super Admins can view all profiles" ON public.profiles;
CREATE POLICY "Super Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING ( public.check_is_super_admin(auth.uid()) );

DROP POLICY IF EXISTS "Super Admins can update all profiles" ON public.profiles;
CREATE POLICY "Super Admins can update all profiles"
  ON public.profiles FOR UPDATE
  USING ( public.check_is_super_admin(auth.uid()) );

-- SUBSCRIPTIONS Policies (Update just to be safe and consistent)
DROP POLICY IF EXISTS "Super Admins can view all subscriptions" ON public.saas_subscriptions;
CREATE POLICY "Super Admins can view all subscriptions"
  ON public.saas_subscriptions FOR SELECT
  USING ( public.check_is_super_admin(auth.uid()) );

DROP POLICY IF EXISTS "Super Admins can update all subscriptions" ON public.saas_subscriptions;
CREATE POLICY "Super Admins can update all subscriptions"
  ON public.saas_subscriptions FOR UPDATE
  USING ( public.check_is_super_admin(auth.uid()) );

-- Also verify if we need to fix the 'academy_has_access' if it used RLS, but it was security definer so it's fine.

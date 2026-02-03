-- FIX INFINITE RECURSION IN RLS (FINAL)
-- The error happened because the Policy queried the same table it was protecting, causing a loop.
-- Solution: Use a SECURITY DEFINER function to bypass RLS for the permission check.

-- 1. Create a Secure Function to check Admin Status (Bypasses RLS)
CREATE OR REPLACE FUNCTION public.check_is_super_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER -- This allows the function to run with owner privileges, bypassing RLS
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.profiles 
    WHERE id = auth.uid() 
    AND is_super_admin = true
  );
END;
$$;

-- 2. Drop the recursive policies
DROP POLICY IF EXISTS "Super Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Super Admins can update all profiles" ON public.profiles;

-- 3. Re-create them using the secure function
CREATE POLICY "Super Admins can view all profiles"
ON public.profiles FOR SELECT
USING (
  public.check_is_super_admin() = true
  OR 
  auth.uid() = id -- User can still see themselves
);

CREATE POLICY "Super Admins can update all profiles"
ON public.profiles FOR UPDATE
USING (
  public.check_is_super_admin() = true -- Only super admin can update others
  OR
  auth.uid() = id -- User can update themselves (optional, depends on needs)
);

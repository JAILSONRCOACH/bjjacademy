-- Fix 1: student_registrations - Replace insecure public SELECT policy
-- The current policy allows anyone to view all registrations that have a token
-- New policy requires the token to be provided as a query filter

DROP POLICY IF EXISTS "Public can view their own registration by token" ON public.student_registrations;

-- Create a secure policy that only allows viewing a specific registration when the exact token is provided
-- This uses a RLS technique where the policy checks if the token matches what's being queried
CREATE POLICY "Public can view registration by matching token" 
ON public.student_registrations 
FOR SELECT 
USING (
  -- Only allow access if the user is an authenticated admin OR
  -- the query is filtering by the exact registration_token value
  (
    (get_user_role(auth.uid()) = 'admin' AND academy_id = get_user_academy_id(auth.uid()))
  ) OR (
    -- For public access, require that the registration_token column equals 
    -- the value being searched (this works with .eq() queries)
    registration_token IS NOT NULL AND registration_token = current_setting('request.jwt.claims', true)::json->>'registration_token'
  )
);

-- Actually, the above approach won't work well. Let's use a simpler approach:
-- Remove the overly permissive policy and keep only the admin policy
-- Public access should go through the edge function which uses service role

DROP POLICY IF EXISTS "Public can view registration by matching token" ON public.student_registrations;

-- The existing admin policy handles authenticated admin access
-- For public registration viewing, they should only see confirmation, not query the table directly

-- Fix 2: contracts - Replace insecure public SELECT policy
-- The current policy allows anyone to view all contracts that have a token

DROP POLICY IF EXISTS "Public can view contract by token" ON public.contracts;

-- For contracts, we need public access for the signing flow
-- Create a function to safely check if a provided token matches
CREATE OR REPLACE FUNCTION public.check_contract_token(provided_token text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.contracts 
    WHERE contract_token = provided_token
  );
$$;

-- The public contract viewing should happen through the existing authenticated queries
-- or we need a different approach. Let's check what the ContractSign page uses.

-- For the contract signing page, students access via token in URL
-- The query uses .eq('contract_token', token) so we need to allow that specific access pattern
-- We'll create a policy that's restrictive but allows the token-based lookup

-- Re-add a secure version: only accessible if querying by exact token match
-- This requires the RPC or a different approach

-- Let's create an RPC function for secure public contract access by token
CREATE OR REPLACE FUNCTION public.get_contract_by_token(p_token text)
RETURNS TABLE (
  id uuid,
  academy_id uuid,
  student_id uuid,
  template_id uuid,
  status contract_status,
  sent_at timestamptz,
  signed_at timestamptz,
  voided_at timestamptz,
  created_at timestamptz,
  updated_at timestamptz,
  signed_pdf_url text,
  contract_token text,
  voided_reason text,
  pdf_url text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only return if exact token match, prevents enumeration
  RETURN QUERY
  SELECT 
    c.id, c.academy_id, c.student_id, c.template_id, c.status,
    c.sent_at, c.signed_at, c.voided_at, c.created_at, c.updated_at,
    c.signed_pdf_url, c.contract_token, c.voided_reason, c.pdf_url
  FROM contracts c
  WHERE c.contract_token = p_token
    AND c.contract_token IS NOT NULL
    AND c.status != 'void';
END;
$$;

-- Similarly for student_registrations public lookup
CREATE OR REPLACE FUNCTION public.get_registration_by_token(p_token text)
RETURNS TABLE (
  id uuid,
  academy_id uuid,
  name text,
  status text,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only return minimal info for confirmation, not PII
  RETURN QUERY
  SELECT 
    r.id, r.academy_id, r.name, r.status, r.created_at
  FROM student_registrations r
  WHERE r.registration_token = p_token
    AND r.registration_token IS NOT NULL;
END;
$$;

-- Grant execute to anon and authenticated roles
GRANT EXECUTE ON FUNCTION public.get_contract_by_token(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_registration_by_token(text) TO anon, authenticated;
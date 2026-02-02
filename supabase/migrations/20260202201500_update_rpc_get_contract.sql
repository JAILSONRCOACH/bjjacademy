-- Update get_contract_by_token RPC to include snapshot_json and new fields
-- Drop first because return type signature changed
DROP FUNCTION IF EXISTS public.get_contract_by_token(text);

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
  pdf_url text,
  snapshot_json jsonb,
  is_minor boolean,
  guardian_id uuid,
  plan_id uuid,
  start_date date,
  expires_at timestamptz
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
    c.signed_pdf_url, c.contract_token, c.voided_reason, c.pdf_url,
    c.snapshot_json, c.is_minor, c.guardian_id, c.plan_id, c.start_date, c.expires_at
  FROM contracts c
  WHERE c.contract_token = p_token
    AND c.contract_token IS NOT NULL
    AND c.status != 'void';
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_contract_by_token(text) TO anon, authenticated;

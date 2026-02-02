-- Função RPC para listar cadastros (bypassa RLS para admin)
-- Cole no SQL Editor do Supabase

CREATE OR REPLACE FUNCTION get_student_registrations_admin()
RETURNS TABLE (
  id UUID,
  name TEXT,
  email TEXT,
  status TEXT,
  source TEXT,
  created_at TIMESTAMPTZ,
  academy_id UUID
)
SECURITY DEFINER -- Roda com privilégios do owner
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sr.id,
    sr.name,
    sr.email,
    sr.status,
    sr.source,
    sr.created_at,
    COALESCE(
      (SELECT ri.academy_id FROM registration_invites ri WHERE ri.token = sr.registration_token),
      sr.academy_id
    ) as academy_id
  FROM student_registrations sr
  ORDER BY sr.created_at DESC
  LIMIT 20;
END;
$$;

-- Testar a função
SELECT * FROM get_student_registrations_admin();

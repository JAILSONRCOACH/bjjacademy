-- DEBUG: Verificar cadastros pendentes
-- Cole este SQL no Supabase SQL Editor para ver o que está acontecendo

-- 1. Ver TODOS os registros (ignora RLS)
SELECT 
  id,
  name,
  email,
  status,
  source,
  created_at,
  academy_id
FROM student_registrations
ORDER BY created_at DESC
LIMIT 10;

-- 2. Ver apenas pendentes
SELECT 
  id,
  name,
  email,
  status,
  created_at
FROM student_registrations
WHERE status = 'pending'
ORDER BY created_at DESC;

-- 3. Verificar se academy_id existe nos links (registration_invites)
SELECT 
  token,
  academy_id,
  created_at,
  active
FROM registration_invites
ORDER BY created_at DESC
LIMIT 5;

-- 4. Se academy_id não existir em registration_invites, rode este:
-- ALTER TABLE registration_invites ADD COLUMN IF NOT EXISTS academy_id UUID REFERENCES academies(id);

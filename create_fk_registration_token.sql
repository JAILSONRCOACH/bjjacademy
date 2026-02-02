-- Verificar e criar foreign key entre student_registrations e registration_invites
-- Cole este SQL no Supabase SQL Editor

-- 1. Verificar se a FK existe
SELECT
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'student_registrations'
  AND tc.constraint_type = 'FOREIGN KEY';

-- 2. Se não existir, criar a FK
ALTER TABLE student_registrations
ADD CONSTRAINT student_registrations_registration_token_fkey
FOREIGN KEY (registration_token)
REFERENCES registration_invites(token)
ON DELETE SET NULL;

-- 3. Testar a query que a Edge Function está fazendo
SELECT 
  sr.*,
  ri.academy_id
FROM student_registrations sr
LEFT JOIN registration_invites ri ON sr.registration_token = ri.token
WHERE sr.status = 'pending'
ORDER BY sr.created_at DESC;

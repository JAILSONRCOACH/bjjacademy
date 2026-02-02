-- DEBUG: Tatame Online - Por que não aparece alunos?
-- Cole este SQL no Supabase SQL Editor

-- 1. Ver TODOS os check-ins de hoje
SELECT 
  a.id,
  a.student_id,
  a.status,
  a.checked_in_at,
  a.source,
  p.name as student_name,
  s.belt_current,
  s.stripes_cached
FROM attendance a
LEFT JOIN profiles p ON p.id = a.student_id
LEFT JOIN students s ON s.profile_id = a.student_id
WHERE a.checked_in_at >= CURRENT_DATE
ORDER BY a.checked_in_at DESC;

-- 2. Ver apenas APROVADOS hoje
SELECT 
  a.id,
  a.student_id,
  a.status,
  a.checked_in_at,
  p.name as student_name
FROM attendance a
LEFT JOIN profiles p ON p.id = a.student_id
WHERE a.checked_in_at >= CURRENT_DATE
  AND a.status = 'approved'
ORDER BY a.checked_in_at DESC;

-- 3. Verificar se o aluno tem registro na tabela students
SELECT 
  s.id,
  s.profile_id,
  s.name,
  s.belt_current,
  s.stripes_cached,
  s.academy_id,
  p.name as profile_name
FROM students s
LEFT JOIN profiles p ON p.id = s.profile_id
WHERE s.profile_id IS NOT NULL
ORDER BY s.created_at DESC
LIMIT 10;

-- 4. Verificar alunos que fizeram check-in MAS não tem registro em students
SELECT 
  a.student_id,
  p.name as profile_name,
  a.status,
  a.checked_in_at,
  s.id as student_record_id
FROM attendance a
LEFT JOIN profiles p ON p.id = a.student_id
LEFT JOIN students s ON s.profile_id = a.student_id
WHERE a.checked_in_at >= CURRENT_DATE
  AND s.id IS NULL -- NÃO TEM REGISTRO EM STUDENTS!
ORDER BY a.checked_in_at DESC;

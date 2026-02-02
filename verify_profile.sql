-- SCRIPT DE VERIFICAÇÃO E CORREÇÃO DO PERFIL

-- 1. Ver todos os perfis criados recentemente (últimas 24 horas)
SELECT 
    p.id,
    p.email,
    p.name,
    p.role,
    p.roles,
    p.status,
    a.name AS academia_nome,
    p.created_at
FROM profiles p
LEFT JOIN academies a ON p.academy_id = a.id
WHERE p.created_at > (NOW() - INTERVAL '1 day')
ORDER BY p.created_at DESC;

-- 2. Se o perfil estiver com role errado, execute este UPDATE:
-- (Substitua o EMAIL pelo email que você cadastrou)

UPDATE profiles
SET 
    role = 'admin'::user_role,
    roles = ARRAY['admin']::user_role[]
WHERE email = 'maisa.lacerda.ml@gmail.com';

-- 3. Verificar se corrigiu
SELECT email, role, roles FROM profiles WHERE email = 'maisa.lacerda.ml@gmail.com';

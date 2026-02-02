-- Corrige admin: sincroniza roles com role existente
UPDATE public.profiles
SET roles = ARRAY['admin', 'student']::public.user_role[]
WHERE role = 'admin' AND NOT ('admin' = ANY(roles));

-- Corrige professor: sincroniza roles com role existente
UPDATE public.profiles
SET roles = ARRAY['professor', 'student']::public.user_role[]
WHERE role = 'professor' AND NOT ('professor' = ANY(roles));

-- Para quem é SOMENTE student, garantir consistência
UPDATE public.profiles
SET roles = ARRAY['student']::public.user_role[]
WHERE role = 'student' AND (roles IS NULL OR array_length(roles, 1) = 0);
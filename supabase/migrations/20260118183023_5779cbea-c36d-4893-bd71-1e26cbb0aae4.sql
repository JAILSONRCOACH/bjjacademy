-- 1) Add roles array column (without breaking existing role column)
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS roles public.user_role[] NOT NULL
DEFAULT ARRAY['student']::public.user_role[];

-- 2) Backfill: copy existing role to roles array
UPDATE public.profiles
SET roles = ARRAY[role]::public.user_role[]
WHERE roles IS NULL OR array_length(roles, 1) IS NULL OR array_length(roles, 1) = 0;

-- 3) Ensure roles array is never empty
ALTER TABLE public.profiles
ADD CONSTRAINT profiles_roles_not_empty
CHECK (array_length(roles, 1) >= 1);

-- 4) Create/update helper function for RLS and app usage
CREATE OR REPLACE FUNCTION public.has_role(user_id uuid, needed public.user_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = user_id
      AND needed = ANY(p.roles)
  );
$$;
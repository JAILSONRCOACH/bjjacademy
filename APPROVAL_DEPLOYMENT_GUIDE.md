# Guia de Deployment - Fluxo de Aprovação de Alunos

## 1. Aplicar Migration SQL

**Ação:** Copie e cole o SQL abaixo no [Editor SQL do Supabase](https://supabase.com/dashboard/project/axjqigkhcyzkqseuzasz/sql/new)

```sql
-- Migration: Add academy_id to registration_invites
-- This allows each registration link to be tied to a specific academy

ALTER TABLE public.registration_invites
ADD COLUMN IF NOT EXISTS academy_id UUID REFERENCES public.academies(id) ON DELETE CASCADE;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_registration_invites_academy_id 
ON public.registration_invites(academy_id);

-- Update existing invites to have academy_id (if needed for migration)
UPDATE public.registration_invites ri
SET academy_id = (
  SELECT p.academy_id 
  FROM public.profiles p
  WHERE p.id = ri.instructor_profile_id
  LIMIT 1
)
WHERE ri.academy_id IS NULL AND ri.instructor_profile_id IS NOT NULL;

COMMENT ON COLUMN public.registration_invites.academy_id IS 'Links registration invite to specific academy for SaaS multi-tenancy';
```

## 2. Edge Functions Deployadas ✅

- ✅ `approve-student-registration`
- ✅ `reject-student-registration`

## 3. Próximos Passos (Frontend)

Após rodar a migration, vou atualizar:
- `AdminRegistrations.tsx` - Adicionar botões Aprovar/Rejeitar
- Integrar chamadas às Edge Functions
- Adicionar modal de confirmação
- Exibir senha temporária gerada

## 4. Como Testar

1. Gere um link de cadastro no Admin
2. Acesse o link público e preencha o form
3. Volte ao Admin → Cadastros Pendentes
4. Clique em "Aprovar"
5. Veja a senha temporária gerada
6. Tente fazer login com as credenciais

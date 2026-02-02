-- =========================
-- 0) ENUMs (cria se não existir)
-- =========================
do $$ begin
  create type public.modality_variant as enum ('gi','nogi','none');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.shift_type as enum ('morning','afternoon','night');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.sex_type as enum ('nao_informado','masculino','feminino');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.registration_source_type as enum ('link','manual');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.registration_status_type as enum ('pending','approved','rejected');
exception when duplicate_object then null;
end $$;

-- =========================
-- 3) INVITE / LINK DE CADASTRO (token) - new table
-- =========================
create table if not exists public.registration_invites (
  id uuid primary key default gen_random_uuid(),
  academy_id uuid not null,
  token text not null unique,
  created_by_profile_id uuid not null,
  modality_id uuid null references public.modalities(id) on delete restrict,
  class_slot_id uuid null references public.class_slots(id) on delete restrict,
  instructor_profile_id uuid null,
  plan_id uuid null,
  next_due_at date null,
  grace_days int not null default 3 check (grace_days between 0 and 30),
  expires_at timestamptz null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists registration_invites_academy_id_idx on public.registration_invites(academy_id);
create index if not exists registration_invites_token_idx on public.registration_invites(token);

-- =========================
-- 5) MATRÍCULA DO ALUNO NA TURMA (quando aprovado)
-- =========================
create table if not exists public.student_enrollments (
  id uuid primary key default gen_random_uuid(),
  academy_id uuid not null,
  student_id uuid not null,
  class_slot_id uuid not null references public.class_slots(id) on delete restrict,
  status text not null default 'active' check (status in ('active','inactive')),
  created_at timestamptz not null default now(),
  constraint student_enrollments_unique unique (academy_id, student_id, class_slot_id)
);

create index if not exists student_enrollments_academy_id_idx on public.student_enrollments(academy_id);
create index if not exists student_enrollments_student_id_idx on public.student_enrollments(student_id);

-- =========================
-- 6) RLS
-- =========================
alter table public.registration_invites enable row level security;
alter table public.student_enrollments enable row level security;

-- INVITES: SELECT público para tokens válidos; escrita só admin
drop policy if exists "invites_select_public_valid" on public.registration_invites;
create policy "invites_select_public_valid"
on public.registration_invites for select
using (
  active = true 
  and (expires_at is null or expires_at > now())
);

drop policy if exists "invites_admin_all" on public.registration_invites;
create policy "invites_admin_all"
on public.registration_invites for all
to authenticated
using (
  academy_id = get_user_academy_id(auth.uid()) 
  and get_user_role(auth.uid()) = 'admin'::user_role
);

-- ENROLLMENTS: SELECT admin e professor (mesma academy); escrita admin
drop policy if exists "enrollments_select" on public.student_enrollments;
create policy "enrollments_select"
on public.student_enrollments for select
to authenticated
using (
  academy_id = get_user_academy_id(auth.uid())
  and get_user_role(auth.uid()) in ('admin'::user_role, 'professor'::user_role)
);

drop policy if exists "enrollments_admin_all" on public.student_enrollments;
create policy "enrollments_admin_all"
on public.student_enrollments for all
to authenticated
using (
  academy_id = get_user_academy_id(auth.uid()) 
  and get_user_role(auth.uid()) = 'admin'::user_role
);

-- Add guardian constraint to student_registrations if not exists
do $$ begin
  alter table public.student_registrations
    add constraint student_registrations_guardian_required
    check (
      (is_minor = false)
      or (guardian_name is not null and guardian_phone is not null)
    );
exception when duplicate_object then null;
end $$;
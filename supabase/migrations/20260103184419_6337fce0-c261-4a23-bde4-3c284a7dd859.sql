-- =========================
-- PLANS (planos de assinatura)
-- =========================
CREATE TABLE IF NOT EXISTS public.plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id uuid NOT NULL REFERENCES public.academies(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  price numeric(12,2) NOT NULL CHECK (price >= 0),
  billing_cycle text NOT NULL DEFAULT 'monthly' CHECK (billing_cycle IN ('weekly', 'monthly', 'quarterly', 'semiannual', 'yearly')),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_plans_academy ON public.plans(academy_id, is_active);
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;

-- Admin can manage plans
CREATE POLICY "plans_admin_all" ON public.plans FOR ALL
USING (academy_id = get_user_academy_id(auth.uid()) AND get_user_role(auth.uid()) = 'admin')
WITH CHECK (academy_id = get_user_academy_id(auth.uid()) AND get_user_role(auth.uid()) = 'admin');

-- All users can view active plans
CREATE POLICY "plans_select_all" ON public.plans FOR SELECT
USING (academy_id = get_user_academy_id(auth.uid()) AND is_active = true);

-- =========================
-- SUBSCRIPTIONS (assinaturas)
-- =========================
DO $$ BEGIN
  CREATE TYPE public.subscription_status AS ENUM ('active', 'canceled', 'paused');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id uuid NOT NULL REFERENCES public.academies(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  plan_id uuid NOT NULL REFERENCES public.plans(id) ON DELETE RESTRICT,
  status public.subscription_status NOT NULL DEFAULT 'active',
  started_at date NOT NULL DEFAULT CURRENT_DATE,
  next_due_at date NOT NULL,
  grace_days integer NOT NULL DEFAULT 3,
  canceled_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_academy ON public.subscriptions(academy_id, status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_student ON public.subscriptions(student_id);
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Admin full access
CREATE POLICY "subscriptions_admin_all" ON public.subscriptions FOR ALL
USING (academy_id = get_user_academy_id(auth.uid()) AND get_user_role(auth.uid()) = 'admin')
WITH CHECK (academy_id = get_user_academy_id(auth.uid()) AND get_user_role(auth.uid()) = 'admin');

-- Students can view their own subscriptions
CREATE POLICY "subscriptions_select_student" ON public.subscriptions FOR SELECT
USING (student_id IN (SELECT id FROM public.students WHERE profile_id = auth.uid()));

-- =========================
-- INVOICES (faturas/mensalidades)
-- =========================
DO $$ BEGIN
  CREATE TYPE public.invoice_status AS ENUM ('open', 'paid', 'overdue', 'canceled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id uuid NOT NULL REFERENCES public.academies(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  subscription_id uuid REFERENCES public.subscriptions(id) ON DELETE SET NULL,
  due_date date NOT NULL,
  amount numeric(12,2) NOT NULL CHECK (amount >= 0),
  status public.invoice_status NOT NULL DEFAULT 'open',
  paid_at timestamptz,
  payment_method text,
  provider_ref text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_invoices_academy_due ON public.invoices(academy_id, due_date, status);
CREATE INDEX IF NOT EXISTS idx_invoices_student ON public.invoices(student_id, due_date);
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- Admin full access
CREATE POLICY "invoices_admin_all" ON public.invoices FOR ALL
USING (academy_id = get_user_academy_id(auth.uid()) AND get_user_role(auth.uid()) = 'admin')
WITH CHECK (academy_id = get_user_academy_id(auth.uid()) AND get_user_role(auth.uid()) = 'admin');

-- Students can view their own invoices
CREATE POLICY "invoices_select_student" ON public.invoices FOR SELECT
USING (student_id IN (SELECT id FROM public.students WHERE profile_id = auth.uid()));

-- =========================
-- EXPENSE CATEGORIES
-- =========================
CREATE TABLE IF NOT EXISTS public.expense_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id uuid NOT NULL REFERENCES public.academies(id) ON DELETE CASCADE,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (academy_id, name)
);

ALTER TABLE public.expense_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "expense_categories_admin" ON public.expense_categories FOR ALL
USING (academy_id = get_user_academy_id(auth.uid()) AND get_user_role(auth.uid()) = 'admin')
WITH CHECK (academy_id = get_user_academy_id(auth.uid()) AND get_user_role(auth.uid()) = 'admin');

-- =========================
-- EXPENSES (despesas)
-- =========================
DO $$ BEGIN
  CREATE TYPE public.expense_type AS ENUM ('fixed', 'variable');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id uuid NOT NULL REFERENCES public.academies(id) ON DELETE CASCADE,
  category_id uuid REFERENCES public.expense_categories(id) ON DELETE SET NULL,
  type public.expense_type NOT NULL DEFAULT 'variable',
  description text NOT NULL,
  amount numeric(12,2) NOT NULL CHECK (amount >= 0),
  due_date date,
  paid_at timestamptz,
  recurring boolean NOT NULL DEFAULT false,
  recurrence_rule text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_expenses_academy_due ON public.expenses(academy_id, due_date);
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "expenses_admin" ON public.expenses FOR ALL
USING (academy_id = get_user_academy_id(auth.uid()) AND get_user_role(auth.uid()) = 'admin')
WITH CHECK (academy_id = get_user_academy_id(auth.uid()) AND get_user_role(auth.uid()) = 'admin');

-- =========================
-- FUNCTION: Create subscription with first invoice
-- =========================
CREATE OR REPLACE FUNCTION public.create_subscription_with_invoice(
  p_student_id uuid,
  p_plan_id uuid,
  p_start_date date DEFAULT CURRENT_DATE,
  p_grace_days integer DEFAULT 3
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_academy_id uuid;
  v_plan RECORD;
  v_subscription_id uuid;
  v_next_due date;
BEGIN
  -- Get academy id
  v_academy_id := get_user_academy_id(auth.uid());
  
  -- Only admin can create subscriptions
  IF get_user_role(auth.uid()) != 'admin' THEN
    RETURN json_build_object('success', false, 'error', 'Permissão negada');
  END IF;
  
  -- Get plan
  SELECT * INTO v_plan FROM public.plans WHERE id = p_plan_id AND academy_id = v_academy_id;
  IF v_plan IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Plano não encontrado');
  END IF;
  
  -- Calculate next due date based on billing cycle
  v_next_due := CASE v_plan.billing_cycle
    WHEN 'weekly' THEN p_start_date + interval '7 days'
    WHEN 'monthly' THEN p_start_date + interval '1 month'
    WHEN 'quarterly' THEN p_start_date + interval '3 months'
    WHEN 'semiannual' THEN p_start_date + interval '6 months'
    WHEN 'yearly' THEN p_start_date + interval '1 year'
    ELSE p_start_date + interval '1 month'
  END;
  
  -- Create subscription
  INSERT INTO public.subscriptions (academy_id, student_id, plan_id, started_at, next_due_at, grace_days)
  VALUES (v_academy_id, p_student_id, p_plan_id, p_start_date, v_next_due, p_grace_days)
  RETURNING id INTO v_subscription_id;
  
  -- Create first invoice
  INSERT INTO public.invoices (academy_id, student_id, subscription_id, due_date, amount, status)
  VALUES (v_academy_id, p_student_id, v_subscription_id, p_start_date, v_plan.price, 'open');
  
  RETURN json_build_object('success', true, 'subscription_id', v_subscription_id);
END;
$$;

-- =========================
-- FUNCTION: Mark invoice as paid and update student status
-- =========================
CREATE OR REPLACE FUNCTION public.mark_invoice_paid(
  p_invoice_id uuid,
  p_method text DEFAULT 'pix'
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invoice RECORD;
  v_academy_id uuid;
BEGIN
  v_academy_id := get_user_academy_id(auth.uid());
  
  IF get_user_role(auth.uid()) != 'admin' THEN
    RETURN json_build_object('success', false, 'error', 'Permissão negada');
  END IF;
  
  -- Get invoice
  SELECT * INTO v_invoice FROM public.invoices WHERE id = p_invoice_id AND academy_id = v_academy_id;
  IF v_invoice IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Fatura não encontrada');
  END IF;
  
  -- Update invoice
  UPDATE public.invoices SET
    status = 'paid',
    paid_at = now(),
    payment_method = p_method
  WHERE id = p_invoice_id;
  
  -- Update student financial status
  UPDATE public.students SET financial_status = 'ok' WHERE id = v_invoice.student_id;
  
  RETURN json_build_object('success', true);
END;
$$;
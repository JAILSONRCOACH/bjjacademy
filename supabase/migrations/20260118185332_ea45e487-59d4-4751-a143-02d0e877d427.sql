-- Enum para status do contrato
CREATE TYPE public.contract_status AS ENUM ('draft', 'sent', 'signed', 'manual_signed', 'void');

-- Enum para método de assinatura
CREATE TYPE public.signature_method AS ENUM ('digital', 'manual');

-- Tabela de templates de contrato
CREATE TABLE public.contract_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id uuid NOT NULL REFERENCES public.academies(id) ON DELETE CASCADE,
  title text NOT NULL,
  version integer NOT NULL DEFAULT 1,
  body_html text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Tabela de contratos (instâncias)
CREATE TABLE public.contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id uuid NOT NULL REFERENCES public.academies(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  template_id uuid NOT NULL REFERENCES public.contract_templates(id),
  status public.contract_status NOT NULL DEFAULT 'draft',
  contract_token text UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  sent_at timestamptz,
  signed_at timestamptz,
  voided_at timestamptz,
  voided_reason text,
  pdf_url text,
  signed_pdf_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Tabela de assinaturas
CREATE TABLE public.contract_signatures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id uuid NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  signer_profile_id uuid REFERENCES public.profiles(id),
  signer_name text NOT NULL,
  signer_document text NOT NULL,
  method public.signature_method NOT NULL DEFAULT 'digital',
  signature_svg text,
  accepted_at timestamptz NOT NULL DEFAULT now(),
  ip_address text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Índices
CREATE INDEX idx_contract_templates_academy ON public.contract_templates(academy_id);
CREATE INDEX idx_contracts_academy ON public.contracts(academy_id);
CREATE INDEX idx_contracts_student ON public.contracts(student_id);
CREATE INDEX idx_contracts_token ON public.contracts(contract_token);
CREATE INDEX idx_contract_signatures_contract ON public.contract_signatures(contract_id);

-- RLS
ALTER TABLE public.contract_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contract_signatures ENABLE ROW LEVEL SECURITY;

-- Policies para contract_templates
CREATE POLICY "Admins can manage contract_templates"
  ON public.contract_templates FOR ALL
  USING (academy_id = get_user_academy_id(auth.uid()) AND get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Users can view active templates"
  ON public.contract_templates FOR SELECT
  USING (academy_id = get_user_academy_id(auth.uid()) AND is_active = true);

-- Policies para contracts
CREATE POLICY "Admins can manage contracts"
  ON public.contracts FOR ALL
  USING (academy_id = get_user_academy_id(auth.uid()) AND get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Students can view their own contracts"
  ON public.contracts FOR SELECT
  USING (student_id IN (SELECT id FROM public.students WHERE profile_id = auth.uid()));

CREATE POLICY "Public can view contract by token"
  ON public.contracts FOR SELECT
  USING (contract_token IS NOT NULL);

CREATE POLICY "Students can update their own contracts to signed"
  ON public.contracts FOR UPDATE
  USING (student_id IN (SELECT id FROM public.students WHERE profile_id = auth.uid()))
  WITH CHECK (status IN ('sent', 'signed'));

-- Policies para contract_signatures
CREATE POLICY "Admins can manage signatures"
  ON public.contract_signatures FOR ALL
  USING (contract_id IN (
    SELECT id FROM public.contracts WHERE academy_id = get_user_academy_id(auth.uid())
  ) AND get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Students can insert their own signature"
  ON public.contract_signatures FOR INSERT
  WITH CHECK (contract_id IN (
    SELECT c.id FROM public.contracts c
    JOIN public.students s ON s.id = c.student_id
    WHERE s.profile_id = auth.uid()
  ));

CREATE POLICY "Students can view their own signatures"
  ON public.contract_signatures FOR SELECT
  USING (contract_id IN (
    SELECT c.id FROM public.contracts c
    JOIN public.students s ON s.id = c.student_id
    WHERE s.profile_id = auth.uid()
  ));

-- Trigger para updated_at
CREATE TRIGGER update_contract_templates_updated_at
  BEFORE UPDATE ON public.contract_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_contracts_updated_at
  BEFORE UPDATE ON public.contracts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
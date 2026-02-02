-- =========================================================
-- INVOICES: CAMPOS ADICIONAIS PARA PIX MERCADO PAGO
-- =========================================================

-- provider_status para tracking separado do status interno
ALTER TABLE public.invoices
ADD COLUMN IF NOT EXISTS provider_status text NOT NULL DEFAULT 'pending';
-- pending | paid | canceled | expired

-- Data de expiração do QR Pix
ALTER TABLE public.invoices
ADD COLUMN IF NOT EXISTS pix_expires_at timestamptz;

-- =========================================================
-- ÍNDICES ÚTEIS
-- =========================================================

CREATE INDEX IF NOT EXISTS idx_invoices_status_due
ON public.invoices(provider_status, due_date);

CREATE UNIQUE INDEX IF NOT EXISTS ux_invoices_provider_payment_id
ON public.invoices(provider_payment_id)
WHERE provider_payment_id IS NOT NULL;
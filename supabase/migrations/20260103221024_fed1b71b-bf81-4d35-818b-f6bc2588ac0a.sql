-- Adicionar campos de periodicidade e forma de pagamento às despesas
ALTER TABLE public.expenses 
ADD COLUMN IF NOT EXISTS recurrence_months INTEGER,
ADD COLUMN IF NOT EXISTS payment_method TEXT;

-- Comentários para documentação
COMMENT ON COLUMN public.expenses.recurrence_months IS 'Periodicidade em meses para despesas recorrentes (1=mensal, 3=trimestral, 6=semestral, 12=anual)';
COMMENT ON COLUMN public.expenses.payment_method IS 'Forma de pagamento utilizada (pix, dinheiro, cartão, boleto, etc.)';
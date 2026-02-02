-- Add suspension columns to students
ALTER TABLE public.students
ADD COLUMN IF NOT EXISTS suspended_reason text,
ADD COLUMN IF NOT EXISTS suspended_at timestamptz;

-- Add payment provider columns to invoices
ALTER TABLE public.invoices
ADD COLUMN IF NOT EXISTS provider text DEFAULT 'mercadopago',
ADD COLUMN IF NOT EXISTS external_reference text,
ADD COLUMN IF NOT EXISTS provider_payment_id text,
ADD COLUMN IF NOT EXISTS checkout_url text,
ADD COLUMN IF NOT EXISTS pix_qr_base64 text,
ADD COLUMN IF NOT EXISTS pix_copiaecola text;

-- Create index for external_reference lookups
CREATE INDEX IF NOT EXISTS idx_invoices_external_reference ON public.invoices(external_reference);

-- Create function to suspend overdue students (called by cron)
CREATE OR REPLACE FUNCTION public.suspend_overdue_students()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_suspended_count integer := 0;
BEGIN
  -- Update students with overdue invoices (3+ days past due)
  UPDATE public.students s
  SET 
    status = 'suspended',
    suspended_reason = 'Inadimplência - fatura vencida há mais de 3 dias',
    suspended_at = now()
  WHERE s.id IN (
    SELECT DISTINCT i.student_id
    FROM public.invoices i
    WHERE i.status IN ('open', 'overdue')
      AND i.due_date < (CURRENT_DATE - interval '3 days')
  )
  AND s.status = 'active';
  
  GET DIAGNOSTICS v_suspended_count = ROW_COUNT;
  
  -- Mark old open invoices as overdue
  UPDATE public.invoices
  SET status = 'overdue'
  WHERE status = 'open'
    AND due_date < CURRENT_DATE;
  
  RETURN json_build_object('suspended_count', v_suspended_count);
END;
$$;

-- Create function to reactivate student when payment is received
CREATE OR REPLACE FUNCTION public.reactivate_student_on_payment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- When invoice is marked as paid
  IF NEW.status = 'paid' AND (OLD.status IS NULL OR OLD.status != 'paid') THEN
    -- Check if student has no other unpaid overdue invoices
    IF NOT EXISTS (
      SELECT 1 FROM public.invoices
      WHERE student_id = NEW.student_id
        AND id != NEW.id
        AND status IN ('open', 'overdue')
        AND due_date < CURRENT_DATE
    ) THEN
      -- Reactivate student
      UPDATE public.students
      SET 
        status = 'active',
        suspended_reason = NULL,
        suspended_at = NULL
      WHERE id = NEW.student_id
        AND status = 'suspended';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for automatic reactivation
DROP TRIGGER IF EXISTS trigger_reactivate_on_payment ON public.invoices;
CREATE TRIGGER trigger_reactivate_on_payment
  AFTER UPDATE ON public.invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.reactivate_student_on_payment();
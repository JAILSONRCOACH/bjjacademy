-- Trigger to automatically unblock student when invoice is paid
CREATE OR REPLACE FUNCTION public.on_invoice_paid()
RETURNS TRIGGER AS $$
BEGIN
  -- Only run if status changed to 'paid'
  IF NEW.status = 'paid' AND (OLD.status IS NULL OR OLD.status != 'paid') THEN
    -- Update student financial status to 'ok'
    UPDATE public.students 
    SET financial_status = 'ok'
    WHERE id = NEW.student_id;
    
    -- Optional: Extend subscription if needed (based on plan logic)
    -- This is complex because we need to know if it's a new month or just a late payment.
    -- For now, just unblocking is the priority.
  END IF;
  return NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists to avoid duplication errors during re-runs
DROP TRIGGER IF EXISTS trigger_on_invoice_paid ON public.invoices;

CREATE TRIGGER trigger_on_invoice_paid
  AFTER UPDATE ON public.invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.on_invoice_paid();

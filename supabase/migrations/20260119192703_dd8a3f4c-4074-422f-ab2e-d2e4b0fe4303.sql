-- Add PIX-specific columns to invoices table
ALTER TABLE public.invoices 
ADD COLUMN IF NOT EXISTS pix_qr_base64 TEXT,
ADD COLUMN IF NOT EXISTS pix_copiaecola TEXT,
ADD COLUMN IF NOT EXISTS pix_expires_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS provider_status TEXT DEFAULT 'pending';

-- Add comment for clarity
COMMENT ON COLUMN public.invoices.pix_qr_base64 IS 'Base64 encoded PIX QR code image';
COMMENT ON COLUMN public.invoices.pix_copiaecola IS 'PIX copy-paste code';
COMMENT ON COLUMN public.invoices.pix_expires_at IS 'PIX expiration timestamp';
COMMENT ON COLUMN public.invoices.provider_status IS 'Payment provider status: pending, paid, canceled, expired';
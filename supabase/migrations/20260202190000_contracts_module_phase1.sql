-- =============================================================================
-- Contracts Module Enhancement Migration
-- Phase 1: Database Schema Updates for Complete Contract Management
-- =============================================================================

-- 1. Add fields to academies table (tenant info for contracts)
-- =============================================================================
ALTER TABLE academies ADD COLUMN IF NOT EXISTS cnpj TEXT;
ALTER TABLE academies ADD COLUMN IF NOT EXISTS razao_social TEXT;
ALTER TABLE academies ADD COLUMN IF NOT EXISTS whatsapp TEXT;
ALTER TABLE academies ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE academies ADD COLUMN IF NOT EXISTS responsible_name TEXT;

-- 2. Add fields to students table
-- =============================================================================
ALTER TABLE students ADD COLUMN IF NOT EXISTS rg TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS address_json JSONB;
-- address_json structure: { street, number, complement, neighborhood, city, state, zip }

-- 3. Add fields to plans table for contract terms
-- =============================================================================
ALTER TABLE plans ADD COLUMN IF NOT EXISTS rules_json JSONB;
ALTER TABLE plans ADD COLUMN IF NOT EXISTS late_fee_percent NUMERIC(5,2) DEFAULT 2.0;
ALTER TABLE plans ADD COLUMN IF NOT EXISTS monthly_interest NUMERIC(5,2) DEFAULT 1.0;
ALTER TABLE plans ADD COLUMN IF NOT EXISTS cancellation_notice_days INTEGER DEFAULT 30;
ALTER TABLE plans ADD COLUMN IF NOT EXISTS enrollment_fee NUMERIC(10,2) DEFAULT 0;

-- 4. Create guardians table (responsible for minors)
-- =============================================================================
CREATE TABLE IF NOT EXISTS guardians (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id UUID NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  cpf TEXT,
  rg TEXT,
  email TEXT,
  phone TEXT,
  relationship TEXT NOT NULL CHECK (relationship IN ('pai', 'mae', 'tutor', 'outro')),
  address_json JSONB,
  is_primary BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for guardians lookup
CREATE INDEX IF NOT EXISTS idx_guardians_student ON guardians(student_id);
CREATE INDEX IF NOT EXISTS idx_guardians_academy ON guardians(academy_id);

-- RLS for guardians
ALTER TABLE guardians ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Guardians tenant isolation" ON guardians;
CREATE POLICY "Guardians tenant isolation" ON guardians
  FOR ALL USING (academy_id = get_user_academy_id(auth.uid()));

-- 5. Add new enum values to contract_status (if not exists)
-- =============================================================================
DO $$
BEGIN
  -- Check if 'viewed' exists, if not add it
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'viewed' AND enumtypid = 'contract_status'::regtype) THEN
    ALTER TYPE contract_status ADD VALUE 'viewed';
  END IF;
  
  -- Check if 'rejected' exists, if not add it
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'rejected' AND enumtypid = 'contract_status'::regtype) THEN
    ALTER TYPE contract_status ADD VALUE 'rejected';
  END IF;
  
  -- Check if 'expired' exists, if not add it
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'expired' AND enumtypid = 'contract_status'::regtype) THEN
    ALTER TYPE contract_status ADD VALUE 'expired';
  END IF;
EXCEPTION
  WHEN undefined_object THEN
    -- contract_status type doesn't exist, that's fine
    NULL;
END $$;

-- 6. Add fields to contracts table
-- =============================================================================
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS snapshot_json JSONB;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS guardian_id UUID REFERENCES guardians(id);
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS is_minor BOOLEAN DEFAULT FALSE;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS subscription_id UUID REFERENCES subscriptions(id);
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS plan_id UUID REFERENCES plans(id);
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS start_date DATE;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES profiles(id);

-- Create index for contract lookups
CREATE INDEX IF NOT EXISTS idx_contracts_expires_at ON contracts(expires_at) WHERE status = 'sent';

-- 7. Create contract_events table (audit trail)
-- =============================================================================
CREATE TABLE IF NOT EXISTS contract_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id UUID NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
  contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('generated', 'sent', 'viewed', 'signed', 'rejected', 'expired', 'voided', 'resent')),
  payload_json JSONB,
  ip_address TEXT,
  user_agent TEXT,
  actor_id UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for contract_events
CREATE INDEX IF NOT EXISTS idx_contract_events_contract ON contract_events(contract_id);
CREATE INDEX IF NOT EXISTS idx_contract_events_academy ON contract_events(academy_id);
CREATE INDEX IF NOT EXISTS idx_contract_events_type ON contract_events(event_type);

-- RLS for contract_events
ALTER TABLE contract_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Contract events tenant isolation" ON contract_events;
CREATE POLICY "Contract events tenant isolation" ON contract_events
  FOR ALL USING (academy_id = get_user_academy_id(auth.uid()));

-- 8. Function to auto-expire contracts after 7 days
-- =============================================================================
CREATE OR REPLACE FUNCTION expire_old_contracts()
RETURNS void AS $$
BEGIN
  UPDATE contracts
  SET status = 'expired',
      updated_at = NOW()
  WHERE status = 'sent'
    AND expires_at IS NOT NULL
    AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Function to log contract events
-- =============================================================================
CREATE OR REPLACE FUNCTION log_contract_event(
  p_contract_id UUID,
  p_event_type TEXT,
  p_payload JSONB DEFAULT NULL,
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_academy_id UUID;
  v_event_id UUID;
BEGIN
  -- Get academy_id from contract
  SELECT academy_id INTO v_academy_id FROM contracts WHERE id = p_contract_id;
  
  IF v_academy_id IS NULL THEN
    RAISE EXCEPTION 'Contract not found: %', p_contract_id;
  END IF;
  
  -- Insert event
  INSERT INTO contract_events (
    academy_id,
    contract_id,
    event_type,
    payload_json,
    ip_address,
    user_agent,
    actor_id
  ) VALUES (
    v_academy_id,
    p_contract_id,
    p_event_type,
    p_payload,
    p_ip_address,
    p_user_agent,
    auth.uid()
  )
  RETURNING id INTO v_event_id;
  
  RETURN v_event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Grant permissions
-- =============================================================================
GRANT ALL ON guardians TO authenticated;
GRANT ALL ON contract_events TO authenticated;
GRANT EXECUTE ON FUNCTION log_contract_event TO authenticated;
GRANT EXECUTE ON FUNCTION expire_old_contracts TO authenticated;

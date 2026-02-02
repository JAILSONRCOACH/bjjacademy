-- =============================================================================
-- Academy Details Enhancement
-- Adds support for CPF (Individual) and Structured Address (JSON) to academies
-- =============================================================================

-- Add CPF column for individual owners
ALTER TABLE academies ADD COLUMN IF NOT EXISTS cpf TEXT;

-- Add structured address column
-- Structure: { street, number, complement, neighborhood, city, state, zip }
ALTER TABLE academies ADD COLUMN IF NOT EXISTS address_json JSONB;

-- Comment on columns
COMMENT ON COLUMN academies.cpf IS 'CPF for individual academy owners';
COMMENT ON COLUMN academies.address_json IS 'Structured address data {street, number, neighborhood, city, state, zip}';

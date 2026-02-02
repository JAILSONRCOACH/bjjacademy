-- Add 'blocked' value to financial_status enum
ALTER TYPE financial_status ADD VALUE IF NOT EXISTS 'blocked';
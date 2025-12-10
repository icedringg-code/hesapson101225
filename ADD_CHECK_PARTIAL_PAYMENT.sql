-- Add check_paid_amount column for partial check payments
-- Run this SQL in your Supabase SQL editor

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'transactions' AND column_name = 'check_paid_amount'
  ) THEN
    ALTER TABLE transactions ADD COLUMN check_paid_amount NUMERIC DEFAULT 0;
  END IF;
END $$;

COMMENT ON COLUMN transactions.check_paid_amount IS 'Amount paid on this check (for partial payments)';

-- Update existing check transactions to have check_paid_amount = 0
UPDATE transactions
SET check_paid_amount = 0
WHERE payment_method = 'Çek'
AND check_paid_amount IS NULL;

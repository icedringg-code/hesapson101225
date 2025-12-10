-- Add check_issuer_company_id column to transactions table
-- This column tracks which employer issued a check payment
-- Used for employer expense tracking with check payments

-- Add the column if it doesn't exist
ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS check_issuer_company_id uuid REFERENCES companies(id);

-- Verify the column was added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'transactions'
  AND column_name = 'check_issuer_company_id';

-- Add parent_check_id column to track check payment relationships
-- This links payment transactions to their parent check transaction

ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS parent_check_id uuid REFERENCES transactions(id);

-- Add check_total_amount to store the total amount of the check
ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS check_total_amount NUMERIC DEFAULT 0;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_transactions_parent_check_id
ON transactions(parent_check_id);

COMMENT ON COLUMN transactions.parent_check_id IS 'References the parent check transaction when this transaction is a payment towards that check';
COMMENT ON COLUMN transactions.check_total_amount IS 'Total amount of the check (stored separately since expense=0 for unpaid checks)';

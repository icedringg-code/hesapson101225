/*
  # Add Currency Type Support to Transactions

  ## Changes
  1. Adds currency_type column to transactions table
     - Type: text with constraint ('gold', 'usd')
     - Default: 'gold' for backward compatibility
     - Not null
  
  2. Adds usd_amount column to transactions table
     - Type: numeric(10, 2)
     - Default: 0
     - Tracks USD amount changes
  
  3. Adds usd_price column to transactions table
     - Type: numeric(10, 4)
     - Default: 0
     - Stores USD exchange rate at transaction time

  ## Description
  This migration enables support for both gold and USD currency types in employer transactions.
  Users can now choose to track changes in USD instead of gold, with the ability to input
  current USD exchange rates.
*/

-- Add currency_type column
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS currency_type text NOT NULL DEFAULT 'gold'
CHECK (currency_type IN ('gold', 'usd'));

-- Add usd_amount column (similar to gold_amount)
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS usd_amount numeric(10, 2) NOT NULL DEFAULT 0;

-- Add usd_price column (similar to gold_price)
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS usd_price numeric(10, 4) NOT NULL DEFAULT 0;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_transactions_currency_type ON transactions(currency_type);

-- Add comment for documentation
COMMENT ON COLUMN transactions.currency_type IS 'Currency type: gold (HAS Altın) or usd (Dolar)';
COMMENT ON COLUMN transactions.usd_amount IS 'USD amount change for employer transactions';
COMMENT ON COLUMN transactions.usd_price IS 'USD exchange rate (TRY) at transaction time';

/*
  # Add Gold Tracking to Transactions

  ## Changes
  
  1. New Columns Added to `transactions` table:
    - `gold_price` (numeric): The price of gold (per gram) at the time of transaction
    - `gold_amount` (numeric): The amount of gold (in grams) involved in the transaction
    
  2. Purpose:
    - Track gold prices for employer transactions
    - Calculate gold equivalent for expenses (harcama) and income (tahsilat)
    - For expenses: gold_amount is positive (gold added to employer's balance)
    - For income: gold_amount is negative (gold deducted from employer's balance)
    
  3. Notes:
    - These fields are optional and only used for employer-related transactions
    - Employee transactions will not use these fields
*/

DO $$
BEGIN
  -- Add gold_price column if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'transactions' AND column_name = 'gold_price'
  ) THEN
    ALTER TABLE transactions ADD COLUMN gold_price numeric DEFAULT 0;
  END IF;

  -- Add gold_amount column if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'transactions' AND column_name = 'gold_amount'
  ) THEN
    ALTER TABLE transactions ADD COLUMN gold_amount numeric DEFAULT 0;
  END IF;
END $$;

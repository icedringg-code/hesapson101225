/*
  # Add Gold and Currency Fields to Transactions

  ## Changes
  
  1. New Columns Added to `transactions` table:
    - `gold_price` (numeric): The price of gold (per gram) or USD rate at the time of transaction
    - `gold_amount` (numeric): The amount of gold (in grams) or USD amount involved in the transaction
    - `payment_method` (text): Payment method used (Nakit, Çek, Havale/EFT, Kredi Kartı)
    - `check_date` (date): Date of check payment if payment method is check
    - `check_payment_status` (text): Status of check payment (Ödendi, Ödenmedi)
    
  2. Purpose:
    - Track gold/USD prices for employer transactions
    - Calculate gold/USD equivalent for expenses and income
    - Track payment methods and check payments
    
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

  -- Add payment_method column if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'transactions' AND column_name = 'payment_method'
  ) THEN
    ALTER TABLE transactions ADD COLUMN payment_method text;
  END IF;

  -- Add check_date column if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'transactions' AND column_name = 'check_date'
  ) THEN
    ALTER TABLE transactions ADD COLUMN check_date date;
  END IF;

  -- Add check_payment_status column if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'transactions' AND column_name = 'check_payment_status'
  ) THEN
    ALTER TABLE transactions ADD COLUMN check_payment_status text;
  END IF;
END $$;

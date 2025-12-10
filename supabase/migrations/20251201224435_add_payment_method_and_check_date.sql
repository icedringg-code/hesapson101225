/*
  # Add payment method and check date to transactions

  1. Changes
    - Add `payment_method` column to `transactions` table (text, nullable)
      - Values: 'Nakit', 'Çek', 'Havale/EFT', 'Kredi Kartı'
    - Add `check_date` column to `transactions` table (date, nullable)
      - Only used when payment_method is 'Çek'
  
  2. Notes
    - Existing transactions will have NULL payment_method
    - Check date is only relevant for check payments
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'transactions' AND column_name = 'payment_method'
  ) THEN
    ALTER TABLE transactions ADD COLUMN payment_method text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'transactions' AND column_name = 'check_date'
  ) THEN
    ALTER TABLE transactions ADD COLUMN check_date date;
  END IF;
END $$;
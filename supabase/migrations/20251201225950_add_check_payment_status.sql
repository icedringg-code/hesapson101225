/*
  # Add check payment status to transactions

  1. Changes
    - Add `check_payment_status` column to `transactions` table (text, nullable)
      - Values: 'Ödendi', 'Ödenmedi'
      - Only used when payment_method is 'Çek'
      - Default: 'Ödenmedi' for check payments
  
  2. Notes
    - This field tracks whether a check has been paid or not
    - Existing check transactions will have NULL status
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'transactions' AND column_name = 'check_payment_status'
  ) THEN
    ALTER TABLE transactions ADD COLUMN check_payment_status text;
  END IF;
END $$;
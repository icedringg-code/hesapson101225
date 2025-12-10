/*
  # Add Currency Type Support to Transactions

  ## Changes
  
  1. New Column Added to `transactions` table:
    - `currency_type` (text): The type of currency used for the transaction
      - Possible values: 'Altın' (Gold) or 'Dolar' (USD)
      - Nullable (null for transactions that don't use currency tracking)
    
  2. Purpose:
    - Allow users to choose between Gold and USD for employer transactions
    - Track different currencies with their respective exchange rates
    - `gold_price` and `gold_amount` fields will now be used generically:
      - When currency_type = 'Altın': gold_price = gram price, gold_amount = grams
      - When currency_type = 'Dolar': gold_price = USD rate, gold_amount = USD amount
    
  3. Notes:
    - This field is optional and only used for employer-related transactions
    - Employee transactions will not use this field (null value)
    - Existing data remains compatible (null currency_type)
*/

DO $$
BEGIN
  -- Add currency_type column if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'transactions' AND column_name = 'currency_type'
  ) THEN
    ALTER TABLE transactions ADD COLUMN currency_type text;
  END IF;
END $$;

/*
  # Add contract_amount to jobs table

  ## Changes
  
  1. New Column Added to `jobs` table:
    - `contract_amount` (numeric): The contract amount for the job in Turkish Lira (TL)
      - Default value: 0
      - Not nullable
    
  2. Purpose:
    - Track the total contract amount for each job
    - Used for financial reporting and budget tracking
*/

DO $$
BEGIN
  -- Add contract_amount column if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'jobs' AND column_name = 'contract_amount'
  ) THEN
    ALTER TABLE jobs ADD COLUMN contract_amount numeric DEFAULT 0 NOT NULL;
  END IF;
END $$;

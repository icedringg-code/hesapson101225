/*
  # Add contract_amount to jobs table

  1. Changes
    - Adds `contract_amount` column to `jobs` table
      - Type: numeric
      - Default: 0
      - Not nullable
      - Stores the total contract amount for each job

  2. Notes
    - Existing jobs will automatically get a default value of 0
    - Users can update this value through the UI
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'jobs' AND column_name = 'contract_amount'
  ) THEN
    ALTER TABLE jobs ADD COLUMN contract_amount numeric DEFAULT 0 NOT NULL;
  END IF;
END $$;

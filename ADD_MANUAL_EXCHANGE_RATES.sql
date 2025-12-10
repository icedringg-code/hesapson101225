-- Manuel Kur Girişi için Transaction Tablosunu Güncelle
-- Bu SQL dosyasını Supabase SQL Editor'de çalıştırın

-- transactions tablosuna manuel kur alanlarını ekle
DO $$
BEGIN
  -- USD kuru ekle
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'transactions' AND column_name = 'usd_rate'
  ) THEN
    ALTER TABLE transactions ADD COLUMN usd_rate decimal(10, 4) DEFAULT NULL;
  END IF;

  -- EUR kuru ekle
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'transactions' AND column_name = 'eur_rate'
  ) THEN
    ALTER TABLE transactions ADD COLUMN eur_rate decimal(10, 4) DEFAULT NULL;
  END IF;

  -- Altın kuru ekle
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'transactions' AND column_name = 'gold_rate'
  ) THEN
    ALTER TABLE transactions ADD COLUMN gold_rate decimal(10, 2) DEFAULT NULL;
  END IF;
END $$;

-- Kontrol için:
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'transactions'
AND column_name IN ('usd_rate', 'eur_rate', 'gold_rate');

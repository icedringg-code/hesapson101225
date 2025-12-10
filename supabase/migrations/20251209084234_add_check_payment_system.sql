/*
  # Çek Ödeme Sistemi

  1. Yeni Kolonlar
    - `payment_method` - Ödeme yöntemi (Nakit, Çek, Havale/EFT, Kredi Kartı)
    - `check_date` - Çek tarihi (sadece çek ödemeleri için)
    - `check_payment_status` - Çek ödeme durumu (Ödendi/Ödenmedi)
    - `parent_check_id` - Ana çek işleminin ID'si (çek ödemelerini bağlamak için)
    - `check_total_amount` - Çekin toplam tutarı
    - `check_paid_amount` - Çek üzerinden ödenen tutar

  2. Önemli Notlar
    - parent_check_id ile transactions tablosuna self-referencing foreign key eklendi
    - **CASCADE DELETE aktif**: Ana çek işlemi silindiğinde, o çeke yapılan tüm ödemeler otomatik silinir
    - Index eklendi: parent_check_id'ye göre hızlı arama için
*/

-- Ödeme yöntemi kolonu
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'transactions' AND column_name = 'payment_method'
  ) THEN
    ALTER TABLE transactions ADD COLUMN payment_method text;
  END IF;
END $$;

-- Çek tarihi kolonu
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'transactions' AND column_name = 'check_date'
  ) THEN
    ALTER TABLE transactions ADD COLUMN check_date date;
  END IF;
END $$;

-- Çek ödeme durumu kolonu
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'transactions' AND column_name = 'check_payment_status'
  ) THEN
    ALTER TABLE transactions ADD COLUMN check_payment_status text;
  END IF;
END $$;

-- Ana çek ID kolonu (CASCADE DELETE ile)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'transactions' AND column_name = 'parent_check_id'
  ) THEN
    ALTER TABLE transactions ADD COLUMN parent_check_id uuid;
  END IF;
END $$;

-- Çek toplam tutarı kolonu
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'transactions' AND column_name = 'check_total_amount'
  ) THEN
    ALTER TABLE transactions ADD COLUMN check_total_amount numeric DEFAULT 0;
  END IF;
END $$;

-- Çek üzerinden ödenen tutar kolonu
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'transactions' AND column_name = 'check_paid_amount'
  ) THEN
    ALTER TABLE transactions ADD COLUMN check_paid_amount numeric DEFAULT 0;
  END IF;
END $$;

-- Foreign key constraint ekle (CASCADE DELETE ile)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'transactions_parent_check_id_fkey'
  ) THEN
    ALTER TABLE transactions 
    ADD CONSTRAINT transactions_parent_check_id_fkey 
    FOREIGN KEY (parent_check_id) 
    REFERENCES transactions(id) 
    ON DELETE CASCADE;
  END IF;
END $$;

-- Index ekle (performans için)
CREATE INDEX IF NOT EXISTS idx_transactions_parent_check_id
ON transactions(parent_check_id);

-- Kolon açıklamaları
COMMENT ON COLUMN transactions.payment_method IS 'Ödeme yöntemi: Nakit, Çek, Havale/EFT, Kredi Kartı';
COMMENT ON COLUMN transactions.check_date IS 'Çek tarihi (sadece çek ödemeleri için)';
COMMENT ON COLUMN transactions.check_payment_status IS 'Çek ödeme durumu: Ödendi, Ödenmedi';
COMMENT ON COLUMN transactions.parent_check_id IS 'Ana çek işleminin ID - CASCADE DELETE aktif';
COMMENT ON COLUMN transactions.check_total_amount IS 'Çekin toplam tutarı';
COMMENT ON COLUMN transactions.check_paid_amount IS 'Çek üzerinden ödenen tutar';

/*
  # Çek Ödeme Sistemi - Tam Kurulum

  1. Yeni Kolonlar
    - `payment_method` - Ödeme yöntemi (Nakit, Çek, Havale/EFT, Kredi Kartı)
    - `check_date` - Çek tarihi (sadece çek ödemeleri için)
    - `check_payment_status` - Çek ödeme durumu (Ödendi/Ödenmedi)
    - `parent_check_id` - Ana çek işleminin ID'si (CASCADE DELETE ile)
    - `check_total_amount` - Çekin toplam tutarı
    - `check_paid_amount` - Çek üzerinden ödenen tutar
    - `check_issuer_company_id` - Çek veren işveren ID'si

  2. Güvenlik
    - CASCADE DELETE aktif: Ana çek işlemi silindiğinde tüm ödemeler otomatik silinir
    - Index eklendi: parent_check_id'ye göre hızlı arama için
*/

-- Ödeme yöntemi kolonu
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS payment_method text;

-- Çek tarihi kolonu
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS check_date date;

-- Çek ödeme durumu kolonu
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS check_payment_status text;

-- Ana çek ID kolonu
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS parent_check_id uuid;

-- Çek toplam tutarı kolonu
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS check_total_amount numeric DEFAULT 0;

-- Çek üzerinden ödenen tutar kolonu
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS check_paid_amount numeric DEFAULT 0;

-- Çek veren işveren ID kolonu
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS check_issuer_company_id uuid;

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

-- Check issuer foreign key (CASCADE SET NULL ile - işveren silinirse null olsun)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'transactions_check_issuer_company_id_fkey'
  ) THEN
    ALTER TABLE transactions 
    ADD CONSTRAINT transactions_check_issuer_company_id_fkey 
    FOREIGN KEY (check_issuer_company_id) 
    REFERENCES companies(id) 
    ON DELETE SET NULL;
  END IF;
END $$;

-- Index ekle (performans için)
CREATE INDEX IF NOT EXISTS idx_transactions_parent_check_id
ON transactions(parent_check_id);

CREATE INDEX IF NOT EXISTS idx_transactions_check_issuer_company_id
ON transactions(check_issuer_company_id);

-- Kolon açıklamaları
COMMENT ON COLUMN transactions.payment_method IS 'Ödeme yöntemi: Nakit, Çek, Havale/EFT, Kredi Kartı';
COMMENT ON COLUMN transactions.check_date IS 'Çek tarihi (sadece çek ödemeleri için)';
COMMENT ON COLUMN transactions.check_payment_status IS 'Çek ödeme durumu: Ödendi, Ödenmedi';
COMMENT ON COLUMN transactions.parent_check_id IS 'Ana çek işleminin ID - CASCADE DELETE aktif';
COMMENT ON COLUMN transactions.check_total_amount IS 'Çekin toplam tutarı';
COMMENT ON COLUMN transactions.check_paid_amount IS 'Çek üzerinden ödenen tutar';
COMMENT ON COLUMN transactions.check_issuer_company_id IS 'Çek veren işveren ID';

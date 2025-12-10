/*
  # Eksik Transaction Kolonlarını Ekle

  1. Yeni Kolonlar
    - `currency_type` - Para birimi (TL, USD, EUR, ALTIN)
    - `gold_price` - Altın fiyatı (gram başına)
    - `gold_amount` - Altın miktarı (gram)
    - `usd_rate` - İşlem anındaki USD kuru
    - `eur_rate` - İşlem anındaki EUR kuru
    - `gold_rate` - İşlem anındaki altın kuru
    - `is_job_payment` - İş ödemesi mi (işverenden tahsilat için)

  2. Notlar
    - Mevcut veriler korunur
    - Tüm kolonlar NULL değer alabilir
    - Geriye uyumlu yapı
*/

-- Para birimi kolonu
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS currency_type text;

-- Altın fiyatı kolonu
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS gold_price numeric DEFAULT 0;

-- Altın miktarı kolonu
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS gold_amount numeric DEFAULT 0;

-- USD kuru kolonu
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS usd_rate numeric;

-- EUR kuru kolonu
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS eur_rate numeric;

-- Altın kuru kolonu
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS gold_rate numeric;

-- İş ödemesi mi kolonu
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS is_job_payment boolean DEFAULT false;

-- Kolon açıklamaları
COMMENT ON COLUMN transactions.currency_type IS 'Para birimi: TL, USD, EUR, ALTIN';
COMMENT ON COLUMN transactions.gold_price IS 'Altın fiyatı (gram başına)';
COMMENT ON COLUMN transactions.gold_amount IS 'Altın miktarı (gram)';
COMMENT ON COLUMN transactions.usd_rate IS 'İşlem anındaki USD kuru';
COMMENT ON COLUMN transactions.eur_rate IS 'İşlem anındaki EUR kuru';
COMMENT ON COLUMN transactions.gold_rate IS 'İşlem anındaki altın kuru';
COMMENT ON COLUMN transactions.is_job_payment IS 'İş ödemesi mi (işverenden tahsilat)';

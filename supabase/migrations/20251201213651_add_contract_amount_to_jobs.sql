/*
  # İşlere Sözleşme Tutarı Ekleme

  1. Değişiklikler
    - `jobs` tablosuna `contract_amount` kolonu ekleniyor
    - Bu kolon işin alındığı toplam tutarı temsil eder
    - Varsayılan değer 0
    - NULL değer alabilir
  
  2. Notlar
    - Mevcut işlere otomatik olarak 0 değeri atanır
    - Kullanıcılar bu değeri düzenleyebilir
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'jobs' AND column_name = 'contract_amount'
  ) THEN
    ALTER TABLE jobs ADD COLUMN contract_amount numeric DEFAULT 0;
  END IF;
END $$;
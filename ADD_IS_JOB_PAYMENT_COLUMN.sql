-- İşin Ödemesi Kolonu Ekle
-- Bu SQL'i Supabase SQL Editor'da çalıştırın

-- transactions tablosuna is_job_payment kolonu ekle
ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS is_job_payment boolean DEFAULT false;

-- Açıklama:
-- Bu kolon, işveren gelirinin işin toplam gelirine dahil edilip edilmeyeceğini belirler
-- Varsayılan değer false (işin ödemesi değil)
-- İşveren geliri eklerken kullanıcı bunu işaretleyebilir

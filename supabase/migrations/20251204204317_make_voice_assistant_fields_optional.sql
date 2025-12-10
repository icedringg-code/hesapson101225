/*
  # Sesli Asistan için Zorunlu Alanları Opsiyonel Yap
  
  1. Değişiklikler
    - companies.job_id opsiyonel yap (sesli komutla genel firma eklenebilsin)
    - transactions.job_id opsiyonel yap (genel işlem eklenebilsin)
    - transactions.company_id opsiyonel yap (firma belirtilmeden işlem eklenebilsin)
  
  2. Notlar
    - Sesli asistan ile eklenen kayıtlar önce iş/firma olmadan eklenir
    - Sonrasında kullanıcı bunları manuel olarak işlere atayabilir
*/

-- Companies job_id'yi opsiyonel yap
ALTER TABLE companies 
  ALTER COLUMN job_id DROP NOT NULL;

-- Transactions job_id'yi opsiyonel yap
ALTER TABLE transactions 
  ALTER COLUMN job_id DROP NOT NULL;

-- Transactions company_id'yi opsiyonel yap  
ALTER TABLE transactions 
  ALTER COLUMN company_id DROP NOT NULL;
/*
  # Çek Ödeme Cascade Update Trigger
  
  1. Yeni Fonksiyon ve Trigger
    - Ana çek işlemi düzenlendiğinde alt çek ödemelerini otomatik güncelle
    - Güncellenen alanlar:
      * check_total_amount - Ana işlemin tutarı değişirse
      * check_date - Ana işlemin tarihi değişirse  
      * check_issuer_company_id - Ana işlemin şirketi değişirse
  
  2. Çalışma Mantığı
    - Ana işlem güncellendiğinde trigger tetiklenir
    - Tüm bağlı alt işlemler (parent_check_id eşleşenler) güncellenir
    - CASCADE DELETE zaten mevcut, silme işlemi için ayrı trigger gereksiz
  
  3. Güvenlik
    - Sadece ilgili alanlar güncellenir
    - Alt işlemlerin kendi tutarları (income/expense) korunur
    - Infinite loop önlenir (NEW ve OLD karşılaştırılır)
*/

-- Trigger fonksiyonu oluştur
CREATE OR REPLACE FUNCTION update_child_check_payments()
RETURNS TRIGGER AS $$
BEGIN
  -- Eğer bu işlemin kendisi bir parent check ise ve önemli alanları değiştiyse
  IF NEW.id IS NOT NULL AND (
    OLD.amount != NEW.amount OR 
    OLD.income != NEW.income OR
    OLD.expense != NEW.expense OR
    OLD.date != NEW.date OR
    OLD.company_id != NEW.company_id
  ) THEN
    
    -- Bu işlemi parent olarak kullanan tüm child işlemleri güncelle
    UPDATE transactions
    SET 
      check_total_amount = GREATEST(NEW.income, NEW.expense),
      check_date = NEW.date::date,
      check_issuer_company_id = NEW.company_id,
      updated_at = now()
    WHERE 
      parent_check_id = NEW.id
      AND id != NEW.id; -- Kendini güncelleme (infinite loop önleme)
      
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger oluştur
DROP TRIGGER IF EXISTS trigger_update_child_check_payments ON transactions;

CREATE TRIGGER trigger_update_child_check_payments
  AFTER UPDATE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_child_check_payments();

-- Trigger açıklaması
COMMENT ON FUNCTION update_child_check_payments() IS 
'Ana çek işlemi güncellendiğinde, bağlı tüm alt çek ödemelerinin bilgilerini otomatik günceller';

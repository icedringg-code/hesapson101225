import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ywkjahjpmcvbygmpbvrr.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl3a2phaGpwbWN2YnlnbXBidnJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ5MTYyNTQsImV4cCI6MjA4MDQ5MjI1NH0.b0CyNxBMHbZeivT7sQpBOtRFiSW4fJ_DVcUp4blm1IY';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function createTable() {
  console.log('Exchange rates tablosu oluşturuluyor...\n');

  // Tablonun var olup olmadığını kontrol et
  const { data: tables, error: checkError } = await supabase
    .from('exchange_rates')
    .select('id')
    .limit(1);

  if (!checkError) {
    console.log('✅ Exchange rates tablosu zaten mevcut!');
    console.log('Tablo başarıyla bağlandı ve kullanıma hazır.\n');
    return;
  }

  console.log('Tablo bulunamadı, oluşturma için SQL komutlarını gösteriyorum:\n');
  console.log('='.repeat(80));
  console.log(`
ADIM 1: Supabase Dashboard'a gidin:
https://supabase.com/dashboard/project/ywkjahjpmcvbygmpbvrr/editor

ADIM 2: Sol menüden "SQL Editor" seçin

ADIM 3: Aşağıdaki SQL'i kopyalayıp çalıştırın:

-- Exchange Rates Tablosu
CREATE TABLE IF NOT EXISTS exchange_rates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date UNIQUE NOT NULL,
  usd_buy numeric(10, 4) DEFAULT 0,
  usd_sell numeric(10, 4) DEFAULT 0,
  eur_buy numeric(10, 4) DEFAULT 0,
  eur_sell numeric(10, 4) DEFAULT 0,
  gold_buy numeric(10, 4) DEFAULT 0,
  gold_sell numeric(10, 4) DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- RLS Aktif
ALTER TABLE exchange_rates ENABLE ROW LEVEL SECURITY;

-- Okuma Yetkisi
CREATE POLICY "Authenticated users can read exchange rates"
  ON exchange_rates FOR SELECT TO authenticated USING (true);

-- Ekleme Yetkisi
CREATE POLICY "Authenticated users can insert exchange rates"
  ON exchange_rates FOR INSERT TO authenticated WITH CHECK (true);

-- Güncelleme Yetkisi
CREATE POLICY "Authenticated users can update exchange rates"
  ON exchange_rates FOR UPDATE TO authenticated USING (true);

-- Index
CREATE INDEX idx_exchange_rates_date ON exchange_rates(date DESC);
`);
  console.log('='.repeat(80));
  console.log('\nADIM 4: "RUN" butonuna tıklayın\n');
  console.log('Tablo oluşturulduktan sonra altın ve dolar kurları otomatik çekilmeye başlayacak!\n');
}

createTable();

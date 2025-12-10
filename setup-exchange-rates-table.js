import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ywkjahjpmcvbygmpbvrr.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl3a2phaGpwbWN2YnlnbXBidnJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ5MTYyNTQsImV4cCI6MjA4MDQ5MjI1NH0.b0CyNxBMHbZeivT7sQpBOtRFiSW4fJ_DVcUp4blm1IY';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function setupExchangeRatesTable() {
  console.log('Exchange rates tablosu oluşturuluyor...');

  const sql = `
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

    ALTER TABLE exchange_rates ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Authenticated users can read exchange rates" ON exchange_rates;
    CREATE POLICY "Authenticated users can read exchange rates"
      ON exchange_rates
      FOR SELECT
      TO authenticated
      USING (true);

    DROP POLICY IF EXISTS "Authenticated users can insert exchange rates" ON exchange_rates;
    CREATE POLICY "Authenticated users can insert exchange rates"
      ON exchange_rates
      FOR INSERT
      TO authenticated
      WITH CHECK (true);

    DROP POLICY IF EXISTS "Authenticated users can update exchange rates" ON exchange_rates;
    CREATE POLICY "Authenticated users can update exchange rates"
      ON exchange_rates
      FOR UPDATE
      TO authenticated
      USING (true);

    CREATE INDEX IF NOT EXISTS idx_exchange_rates_date ON exchange_rates(date DESC);
  `;

  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
      console.error('Hata:', error);
      return;
    }

    console.log('✅ Exchange rates tablosu başarıyla oluşturuldu!');
    console.log('Tablo verileri:', data);
  } catch (err) {
    console.error('Beklenmeyen hata:', err);
  }
}

setupExchangeRatesTable();

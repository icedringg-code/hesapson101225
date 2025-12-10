-- Exchange Rates Table Migration
-- Bu dosyayı Supabase SQL Editor'de çalıştırın

-- Tabloyu oluştur
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

-- RLS'yi aktif et
ALTER TABLE exchange_rates ENABLE ROW LEVEL SECURITY;

-- Authenticated kullanıcılar okuyabilir
DROP POLICY IF EXISTS "Authenticated users can read exchange rates" ON exchange_rates;
CREATE POLICY "Authenticated users can read exchange rates"
  ON exchange_rates
  FOR SELECT
  TO authenticated
  USING (true);

-- Service role ekleyebilir
DROP POLICY IF EXISTS "Service role can insert exchange rates" ON exchange_rates;
CREATE POLICY "Service role can insert exchange rates"
  ON exchange_rates
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Service role güncelleyebilir
DROP POLICY IF EXISTS "Service role can update exchange rates" ON exchange_rates;
CREATE POLICY "Service role can update exchange rates"
  ON exchange_rates
  FOR UPDATE
  TO service_role
  USING (true);

-- Tarih index'i
CREATE INDEX IF NOT EXISTS idx_exchange_rates_date ON exchange_rates(date DESC);

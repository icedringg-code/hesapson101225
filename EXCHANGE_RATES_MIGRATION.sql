/*
  # Exchange Rates Table Migration

  Bu SQL dosyasını Supabase SQL Editor'de çalıştırın.

  1. New Tables
    - `exchange_rates`
      - `id` (uuid, primary key)
      - `date` (date, unique) - Döviz kurunun tarihi
      - `usd_buy` (numeric) - USD alış kuru
      - `usd_sell` (numeric) - USD satış kuru
      - `eur_buy` (numeric) - EUR alış kuru
      - `eur_sell` (numeric) - EUR satış kuru
      - `gold_buy` (numeric) - Altın alış fiyatı (gram)
      - `gold_sell` (numeric) - Altın satış fiyatı (gram)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - RLS aktif
    - Authenticated kullanıcılar kurları okuyabilir
    - Sadece service role ekleyebilir/güncelleyebilir

  3. Indexes
    - Tarihe göre hızlı arama için index
*/

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
CREATE POLICY "Authenticated users can read exchange rates"
  ON exchange_rates
  FOR SELECT
  TO authenticated
  USING (true);

-- Service role ekleyebilir
CREATE POLICY "Service role can insert exchange rates"
  ON exchange_rates
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Service role güncelleyebilir
CREATE POLICY "Service role can update exchange rates"
  ON exchange_rates
  FOR UPDATE
  TO service_role
  USING (true);

-- Tarih index'i
CREATE INDEX IF NOT EXISTS idx_exchange_rates_date ON exchange_rates(date DESC);

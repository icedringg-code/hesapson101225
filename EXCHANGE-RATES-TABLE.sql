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

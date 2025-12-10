# 🚀 HIZLI DEPLOYMENT

## 1️⃣ VPS'e Deploy Et (Tek Komut)

Terminal'de şu komutu çalıştır:

```bash
./vps-complete-deploy.sh
```

Şifre sorduğunda: **şifre00203549Rk..**

---

## 2️⃣ Veritabanını Hazırla (ÖNEMLİ!)

### Adım 1: Supabase Dashboard'a Git
https://supabase.com/dashboard

### Adım 2: SQL Editor'ü Aç
Projenizi seçin → Sol menüden "SQL Editor"

### Adım 3: SQL'i Çalıştır
`setup-exchange-rates.sql` dosyasını aç, içeriğini kopyala ve SQL Editor'e yapıştır.

Veya aşağıdaki SQL'i direkt kopyala-yapıştır:

```sql
-- Exchange Rates Table
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
  ON exchange_rates FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Service role can insert exchange rates" ON exchange_rates;
CREATE POLICY "Service role can insert exchange rates"
  ON exchange_rates FOR INSERT TO service_role WITH CHECK (true);

DROP POLICY IF EXISTS "Service role can update exchange rates" ON exchange_rates;
CREATE POLICY "Service role can update exchange rates"
  ON exchange_rates FOR UPDATE TO service_role USING (true);

CREATE INDEX IF NOT EXISTS idx_exchange_rates_date ON exchange_rates(date DESC);
```

### Adım 4: Run'a Bas
Yeşil "Run" butonuna tıkla.

---

## 3️⃣ Test Et

1. Tarayıcıda aç: **https://syncarch.xyz**
2. Giriş yap
3. İşlem eklerken kur otomatik çekilecek

---

## ✅ TAMAM!

Sistem hazır. Exchange rate'ler artık otomatik çekilecek.

---

## 🔄 Güncelleme Yapmak İsterseniz

Değişiklik yaptıktan sonra:

```bash
npm run build
./vps-complete-deploy.sh
```

---

## 🛠️ Sorun Giderme

### VPS'te Kontrol

```bash
ssh root@31.97.78.86
pm2 logs syncarch
```

### Logları İzle

```bash
ssh root@31.97.78.86
pm2 logs syncarch --lines 100
```

---

## 📝 Detaylı Bilgi

Daha fazla bilgi için: **VPS-DEPLOYMENT-GUIDE.md**

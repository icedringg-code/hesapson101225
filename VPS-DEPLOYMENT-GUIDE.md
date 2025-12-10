# SyncArch VPS Deployment Guide

## VPS Bilgileri
- **IP:** 31.97.78.86
- **Domain:** syncarch.xyz
- **SSH User:** root
- **İşletim Sistemi:** Ubuntu 24.04

---

## Hızlı Kurulum (Tek Komut)

```bash
./vps-complete-deploy.sh
```

Bu script otomatik olarak:
1. ✅ Production build oluşturur
2. ✅ VPS'e yükler
3. ✅ Nginx yapılandırır
4. ✅ SSL sertifikası kurar
5. ✅ PM2 ile uygulamayı başlatır

---

## Manuel Adımlar

### 1. Veritabanı Kurulumu (ÖNEMLİ - İLK ADIM)

Deployment öncesi veya sonrası Supabase'de exchange_rates tablosunu oluştur:

1. https://supabase.com/dashboard adresine git
2. Projenizi seçin (ywkjahjpmcvbygmpbvrr)
3. SQL Editor'e tıklayın
4. `setup-exchange-rates.sql` dosyasının içeriğini yapıştır ve çalıştır

```sql
-- Exchange Rates Table Migration
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

-- Policies
DROP POLICY IF EXISTS "Authenticated users can read exchange rates" ON exchange_rates;
CREATE POLICY "Authenticated users can read exchange rates"
  ON exchange_rates FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Service role can insert exchange rates" ON exchange_rates;
CREATE POLICY "Service role can insert exchange rates"
  ON exchange_rates FOR INSERT TO service_role WITH CHECK (true);

DROP POLICY IF EXISTS "Service role can update exchange rates" ON exchange_rates;
CREATE POLICY "Service role can update exchange rates"
  ON exchange_rates FOR UPDATE TO service_role USING (true);

-- Index
CREATE INDEX IF NOT EXISTS idx_exchange_rates_date ON exchange_rates(date DESC);
```

### 2. Deployment Sonrası Kontrol

SSH ile VPS'e bağlan:
```bash
ssh root@31.97.78.86
```

Uygulama durumunu kontrol et:
```bash
pm2 status
pm2 logs syncarch
```

Nginx durumunu kontrol et:
```bash
systemctl status nginx
nginx -t
```

### 3. SSL Sertifikası Kontrolü

SSL otomatik kurulur, ancak sorun varsa:
```bash
certbot --nginx -d syncarch.xyz -d www.syncarch.xyz
```

---

## Uygulama Yönetimi

### PM2 Komutları

```bash
# Durum kontrolü
pm2 status

# Logları görüntüle
pm2 logs syncarch

# Son 100 satır log
pm2 logs syncarch --lines 100

# Uygulamayı yeniden başlat
pm2 restart syncarch

# Uygulamayı durdur
pm2 stop syncarch

# Uygulamayı başlat
pm2 start syncarch

# Uygulamayı sil
pm2 delete syncarch
```

### Nginx Komutları

```bash
# Nginx durumu
systemctl status nginx

# Nginx yeniden yükle
systemctl reload nginx

# Nginx yeniden başlat
systemctl restart nginx

# Nginx yapılandırma test
nginx -t

# Nginx logları
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

---

## Güncelleme Yapmak

Değişiklik yaptıktan sonra:

```bash
# Local'de build al
npm run build

# Deploy script'i çalıştır
./vps-complete-deploy.sh
```

Script otomatik olarak:
- Yeni dosyaları yükler
- Dependencies günceller
- PM2 ile restart eder
- Nginx reload eder

---

## Özellikler

### ✅ Kurulmuş Özellikler

1. **SSL/HTTPS:** Let's Encrypt sertifikası
2. **Auto-Redirect:** HTTP → HTTPS yönlendirme
3. **Process Manager:** PM2 ile auto-restart
4. **Nginx Reverse Proxy:** API istekleri için
5. **Gzip Compression:** Hızlı yükleme
6. **Cache Headers:** Static dosyalar için
7. **Security Headers:** XSS, Clickjacking koruması

### 📊 Performans

- Node.js max heap: 2048 MB
- Gzip compression aktif
- Static dosya cache: 1 yıl
- API timeout: 10 dakika

---

## Sorun Giderme

### Uygulama Çalışmıyor

```bash
# PM2 loglarını kontrol et
pm2 logs syncarch --err

# Uygulamayı yeniden başlat
pm2 restart syncarch

# Port kontrolü
netstat -tulpn | grep 3001
```

### Nginx Hatası

```bash
# Nginx loglarını kontrol et
tail -100 /var/log/nginx/error.log

# Yapılandırma test et
nginx -t

# Nginx yeniden başlat
systemctl restart nginx
```

### SSL Sorunu

```bash
# Sertifika durumunu kontrol et
certbot certificates

# Sertifikayı yenile
certbot renew --dry-run
```

### Database Bağlantı Hatası

1. `.env` dosyasını kontrol et:
   ```bash
   cat /var/www/syncarch/.env
   ```

2. Supabase credentials doğru mu kontrol et

3. Supabase dashboard'da RLS policies kontrol et

---

## Sistem Gereksinimleri

### VPS'de Kurulu Olması Gerekenler

- ✅ Node.js (v18+)
- ✅ npm
- ✅ PM2
- ✅ Nginx
- ✅ Certbot
- ✅ Git (opsiyonel)

### Kurulum (Gerekirse)

```bash
# Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs

# PM2
npm install -g pm2

# Nginx
apt-get install -y nginx

# Certbot
apt-get install -y certbot python3-certbot-nginx
```

---

## URL'ler

- **Production:** https://syncarch.xyz
- **API Endpoint:** https://syncarch.xyz/api
- **Supabase:** https://ywkjahjpmcvbygmpbvrr.supabase.co

---

## Environment Variables

`.env.production` dosyası:
```env
VITE_SUPABASE_URL=https://ywkjahjpmcvbygmpbvrr.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
VITE_API_URL=https://syncarch.xyz
PORT=3001
```

---

## Destek

Sorun yaşarsanız:
1. PM2 loglarını kontrol edin: `pm2 logs syncarch`
2. Nginx loglarını kontrol edin: `tail -f /var/log/nginx/error.log`
3. Server sistem loglarını kontrol edin: `journalctl -xe`

---

## Versiyon Notları

### v1.2.0 - Son Versiyon
- ✅ Exchange rates otomatik çekme
- ✅ Sesli asistan desteği
- ✅ PWA desteği
- ✅ Excel import/export
- ✅ Çoklu para birimi desteği
- ✅ Altın takibi
- ✅ Çek/Senet takibi
- ✅ Mobil responsive tasarım

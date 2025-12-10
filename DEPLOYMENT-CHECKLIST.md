# ✅ SyncArch VPS Deployment Checklist

## 🚀 Tek Komut Deployment

```bash
./deploy-final.sh
```

**Şifre:** `şifre00203549Rk..`

---

## 📋 Deployment Adımları

### ✅ Otomatik Yapılanlar (Script)

- [x] Production build
- [x] Deployment paketi oluşturma
- [x] VPS'e yükleme
- [x] Dependencies kurulumu
- [x] PM2 yapılandırma
- [x] Nginx yapılandırma
- [x] SSL kurulumu (varsa)
- [x] Health check

### ⚠️ Manuel Yapılacak (Supabase)

**ÖNEMLİ:** Script çalıştıktan sonra mutlaka yapın!

1. **Supabase'e Git**
   - https://supabase.com/dashboard
   - Projenizi seçin: `ywkjahjpmcvbygmpbvrr`

2. **SQL Editor'ü Aç**
   - Sol menüden "SQL Editor"

3. **SQL'i Çalıştır**
   ```sql
   -- setup-exchange-rates.sql içeriği
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
     ON exchange_rates FOR UPDATE TO service_role USING (true) WITH CHECK (true);

   CREATE INDEX IF NOT EXISTS idx_exchange_rates_date ON exchange_rates(date DESC);
   ```

4. **Run'a Bas**
   - Yeşil "Run" butonu

---

## 🧪 Test Adımları

### 1. Deployment Sonrası

Script otomatik test yapar:
- ✅ PM2 durumu
- ✅ Port 3001 dinleme
- ✅ API health check

### 2. Manuel Test

**VPS'te:**
```bash
ssh root@31.97.78.86
pm2 logs syncarch --lines 50
```

**Tarayıcıda:**
1. https://syncarch.xyz → Ana sayfa yüklenmeli
2. Giriş yapın
3. Yeni işlem ekleyin → Kur otomatik çekilmeli

---

## 📊 VPS Kontrol Komutları

### PM2 Yönetimi
```bash
pm2 status              # Durum
pm2 logs syncarch       # Canlı loglar
pm2 logs syncarch -n 100  # Son 100 satır
pm2 restart syncarch    # Yeniden başlat
pm2 stop syncarch       # Durdur
pm2 start syncarch      # Başlat
pm2 delete syncarch     # Sil
pm2 monit              # Monitoring UI
```

### Nginx Kontrol
```bash
systemctl status nginx  # Durum
nginx -t               # Config test
systemctl reload nginx # Reload
tail -f /var/log/nginx/error.log  # Hata logları
tail -f /var/log/nginx/access.log # Erişim logları
```

### SSL Kontrol
```bash
certbot certificates   # Sertifika bilgisi
certbot renew --dry-run # Yenileme testi
```

### Sistem Kontrol
```bash
df -h                  # Disk kullanımı
free -h                # RAM kullanımı
top                    # Process monitörü
netstat -tulpn | grep 3001  # Port kontrolü
```

---

## 🔧 Sorun Giderme

### Problem: Uygulama çalışmıyor

**Çözüm:**
```bash
ssh root@31.97.78.86
pm2 logs syncarch --err
pm2 restart syncarch
```

### Problem: Nginx hatası

**Çözüm:**
```bash
nginx -t
tail -100 /var/log/nginx/error.log
systemctl restart nginx
```

### Problem: SSL hatası

**Çözüm:**
```bash
certbot certificates
certbot renew --force-renewal
```

### Problem: Kur çekilmiyor

**Çözüm:**
1. Supabase'de `exchange_rates` tablosunu kontrol et
2. RLS policies kontrol et
3. PM2 loglarını kontrol et

---

## 🔄 Güncelleme Yapmak

Değişiklik yaptıktan sonra:

```bash
npm run build
./deploy-final.sh
```

---

## 📁 Kritik Dosyalar

### VPS'te Dosya Konumları

```
/var/www/syncarch/
├── index.html              # Ana sayfa
├── assets/                 # JS/CSS
├── server/                 # Backend
│   └── index.js           # API server
├── .env                    # Environment variables
├── package.json            # Dependencies
└── node_modules/          # Packages
```

### Nginx Config
```
/etc/nginx/sites-available/syncarch
/etc/nginx/sites-enabled/syncarch
```

### SSL Sertifikaları
```
/etc/letsencrypt/live/syncarch.xyz/fullchain.pem
/etc/letsencrypt/live/syncarch.xyz/privkey.pem
```

### PM2 Config
```
~/.pm2/logs/syncarch-out.log
~/.pm2/logs/syncarch-error.log
```

---

## 🎯 Deployment Özeti

| Özellik | Durum |
|---------|-------|
| **Domain** | syncarch.xyz |
| **SSL** | ✅ Let's Encrypt |
| **Server** | Node.js + Express |
| **Database** | Supabase PostgreSQL |
| **Process Manager** | PM2 |
| **Web Server** | Nginx |
| **Auto Restart** | ✅ PM2 Startup |
| **Auto SSL Renew** | ✅ Certbot Cron |

---

## 🎉 Başarı Kriterleri

✅ https://syncarch.xyz açılıyor
✅ SSL sertifikası aktif
✅ Login çalışıyor
✅ İşlem eklenebiliyor
✅ Kur otomatik çekiliyor
✅ PWA kurulumu çalışıyor
✅ Mobil responsive
✅ Sesli asistan aktif

---

## 📞 Hızlı Erişim

- **Production:** https://syncarch.xyz
- **Supabase:** https://supabase.com/dashboard
- **VPS SSH:** `ssh root@31.97.78.86`

---

## ⚡ Hızlı Komutlar

```bash
# Deploy
./deploy-final.sh

# VPS'e bağlan
ssh root@31.97.78.86

# Logları izle
ssh root@31.97.78.86 "pm2 logs syncarch"

# Restart
ssh root@31.97.78.86 "pm2 restart syncarch"

# Health check
curl https://syncarch.xyz/api/health
```

---

**NOT:** Deploy script interaktif çalışır ve şifre ister. Tüm adımlar otomatiktir.

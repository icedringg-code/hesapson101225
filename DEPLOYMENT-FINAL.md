# 🚀 SyncArch VPS - Final Deployment

## ✅ Hazır Olan Her Şey

- ✅ Production build tamamlandı
- ✅ Deployment paketi oluşturuldu (492KB)
- ✅ SSH deployment key oluşturuldu
- ✅ Otomatik deployment scriptleri hazır
- ✅ Nginx konfigürasyonu hazır
- ✅ PM2 konfigürasyonu hazır
- ✅ Supabase migration hazır

## ⚡ TEK ADIMDA DEPLOYMENT

### Seçenek 1: SSH Key ile Otomatik (ÖNERİLEN)

**Adım 1:** VPS'e şu public key'i ekle:

```bash
ssh root@31.97.78.86
# Şifre: şifre00203549Rk..

# Sonra:
mkdir -p ~/.ssh
echo "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIGgfM8ZXEOEiavTVB1qWqu2/gOy6qb4YmFsB484kvmDQ deployment@syncarch" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
exit
```

**Adım 2:** Otomatik deployment:

```bash
./auto-deploy-with-key.sh
```

✅ TAMAM! 2 dakikada tamamlanır.

---

### Seçenek 2: Manuel Tek Komut (SSH Key İstemiyorsan)

```bash
# 1. Paketi yükle (kendi bilgisayarından)
scp syncarch-deploy.tar.gz root@31.97.78.86:/tmp/

# 2. VPS'e bağlan
ssh root@31.97.78.86

# 3. Bu komutu kopyala-yapıştır:
cd /tmp && \
mkdir -p /var/www/syncarch && \
cd /var/www/syncarch && \
tar -xzf /tmp/syncarch-deploy.tar.gz && \
rm /tmp/syncarch-deploy.tar.gz && \
npm install --production && \
pm2 delete syncarch 2>/dev/null || true && \
pm2 start server/index.js --name syncarch --time && \
pm2 save && \
pm2 startup systemd -u root --hp /root && \
cat > /etc/nginx/sites-available/syncarch << 'EOF'
server {
    listen 80;
    server_name syncarch.xyz www.syncarch.xyz;
    return 301 https://\$server_name\$request_uri;
}
server {
    listen 443 ssl http2;
    server_name syncarch.xyz www.syncarch.xyz;
    ssl_certificate /etc/letsencrypt/live/syncarch.xyz/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/syncarch.xyz/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    root /var/www/syncarch;
    index index.html;
    gzip on;
    gzip_types text/plain text/css application/javascript application/json;
    location /api/ {
        proxy_pass http://localhost:3001/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        client_max_body_size 10M;
    }
    location / {
        try_files \$uri \$uri/ /index.html;
    }
}
EOF
ln -sf /etc/nginx/sites-available/syncarch /etc/nginx/sites-enabled/ && \
nginx -t && systemctl reload nginx && \
pm2 status && \
echo "✅ DEPLOYMENT TAMAMLANDI!"
```

---

## 🎯 Deployment Sonrası

### 1. Test Et

```bash
# VPS'te:
pm2 status
curl http://localhost:3001/health
```

### 2. Supabase SQL Çalıştır

**ÖNEMLİ:** Mutlaka yapılmalı!

https://supabase.com/dashboard → SQL Editor

```sql
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

### 3. SSL Kontrol

```bash
# VPS'te:
certbot certificates

# Eğer yoksa:
certbot --nginx -d syncarch.xyz -d www.syncarch.xyz --non-interactive --agree-tos --email admin@syncarch.xyz
```

---

## ✅ Başarı Kriterleri

Deployment başarılı olduğunda:

- ✅ https://syncarch.xyz açılıyor
- ✅ Login çalışıyor
- ✅ İşlem eklenebiliyor
- ✅ Kur otomatik çekiliyor
- ✅ PM2 auto-restart aktif
- ✅ SSL sertifikası aktif

---

## 📊 VPS Kontrol Komutları

```bash
# PM2
pm2 status              # Durum
pm2 logs syncarch       # Loglar
pm2 restart syncarch    # Restart
pm2 monit              # Monitor

# Nginx
systemctl status nginx
nginx -t

# SSL
certbot certificates

# Sistem
df -h                  # Disk
free -h                # RAM
netstat -tulpn | grep 3001  # Port
```

---

## 🔄 Güncelleme Yapmak

```bash
# Local'de:
npm run build
./auto-deploy-with-key.sh
```

---

## 📦 Hazır Dosyalar

- `syncarch-deploy.tar.gz` - Deployment paketi
- `auto-deploy-with-key.sh` - SSH key ile otomatik
- `setup-exchange-rates.sql` - Database migration
- `DEPLOYMENT-FINAL.md` - Bu dosya

---

## Hangi Seçeneği Tercih Ediyorsun?

1. **Seçenek 1:** SSH key ekle + otomatik deploy (2 dakika)
2. **Seçenek 2:** Manuel tek komut VPS'te (3 dakika)

İkisi de çalışıyor, sen seç!

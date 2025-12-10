# 🚀 SyncArch VPS Deployment Kılavuzu

## VPS Bilgileri
- **IP**: 31.97.78.86
- **Domain**: syncarch.xyz
- **User**: root
- **OS**: Ubuntu 24.04
- **Location**: Germany - Frankfurt

## 📦 Hazırlanan Paket
- `syncarch-vps-latest.tar.gz` - Tüm uygulama dosyaları içerir

## 🎯 HIZLI DEPLOYMENT (Önerilen)

### Seçenek 1: Otomatik Script

```bash
chmod +x deploy-syncarch-latest.sh
./deploy-syncarch-latest.sh
```

Script şifre soracaktır: `00203549Rk..`

---

## 📋 MANUEL DEPLOYMENT

Eğer script çalışmazsa aşağıdaki adımları takip edin:

### 1️⃣ Dosyayı VPS'e Yükle

```bash
scp syncarch-vps-latest.tar.gz root@31.97.78.86:/tmp/
```

Şifre: `00203549Rk..`

### 2️⃣ VPS'e Bağlan

```bash
ssh root@31.97.78.86
```

Şifre: `00203549Rk..`

### 3️⃣ VPS'de Deployment

```bash
# Uygulama dizinine git
cd /var/www/syncarch

# Mevcut versiyonu yedekle
BACKUP_DIR="backup-$(date +%Y%m%d-%H%M%S)"
mkdir -p $BACKUP_DIR
[ -d "dist" ] && cp -r dist $BACKUP_DIR/
[ -d "server" ] && cp -r server $BACKUP_DIR/

# Yeni versiyonu çıkar
tar -xzf /tmp/syncarch-vps-latest.tar.gz -C /var/www/syncarch
rm -f /tmp/syncarch-vps-latest.tar.gz

# Node modüllerini kur
npm install --production

# PM2 servisini yeniden başlat
pm2 restart syncarch || pm2 start server/index.js --name syncarch
pm2 save

# Nginx'i yenile
nginx -t && systemctl reload nginx
```

### 4️⃣ Durumu Kontrol Et

```bash
# PM2 servisleri
pm2 list
pm2 logs syncarch --lines 50

# Nginx durumu
systemctl status nginx

# Port kontrolü
netstat -tulpn | grep -E ':(80|443|3000)'

# Disk kullanımı
df -h
```

---

## 🔧 NGINX YAPLANDIRMASI

Eğer ilk kurulum ise Nginx config:

```bash
# Config dosyası oluştur
sudo nano /etc/nginx/sites-available/syncarch
```

Config içeriği:

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name syncarch.xyz www.syncarch.xyz;

    root /var/www/syncarch/dist;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json application/javascript;

    # SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API proxy
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Static files caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

Config'i etkinleştir:

```bash
ln -sf /etc/nginx/sites-available/syncarch /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

---

## 🔒 SSL SERTIFIKASI

```bash
# Certbot ile SSL
certbot --nginx -d syncarch.xyz -d www.syncarch.xyz
```

Sertifika otomatik yenilenecektir.

---

## 📊 YENİ ÖZELLIKLER (Bu Versiyonda)

### ✅ Türk Piyasası Entegrasyonu
- **GenelPara API**: Gram altın ve döviz kurları
- **TruncGil API**: Yedek altın fiyatları
- Gerçek zamanlı piyasa verileri
- Otomatik fallback mekanizması

### ✅ İyileştirmeler
- Güncel kur hesaplamaları
- USD/TRY ve EUR/TRY çevrimleri
- Gram altın fiyat takibi
- Hata toleransı artırıldı

---

## 🧪 TEST

Deployment sonrası test:

```bash
# 1. Health check
curl http://localhost:3000/api/health

# 2. Web erişimi
curl -I https://syncarch.xyz

# 3. API testi
curl https://syncarch.xyz/api/statistics
```

Tarayıcıdan test:
- https://syncarch.xyz
- https://syncarch.xyz/api/statistics

---

## 🔍 LOG KONTROL

```bash
# PM2 logları
pm2 logs syncarch --lines 100

# Nginx access log
tail -f /var/log/nginx/access.log

# Nginx error log
tail -f /var/log/nginx/error.log

# Sistem logları
journalctl -u nginx -f
```

---

## ⚠️ SORUN GİDERME

### PM2 servisi çalışmıyor
```bash
pm2 delete syncarch
pm2 start server/index.js --name syncarch
pm2 save
```

### Nginx hata veriyor
```bash
nginx -t  # Syntax kontrolü
systemctl restart nginx
```

### Port 3000 kullanımda
```bash
lsof -i :3000
kill -9 <PID>
pm2 restart syncarch
```

### Disk doldu
```bash
# Eski yedekleri temizle
cd /var/www/syncarch
rm -rf backup-*

# PM2 loglarını temizle
pm2 flush
```

---

## 📱 MOBİL UYGULAMA

Web uygulama PWA desteklidir:
- Offline çalışma
- Ana ekrana ekleme
- Push bildirimler (opsiyonel)

---

## 🎉 BAŞARILI DEPLOYMENT SONRASI

Uygulama adresleri:
- **Ana Site**: https://syncarch.xyz
- **IP Erişim**: http://31.97.78.86
- **API Endpoint**: https://syncarch.xyz/api

Konsol komutları:
```bash
pm2 list          # Çalışan servisler
pm2 logs          # Tüm loglar
pm2 monit         # Real-time monitoring
```

---

## 📞 DESTEK

Sorun yaşarsanız:
1. Logları kontrol edin
2. PM2 ve Nginx durumunu kontrol edin
3. VPS kaynaklarını kontrol edin (CPU, RAM, Disk)

---

**Son Güncelleme**: 2025-12-06
**Versiyon**: 1.2.0 (Türk Piyasası Entegrasyonu)

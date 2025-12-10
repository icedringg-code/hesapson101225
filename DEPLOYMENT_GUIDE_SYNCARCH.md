# Syncarch VPS Deployment Guide

## VPS Bilgileri
- **Domain**: syncarch.xyz
- **IP**: 31.97.78.86
- **Sunucu**: Germany - Frankfurt
- **OS**: Ubuntu 24.04
- **SSH Kullanıcı**: root

## Hızlı Deployment

### 1. Otomatik Deployment (Önerilen)

Tek komutla deployment yapmak için:

```bash
chmod +x deploy-syncarch-vps.sh
./deploy-syncarch-vps.sh
```

Bu script:
- ✅ Production build oluşturur
- ✅ VPS'e yükler
- ✅ Nginx yapılandırması yapar
- ✅ Uygulamayı başlatır

### 2. SSL Kurulumu

Deployment'tan sonra SSL sertifikası kurun:

```bash
chmod +x setup-ssl-syncarch.sh
./setup-ssl-syncarch.sh
```

Bu script:
- ✅ Let's Encrypt SSL sertifikası kurar
- ✅ Otomatik yenileme ayarlar
- ✅ HTTPS'e otomatik yönlendirme yapar
- ✅ Güvenlik başlıklarını ekler

## Manuel Deployment Adımları

### 1. Production Build

```bash
npm run build
```

### 2. Build Dosyalarını Paketleme

```bash
cd dist
tar -czf ../syncarch-deploy.tar.gz *
cd ..
```

### 3. VPS'e Yükleme

```bash
scp syncarch-deploy.tar.gz root@31.97.78.86:/tmp/
```

### 4. VPS'te Deployment

SSH ile VPS'e bağlanın:

```bash
ssh root@31.97.78.86
```

Ardından aşağıdaki komutları çalıştırın:

```bash
# Uygulama dizinini oluştur
mkdir -p /var/www/syncarch
cd /var/www/syncarch

# Dosyaları çıkar
tar -xzf /tmp/syncarch-deploy.tar.gz
rm /tmp/syncarch-deploy.tar.gz

# İzinleri ayarla
chown -R www-data:www-data /var/www/syncarch
chmod -R 755 /var/www/syncarch
```

### 5. Nginx Yapılandırması

```bash
nano /etc/nginx/sites-available/syncarch
```

Aşağıdaki içeriği yapıştırın:

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name syncarch.xyz www.syncarch.xyz;

    root /var/www/syncarch;
    index index.html;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/javascript application/xml+rss application/json;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Service Worker - no cache
    location = /sw.js {
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        expires 0;
    }

    # Manifest - no cache
    location = /manifest.json {
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        expires 0;
    }
}
```

Site'ı etkinleştir ve Nginx'i yeniden yükle:

```bash
ln -sf /etc/nginx/sites-available/syncarch /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

### 6. SSL Sertifikası Kurulumu

```bash
# Certbot kur (henüz kurulu değilse)
apt-get update
apt-get install -y certbot python3-certbot-nginx

# SSL sertifikası al
certbot --nginx -d syncarch.xyz -d www.syncarch.xyz

# Otomatik yenilemeyi etkinleştir
systemctl enable certbot.timer
systemctl start certbot.timer
```

## Güncelleme (Update)

Uygulamanın yeni versiyonunu yüklemek için:

```bash
./deploy-syncarch-vps.sh
```

## Sorun Giderme

### Nginx Loglarını Kontrol Etme

```bash
# Hata logları
sudo tail -f /var/log/nginx/error.log

# Erişim logları
sudo tail -f /var/log/nginx/access.log
```

### Nginx Durumunu Kontrol Etme

```bash
sudo systemctl status nginx
```

### Nginx'i Yeniden Başlatma

```bash
sudo systemctl restart nginx
```

### SSL Sertifikası Durumunu Kontrol Etme

```bash
sudo certbot certificates
```

### SSL Yenileme Testi

```bash
sudo certbot renew --dry-run
```

## Uygulama URL'leri

- **HTTP**: http://syncarch.xyz (SSL kurulduktan sonra HTTPS'e yönlendirir)
- **HTTPS**: https://syncarch.xyz
- **www**: https://www.syncarch.xyz

## Güvenlik Özellikleri

✅ HTTPS zorlaması
✅ Güvenlik başlıkları (HSTS, XSS Protection, etc.)
✅ Gzip sıkıştırma
✅ Statik dosya önbelleği
✅ Modern SSL/TLS yapılandırması

## Performans

- **CDN**: Cloudflare entegrasyonu (isteğe bağlı)
- **Önbellek**: 1 yıl statik dosya önbelleği
- **Sıkıştırma**: Gzip etkin
- **HTTP/2**: Etkin

## Yedekleme

Düzenli yedekleme için:

```bash
# Uygulama dosyalarını yedekle
tar -czf syncarch-backup-$(date +%Y%m%d).tar.gz /var/www/syncarch

# Nginx yapılandırmasını yedekle
cp /etc/nginx/sites-available/syncarch /root/backups/syncarch-nginx-$(date +%Y%m%d).conf
```

## Destek

Sorun yaşarsanız:
1. Nginx loglarını kontrol edin
2. Nginx yapılandırmasını test edin: `nginx -t`
3. Uygulamanın doğru dizinde olduğundan emin olun
4. İzinlerin doğru olduğunu kontrol edin

---

**Son Güncelleme**: 9 Aralık 2024
**Versiyon**: 1.2.0

# SyncArch VPS Kurulum Kılavuzu

## VPS Bilgileri
- **IP:** 31.97.78.86
- **Domain:** syncarch.xyz
- **SSH:** root@31.97.78.86
- **İşletim Sistemi:** Ubuntu 24.04
- **Lokasyon:** Germany - Frankfurt

## Adım 1: Supabase Veritabanı Kurulumu

1. Tarayıcıda Supabase SQL Editor'ı açın:
   ```
   https://supabase.com/dashboard/project/ywkjahjpmcvbygmpbvrr/sql
   ```

2. `SETUP_DATABASE.sql` dosyasını açın ve tüm içeriği kopyalayın

3. SQL Editor'a yapıştırıp "Run" butonuna tıklayın

4. Tablolar başarıyla oluşturulacak

## Adım 2: VPS'e Bağlanma

Windows PowerShell veya Terminal'de:
```bash
ssh root@31.97.78.86
```

Şifre: `şifre00203549Rk..`

## Adım 3: VPS Sunucu Kurulumu

VPS'e bağlandıktan sonra:

```bash
# Script dosyasını oluştur
cat > vps-setup.sh << 'EOFSCRIPT'
#!/bin/bash
set -e

echo "SyncArch VPS Kurulumu Başlatılıyor..."

# Sistem güncelleme
apt update && apt upgrade -y

# Nginx kurulum
apt install -y nginx

# Certbot (SSL) kurulum
apt install -y certbot python3-certbot-nginx

# Uygulama dizini
mkdir -p /var/www/syncarch
chown -R www-data:www-data /var/www/syncarch

# Nginx yapılandırması
cat > /etc/nginx/sites-available/syncarch << 'EOF'
server {
    listen 80;
    listen [::]:80;
    server_name syncarch.xyz www.syncarch.xyz;

    root /var/www/syncarch;
    index index.html;

    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/json;

    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    location = /sw.js {
        add_header Cache-Control "no-cache, no-store, must-revalidate";
    }

    location / {
        try_files \$uri \$uri/ /index.html;
    }

    location ~ /\. {
        deny all;
    }
}
EOF

# Nginx aktifleştir
ln -sf /etc/nginx/sites-available/syncarch /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Nginx test ve başlat
nginx -t
systemctl restart nginx
systemctl enable nginx

echo "Kurulum tamamlandı!"
EOFSCRIPT

# Script'i çalıştırılabilir yap
chmod +x vps-setup.sh

# Script'i çalıştır
./vps-setup.sh
```

## Adım 4: Domain DNS Ayarları

1. Domain sağlayıcınızın (Hostinger) DNS yönetim paneline gidin

2. Aşağıdaki DNS kayıtlarını ekleyin:

   **A Record:**
   - Host: `@`
   - Value: `31.97.78.86`
   - TTL: 3600

   **A Record:**
   - Host: `www`
   - Value: `31.97.78.86`
   - TTL: 3600

3. DNS değişikliklerinin yayılmasını bekleyin (5-30 dakika)

4. DNS kontrolü:
   ```bash
   nslookup syncarch.xyz
   nslookup www.syncarch.xyz
   ```

## Adım 5: Dosyaları VPS'e Yükleme

**Yerel bilgisayarınızda** (proje klasöründe):

### Windows (PowerShell):
```powershell
# SCP ile yükleme
scp -r dist/* root@31.97.78.86:/var/www/syncarch/
```

### Linux/Mac:
```bash
# Rsync ile yükleme (daha hızlı)
rsync -avz --progress dist/ root@31.97.78.86:/var/www/syncarch/
```

### Alternatif: WinSCP Kullanma
1. WinSCP programını açın
2. Bağlantı bilgileri:
   - Host: 31.97.78.86
   - User: root
   - Password: şifre00203549Rk..
3. `dist` klasöründeki tüm dosyaları `/var/www/syncarch/` dizinine sürükleyin

## Adım 6: Dosya İzinlerini Ayarlama

VPS'e SSH ile bağlanın ve:
```bash
chown -R www-data:www-data /var/www/syncarch
chmod -R 755 /var/www/syncarch
```

## Adım 7: SSL Sertifikası Kurulumu

VPS'te:
```bash
certbot --nginx -d syncarch.xyz -d www.syncarch.xyz
```

Email adresinizi girin ve soruları yanıtlayın:
- Terms of Service: A (Agree)
- Share email: N (No)
- Redirect HTTP to HTTPS: 2 (Yes)

## Adım 8: Test ve Doğrulama

1. **HTTP Test:**
   ```bash
   curl -I http://syncarch.xyz
   ```

2. **HTTPS Test:**
   ```bash
   curl -I https://syncarch.xyz
   ```

3. **Tarayıcı Test:**
   - https://syncarch.xyz adresini ziyaret edin
   - Giriş yapın ve sistemi test edin

## Güncelleme Yapmak

Uygulama güncellemesi için:

```bash
# 1. Yerel bilgisayarda build
npm run build

# 2. VPS'e yükle
rsync -avz --progress dist/ root@31.97.78.86:/var/www/syncarch/

# 3. VPS'te izinleri düzelt
ssh root@31.97.78.86 "chown -R www-data:www-data /var/www/syncarch"

# 4. Nginx yeniden yükle
ssh root@31.97.78.86 "nginx -s reload"
```

## Otomatik Yenileme (SSL)

SSL sertifikası otomatik yenilenecek. Kontrol için:
```bash
certbot renew --dry-run
```

## Log Dosyaları

Hata durumunda logları kontrol edin:
```bash
# Nginx access log
tail -f /var/log/nginx/access.log

# Nginx error log
tail -f /var/log/nginx/error.log

# Certbot log
tail -f /var/log/letsencrypt/letsencrypt.log
```

## Firewall Ayarları (İsteğe Bağlı)

Güvenlik için:
```bash
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw enable
```

## Yedekleme Önerisi

Düzenli yedekleme için:
```bash
# VPS'ten yerel bilgisayara yedek
rsync -avz root@31.97.78.86:/var/www/syncarch/ ./backup/
```

## Sorun Giderme

### Site açılmıyor
```bash
# Nginx durumunu kontrol et
systemctl status nginx

# Nginx yeniden başlat
systemctl restart nginx
```

### SSL hatası
```bash
# Sertifikayı yenile
certbot renew

# Nginx yeniden yükle
nginx -s reload
```

### Dosya bulunamadı (404)
```bash
# Dosya izinlerini kontrol et
ls -la /var/www/syncarch/

# İzinleri düzelt
chown -R www-data:www-data /var/www/syncarch
```

## Önemli Notlar

1. **Supabase Veritabanı:** Veritabanı Supabase'de barındırılıyor, VPS'te değil
2. **Statik Site:** Uygulama tamamen statik (sadece HTML, CSS, JS)
3. **HTTPS Zorunlu:** Tüm trafik HTTPS'e yönlendiriliyor
4. **PWA Desteği:** Uygulama Progressive Web App olarak çalışıyor

## Destek

Sorun yaşarsanız:
1. Nginx loglarını kontrol edin
2. Browser console'u açıp hataları inceleyin
3. Supabase dashboard'da veritabanı bağlantısını kontrol edin

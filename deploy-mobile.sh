#!/bin/bash

# SyncArch Mobile-Ready VPS Deployment Script
# Tam responsive, mobil uyumlu deployment

VPS_IP="31.97.78.86"
VPS_USER="root"
DOMAIN="syncarch.com"

echo "╔════════════════════════════════════════╗"
echo "║  SyncArch Mobile Deployment v2.0       ║"
echo "╚════════════════════════════════════════╝"
echo ""

# Deployment paketini yükle
echo "[1/4] VPS'e dosyalar yükleniyor..."
scp syncarch-mobile-deploy.tar.gz $VPS_USER@$VPS_IP:/root/

if [ $? -ne 0 ]; then
    echo "❌ Dosya yüklenemedi!"
    exit 1
fi

echo "✓ Dosyalar yüklendi"
echo ""

# VPS'te kurulum
echo "[2/4] VPS'te dosyalar kuruluyor..."
ssh $VPS_USER@$VPS_IP << 'ENDSSH'

# Eski dosyaları yedekle
if [ -d "/var/www/syncarch" ]; then
    echo "Eski dosyalar yedekleniyor..."
    mv /var/www/syncarch /var/www/syncarch_backup_$(date +%Y%m%d_%H%M%S)
fi

# Yeni klasör
mkdir -p /var/www/syncarch

# Arşivi aç
echo "Dosyalar çıkartılıyor..."
tar -xzf /root/syncarch-mobile-deploy.tar.gz -C /var/www/syncarch

# İzinler
chown -R www-data:www-data /var/www/syncarch
chmod -R 755 /var/www/syncarch

echo "✓ Dosyalar kuruldu"

ENDSSH

echo ""
echo "[3/4] Nginx mobil optimizasyonu yapılıyor..."
ssh $VPS_USER@$VPS_IP << 'ENDSSH'

# Mobil-optimize Nginx config
cat > /etc/nginx/sites-available/syncarch << 'EOF'
server {
    listen 80;
    listen [::]:80;
    server_name syncarch.com www.syncarch.com 31.97.78.86;

    root /var/www/syncarch;
    index index.html;

    # Mobil için önemli header'lar
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Gzip compression (mobil için önemli)
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript
               application/x-javascript application/xml+rss
               application/javascript application/json;
    gzip_comp_level 6;

    # SPA routing
    location / {
        try_files $uri $uri/ /index.html;

        # Mobil cache kontrol
        add_header Cache-Control "no-cache, must-revalidate";
    }

    # Static assets - aggressive caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    # Manifest ve service worker - kısa cache
    location ~* \.(json|webmanifest)$ {
        expires 1d;
        add_header Cache-Control "public, must-revalidate";
    }

    location = /sw.js {
        expires 1d;
        add_header Cache-Control "public, must-revalidate";
    }
}
EOF

# Aktifleştir
ln -sf /etc/nginx/sites-available/syncarch /etc/nginx/sites-enabled/syncarch

# Test ve restart
nginx -t && systemctl reload nginx

echo "✓ Nginx yapılandırıldı"

ENDSSH

echo ""
echo "[4/4] SSL sertifikası kontrol ediliyor..."
ssh $VPS_USER@$VPS_IP << ENDSSH

# SSL varsa sadece reload, yoksa kur
if [ -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]; then
    echo "SSL zaten mevcut, yenileniyor..."
    certbot renew --nginx --quiet
else
    echo "SSL kuruluyor..."
    certbot --nginx -d $DOMAIN -d www.$DOMAIN \
        --non-interactive --agree-tos \
        --email admin@$DOMAIN --redirect
fi

echo "✓ SSL hazır"

ENDSSH

echo ""
echo "╔════════════════════════════════════════╗"
echo "║  ✓ DEPLOYMENT TAMAMLANDI!             ║"
echo "╚════════════════════════════════════════╝"
echo ""
echo "Siteniz mobil uyumlu olarak yayında:"
echo ""
echo "  🌐 https://syncarch.com"
echo "  🌐 https://www.syncarch.com"
echo "  🌐 http://31.97.78.86"
echo ""
echo "Mobil cihazınızdan test edin! ✓"
echo ""

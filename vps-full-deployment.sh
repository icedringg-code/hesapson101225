#!/bin/bash

# SyncArch VPS Tam Kurulum Script
# Domain: syncarch.xyz
# VPS IP: 31.97.78.86

set -e

echo "======================================"
echo "SyncArch VPS Kurulumu Başlatılıyor..."
echo "======================================"

# Renk kodları
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

# Domain ve dizin ayarları
DOMAIN="syncarch.xyz"
APP_DIR="/var/www/syncarch"
NGINX_CONF="/etc/nginx/sites-available/syncarch"

echo -e "${BLUE}1. Sistem Güncellemesi...${NC}"
apt update && apt upgrade -y

echo -e "${BLUE}2. Nginx Kurulumu...${NC}"
apt install -y nginx

echo -e "${BLUE}3. Certbot (SSL) Kurulumu...${NC}"
apt install -y certbot python3-certbot-nginx

echo -e "${BLUE}4. Uygulama Dizini Oluşturma...${NC}"
mkdir -p $APP_DIR
chown -R www-data:www-data $APP_DIR

echo -e "${BLUE}5. Nginx Yapılandırması...${NC}"
cat > $NGINX_CONF << 'EOF'
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
    add_header Referrer-Policy "no-referrer-when-downgrade" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/javascript application/json;

    # Cache static assets
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Service Worker - no cache
    location = /sw.js {
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        add_header Pragma "no-cache";
        add_header Expires "0";
    }

    # Main location
    location / {
        try_files $uri $uri/ /index.html;
    }

    # .htaccess ve hidden files
    location ~ /\. {
        deny all;
    }
}
EOF

echo -e "${BLUE}6. Nginx Site Aktifleştirme...${NC}"
ln -sf $NGINX_CONF /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

echo -e "${BLUE}7. Nginx Test...${NC}"
nginx -t

echo -e "${BLUE}8. Nginx Yeniden Başlatma...${NC}"
systemctl restart nginx
systemctl enable nginx

echo -e "${GREEN}======================================"
echo "Temel Kurulum Tamamlandı!"
echo "======================================"
echo ""
echo "Şimdi aşağıdaki adımları takip edin:"
echo ""
echo "1. Domain DNS ayarlarını yapın:"
echo "   A Record: @ -> 31.97.78.86"
echo "   A Record: www -> 31.97.78.86"
echo ""
echo "2. DNS propagation bekleyin (5-30 dakika)"
echo ""
echo "3. Dist dosyalarını yükleyin:"
echo "   rsync -avz --progress dist/ root@31.97.78.86:/var/www/syncarch/"
echo ""
echo "4. SSL sertifikası kurun:"
echo "   certbot --nginx -d syncarch.xyz -d www.syncarch.xyz"
echo ""
echo "5. Tarayıcıda test edin:"
echo "   https://syncarch.xyz"
echo ""
echo -e "${NC}"

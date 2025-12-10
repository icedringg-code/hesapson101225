#!/bin/bash

# Syncarch Otomatik VPS Deployment
# Bu script tüm deployment işlemini otomatik yapar

set -e

VPS_USER="root"
VPS_HOST="31.97.78.86"
VPS_PASS="00203549Rk.."
DOMAIN="syncarch.xyz"
APP_DIR="/var/www/syncarch"

GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}=========================================="
echo "Syncarch Otomatik VPS Deployment"
echo "==========================================${NC}"

# Check if sshpass is installed
if ! command -v sshpass &> /dev/null; then
    echo -e "${BLUE}sshpass kurulumu yapılıyor...${NC}"
    if [[ "$OSTYPE" == "darwin"* ]]; then
        brew install hudochenkov/sshpass/sshpass
    elif [[ -f /etc/debian_version ]]; then
        sudo apt-get update && sudo apt-get install -y sshpass
    elif [[ -f /etc/redhat-release ]]; then
        sudo yum install -y sshpass
    else
        echo -e "${RED}sshpass otomatik kurulamadı. Manuel kurun: apt-get install sshpass${NC}"
        exit 1
    fi
fi

echo -e "${GREEN}✓ Gereksinimler kontrol edildi${NC}"
echo ""

echo -e "${BLUE}1. Deployment paketi kontrol ediliyor...${NC}"
if [ ! -f "syncarch-vps-deploy.tar.gz" ]; then
    echo -e "${RED}Hata: syncarch-vps-deploy.tar.gz bulunamadı!${NC}"
    echo "Önce build çalıştırılmalı: npm run build"
    exit 1
fi

echo -e "${GREEN}✓ Deployment paketi hazır${NC}"
echo ""

echo -e "${BLUE}2. VPS'e dosyalar yükleniyor...${NC}"
sshpass -p "${VPS_PASS}" scp -o StrictHostKeyChecking=no syncarch-vps-deploy.tar.gz ${VPS_USER}@${VPS_HOST}:/tmp/

echo -e "${GREEN}✓ Dosyalar yüklendi${NC}"
echo ""

echo -e "${BLUE}3. VPS'te deployment yapılıyor...${NC}"

sshpass -p "${VPS_PASS}" ssh -o StrictHostKeyChecking=no ${VPS_USER}@${VPS_HOST} << 'ENDSSH'
set -e

APP_DIR="/var/www/syncarch"
DOMAIN="syncarch.xyz"

echo "→ Uygulama dizini hazırlanıyor..."
mkdir -p ${APP_DIR}

echo "→ Eski dosyalar yedekleniyor..."
if [ -d "${APP_DIR}/old" ]; then
    rm -rf ${APP_DIR}/old
fi
if [ "$(ls -A ${APP_DIR})" ]; then
    mkdir -p ${APP_DIR}/old
    mv ${APP_DIR}/* ${APP_DIR}/old/ 2>/dev/null || true
fi

echo "→ Yeni dosyalar çıkarılıyor..."
cd ${APP_DIR}
tar -xzf /tmp/syncarch-vps-deploy.tar.gz
rm /tmp/syncarch-vps-deploy.tar.gz

echo "→ İzinler ayarlanıyor..."
chown -R www-data:www-data ${APP_DIR}
chmod -R 755 ${APP_DIR}

echo "→ Nginx yapılandırması kontrol ediliyor..."
if [ ! -f /etc/nginx/sites-available/syncarch ]; then
    echo "→ Nginx yapılandırması oluşturuluyor..."
    cat > /etc/nginx/sites-available/syncarch << 'EOF'
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
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/javascript application/xml+rss application/json application/xml;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    # Service Worker - no cache
    location = /sw.js {
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        add_header Pragma "no-cache";
        expires 0;
    }

    # Manifest - no cache
    location = /manifest.json {
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        add_header Pragma "no-cache";
        expires 0;
    }

    # Block hidden files
    location ~ /\. {
        deny all;
        access_log off;
        log_not_found off;
    }
}
EOF

    echo "→ Site etkinleştiriliyor..."
    ln -sf /etc/nginx/sites-available/syncarch /etc/nginx/sites-enabled/

    # Remove default site if exists
    if [ -f /etc/nginx/sites-enabled/default ]; then
        rm -f /etc/nginx/sites-enabled/default
    fi
fi

echo "→ Nginx yapılandırması test ediliyor..."
nginx -t

echo "→ Nginx yeniden yükleniyor..."
systemctl reload nginx

echo "→ Nginx durumu kontrol ediliyor..."
systemctl status nginx --no-pager || true

echo ""
echo "✓ Deployment tamamlandı!"
ENDSSH

echo ""
echo -e "${GREEN}=========================================="
echo "✓ Deployment Başarıyla Tamamlandı!"
echo "==========================================${NC}"
echo ""
echo -e "${BLUE}Uygulama URL:${NC} http://syncarch.xyz"
echo ""
echo -e "${BLUE}Sonraki Adım:${NC}"
echo "SSL sertifikası kurmak için:"
echo -e "  ${GREEN}./auto-ssl-setup.sh${NC}"
echo ""
echo -e "${BLUE}Durum Kontrolü:${NC}"
echo "  Nginx durumu: sudo systemctl status nginx"
echo "  Nginx logları: sudo tail -f /var/log/nginx/error.log"
echo ""

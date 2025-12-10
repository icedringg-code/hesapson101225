#!/bin/bash

# SyncArch Automatic Deployment with SSH Key
set -e

VPS_IP="31.97.78.86"
VPS_USER="root"
SSH_KEY="~/.ssh/syncarch_deploy"
DOMAIN="syncarch.xyz"
APP_DIR="/var/www/syncarch"

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}======================================"
echo "  SyncArch VPS Deployment (SSH Key)"
echo "======================================${NC}"
echo ""

# Check if package exists
if [ ! -f "syncarch-deploy.tar.gz" ]; then
    echo -e "${RED}Error: syncarch-deploy.tar.gz not found!${NC}"
    exit 1
fi

FILE_SIZE=$(du -h syncarch-deploy.tar.gz | cut -f1)
echo -e "${GREEN}✓ Deployment paketi hazır (${FILE_SIZE})${NC}"
echo ""

echo -e "${BLUE}[1/5] VPS'e yükleniyor...${NC}"
scp -i ${SSH_KEY} -o StrictHostKeyChecking=no \
    syncarch-deploy.tar.gz ${VPS_USER}@${VPS_IP}:/tmp/
echo -e "${GREEN}  ✓ Upload tamamlandı${NC}"
echo ""

echo -e "${BLUE}[2/5] VPS'te kurulum yapılıyor...${NC}"
ssh -i ${SSH_KEY} -o StrictHostKeyChecking=no ${VPS_USER}@${VPS_IP} << 'ENDSSH'
set -e

APP_DIR="/var/www/syncarch"

echo "  → Dizin hazırlanıyor..."
mkdir -p ${APP_DIR}
cd ${APP_DIR}

echo "  → Yedek alınıyor..."
if [ -d "backup" ]; then rm -rf backup; fi
if [ -f "index.html" ]; then
    mkdir -p backup
    cp -r * backup/ 2>/dev/null || true
fi

echo "  → Dosyalar çıkarılıyor..."
tar -xzf /tmp/syncarch-deploy.tar.gz
rm /tmp/syncarch-deploy.tar.gz

echo "  → Dependencies kuruluyor..."
npm install --production --quiet

ENDSSH
echo -e "${GREEN}  ✓ Kurulum tamamlandı${NC}"
echo ""

echo -e "${BLUE}[3/5] PM2 yapılandırılıyor...${NC}"
ssh -i ${SSH_KEY} -o StrictHostKeyChecking=no ${VPS_USER}@${VPS_IP} << 'ENDSSH2'
set -e

cd /var/www/syncarch

echo "  → PM2 başlatılıyor..."
pm2 delete syncarch 2>/dev/null || true

pm2 start server/index.js \
  --name syncarch \
  --node-args="--max-old-space-size=2048" \
  --time

pm2 save
pm2 startup systemd -u root --hp /root > /dev/null 2>&1 || true

sleep 2
pm2 status | grep syncarch

ENDSSH2
echo -e "${GREEN}  ✓ PM2 aktif${NC}"
echo ""

echo -e "${BLUE}[4/5] Nginx yapılandırılıyor...${NC}"
ssh -i ${SSH_KEY} -o StrictHostKeyChecking=no ${VPS_USER}@${VPS_IP} << 'ENDSSH3'
set -e

cat > /etc/nginx/sites-available/syncarch << 'NGINXCONF'
server {
    listen 80;
    server_name syncarch.xyz www.syncarch.xyz;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name syncarch.xyz www.syncarch.xyz;

    ssl_certificate /etc/letsencrypt/live/syncarch.xyz/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/syncarch.xyz/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    root /var/www/syncarch;
    index index.html;

    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/json;

    location /api/ {
        proxy_pass http://localhost:3001/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        client_max_body_size 10M;
        proxy_connect_timeout 600;
        proxy_send_timeout 600;
        proxy_read_timeout 600;
        send_timeout 600;
    }

    location / {
        try_files $uri $uri/ /index.html;
        expires 1d;
        add_header Cache-Control "public, must-revalidate";
    }

    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    location /sw.js {
        expires off;
        add_header Cache-Control "no-cache, no-store, must-revalidate";
    }
}
NGINXCONF

ln -sf /etc/nginx/sites-available/syncarch /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx

ENDSSH3
echo -e "${GREEN}  ✓ Nginx yapılandırıldı${NC}"
echo ""

echo -e "${BLUE}[5/5] Test ediliyor...${NC}"
ssh -i ${SSH_KEY} -o StrictHostKeyChecking=no ${VPS_USER}@${VPS_IP} << 'ENDSSH4'
set -e

echo "  → PM2 durumu:"
pm2 status | grep syncarch

echo ""
echo "  → API health check:"
HEALTH=$(curl -s http://localhost:3001/health 2>&1)
echo "    $HEALTH"

echo ""
echo "  → SSL kontrolü:"
if [ -f /etc/letsencrypt/live/syncarch.xyz/fullchain.pem ]; then
    echo "    ✓ SSL sertifikası mevcut"
else
    echo "    ⚠ SSL kurulumu gerekiyor"
fi

ENDSSH4

echo ""
echo -e "${GREEN}======================================"
echo "  ✓ DEPLOYMENT BAŞARILI!"
echo "======================================${NC}"
echo ""
echo -e "${YELLOW}Uygulama:${NC}"
echo "  → https://syncarch.xyz"
echo ""
echo -e "${RED}SON ADIM: Supabase SQL${NC}"
echo "  → setup-exchange-rates.sql dosyasını çalıştır"
echo ""

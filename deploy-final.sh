#!/bin/bash

# SyncArch VPS Final Deployment Script
# Bu script tüm deployment işlemini otomatik yapar

set -e

echo "======================================"
echo "  SyncArch VPS Deployment v1.2.0     "
echo "======================================"
echo ""

VPS_IP="31.97.78.86"
VPS_USER="root"
DOMAIN="syncarch.xyz"
APP_DIR="/var/www/syncarch"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}[1/7] Hazırlık...${NC}"
cd "$(dirname "$0")"

# Cleanup old files
echo "Eski dosyalar temizleniyor..."
rm -rf deployment-package syncarch-deploy.tar.gz 2>/dev/null || true

echo -e "${BLUE}[2/7] Deployment paketi oluşturuluyor...${NC}"
mkdir -p deployment-package

# Copy dist
echo "  → dist/ kopyalanıyor..."
cp -r dist/* deployment-package/

# Copy server
echo "  → server/ kopyalanıyor..."
cp -r server deployment-package/

# Copy env
echo "  → .env kopyalanıyor..."
cp .env.production deployment-package/.env

# Create production package.json
echo "  → package.json oluşturuluyor..."
cat > deployment-package/package.json << 'PKGJSON'
{
  "name": "syncarch-is-takip",
  "version": "1.2.0",
  "type": "module",
  "scripts": {
    "start": "node server/index.js"
  },
  "dependencies": {
    "express": "^4.19.2",
    "cors": "^2.8.5",
    "dotenv": "^16.4.5",
    "multer": "^1.4.5-lts.1",
    "form-data": "^4.0.0",
    "node-fetch": "^3.3.2"
  }
}
PKGJSON

# Create tar.gz
echo "  → Arşiv oluşturuluyor..."
cd deployment-package
tar -czf ../syncarch-deploy.tar.gz . 2>/dev/null
cd ..
rm -rf deployment-package

FILE_SIZE=$(du -h syncarch-deploy.tar.gz | cut -f1)
echo -e "${GREEN}  ✓ Paket hazır (${FILE_SIZE})${NC}"
echo ""

echo -e "${BLUE}[3/7] VPS'e yükleniyor...${NC}"
echo "  → root@${VPS_IP}:/tmp/"
scp -o StrictHostKeyChecking=no syncarch-deploy.tar.gz ${VPS_USER}@${VPS_IP}:/tmp/
echo -e "${GREEN}  ✓ Yükleme tamamlandı${NC}"
echo ""

echo -e "${BLUE}[4/7] VPS'te kurulum yapılıyor...${NC}"
ssh -o StrictHostKeyChecking=no ${VPS_USER}@${VPS_IP} << 'ENDSSH'
set -e

APP_DIR="/var/www/syncarch"
DOMAIN="syncarch.xyz"

echo "  → Dizin hazırlanıyor..."
mkdir -p ${APP_DIR}
cd ${APP_DIR}

echo "  → Yedek alınıyor..."
if [ -d "backup" ]; then
  rm -rf backup
fi
if [ -f "index.html" ]; then
  mkdir -p backup
  cp -r * backup/ 2>/dev/null || true
fi

echo "  → Dosyalar çıkarılıyor..."
tar -xzf /tmp/syncarch-deploy.tar.gz
rm /tmp/syncarch-deploy.tar.gz

echo "  → Dependencies kuruluyor..."
npm install --production --quiet

echo "  → PM2 yapılandırılıyor..."
if pm2 list | grep -q "syncarch"; then
  pm2 delete syncarch
fi

pm2 start server/index.js \
  --name syncarch \
  --node-args="--max-old-space-size=2048" \
  --time

pm2 save
pm2 startup systemd -u root --hp /root > /dev/null 2>&1 || true

echo "  → PM2 durumu:"
pm2 list | grep syncarch || echo "    Başlatılıyor..."
sleep 2

ENDSSH

echo -e "${GREEN}  ✓ Kurulum tamamlandı${NC}"
echo ""

echo -e "${BLUE}[5/7] Nginx yapılandırılıyor...${NC}"
ssh -o StrictHostKeyChecking=no ${VPS_USER}@${VPS_IP} << 'ENDSSH2'
set -e

APP_DIR="/var/www/syncarch"
DOMAIN="syncarch.xyz"

echo "  → Nginx config oluşturuluyor..."
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
    ssl_prefer_server_ciphers on;

    root /var/www/syncarch;
    index index.html;

    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/x-javascript application/xml+rss application/json;

    location /api/ {
        proxy_pass http://localhost:3001/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_connect_timeout 600;
        proxy_send_timeout 600;
        proxy_read_timeout 600;
        send_timeout 600;
        client_max_body_size 10M;
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

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    location /sw.js {
        expires off;
        add_header Cache-Control "no-cache, no-store, must-revalidate";
    }

    location /manifest.json {
        expires off;
        add_header Cache-Control "no-cache, no-store, must-revalidate";
    }
}
NGINXCONF

ln -sf /etc/nginx/sites-available/syncarch /etc/nginx/sites-enabled/

echo "  → Nginx test ediliyor..."
nginx -t

echo "  → Nginx reload ediliyor..."
systemctl reload nginx

ENDSSH2

echo -e "${GREEN}  ✓ Nginx yapılandırıldı${NC}"
echo ""

echo -e "${BLUE}[6/7] SSL kontrol ediliyor...${NC}"
ssh -o StrictHostKeyChecking=no ${VPS_USER}@${VPS_IP} << 'ENDSSH3'
set -e

if [ -f /etc/letsencrypt/live/syncarch.xyz/fullchain.pem ]; then
    echo "  → SSL sertifikası mevcut"
    echo "  → Sertifika bilgileri:"
    openssl x509 -in /etc/letsencrypt/live/syncarch.xyz/fullchain.pem -noout -dates | sed 's/^/    /'
else
    echo "  → SSL sertifikası kurulu değil"
    echo "  → Certbot kuruluyor..."
    apt-get update -qq
    apt-get install -y certbot python3-certbot-nginx -qq

    echo "  → SSL sertifikası alınıyor..."
    certbot --nginx \
      -d syncarch.xyz \
      -d www.syncarch.xyz \
      --non-interactive \
      --agree-tos \
      --email admin@syncarch.xyz \
      --redirect

    echo "  → Auto-renewal test ediliyor..."
    certbot renew --dry-run
fi

ENDSSH3

echo -e "${GREEN}  ✓ SSL aktif${NC}"
echo ""

echo -e "${BLUE}[7/7] Deployment test ediliyor...${NC}"
ssh -o StrictHostKeyChecking=no ${VPS_USER}@${VPS_IP} << 'ENDSSH4'
set -e

echo "  → PM2 durumu:"
pm2 status | grep syncarch | awk '{print "    " $0}'

echo ""
echo "  → Port dinleme kontrolü:"
if netstat -tulpn | grep -q ":3001"; then
    echo "    ✓ Port 3001 aktif"
else
    echo "    ✗ Port 3001 pasif"
fi

echo ""
echo "  → Health check:"
HEALTH=$(curl -s http://localhost:3001/health || echo "failed")
if echo "$HEALTH" | grep -q "ok"; then
    echo "    ✓ API çalışıyor"
else
    echo "    ✗ API yanıt vermiyor"
fi

ENDSSH4

echo -e "${GREEN}  ✓ Test tamamlandı${NC}"
echo ""

# Cleanup
rm -f syncarch-deploy.tar.gz

echo -e "${GREEN}======================================"
echo "  ✓ DEPLOYMENT BAŞARILI!"
echo "======================================${NC}"
echo ""
echo -e "${YELLOW}Uygulama Bilgileri:${NC}"
echo "  URL      : https://syncarch.xyz"
echo "  API      : https://syncarch.xyz/api"
echo "  Server   : root@${VPS_IP}"
echo ""
echo -e "${YELLOW}Yönetim Komutları:${NC}"
echo "  SSH      : ssh root@${VPS_IP}"
echo "  Status   : pm2 status"
echo "  Logs     : pm2 logs syncarch"
echo "  Restart  : pm2 restart syncarch"
echo ""
echo -e "${RED}ÖNEMLİ: Supabase SQL Çalıştır!${NC}"
echo "1. https://supabase.com/dashboard → SQL Editor"
echo "2. setup-exchange-rates.sql dosyasını çalıştır"
echo ""
echo -e "${GREEN}Deployment tamamlandı! 🚀${NC}"

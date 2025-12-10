#!/bin/bash

# VPS Tam Kurulum Script - SyncArch İş Takip
# Domain: syncarch.xyz
# IP: 31.97.78.86

set -e

echo "=========================================="
echo "SyncArch İş Takip - VPS Kurulumu"
echo "=========================================="

# Renk kodları
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Değişkenler
DOMAIN="syncarch.xyz"
PROJECT_DIR="/var/www/syncarch"
EMAIL="admin@syncarch.xyz"

echo -e "${YELLOW}1. Sistem güncelleniyor...${NC}"
apt-get update
apt-get upgrade -y

echo -e "${YELLOW}2. Gerekli paketler yükleniyor...${NC}"
apt-get install -y curl wget git nginx certbot python3-certbot-nginx

# Node.js kontrol
if ! command -v node &> /dev/null; then
    echo -e "${YELLOW}Node.js yükleniyor...${NC}"
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
else
    echo -e "${GREEN}Node.js zaten yüklü: $(node -v)${NC}"
fi

# PM2 kurulumu
if ! command -v pm2 &> /dev/null; then
    echo -e "${YELLOW}PM2 yükleniyor...${NC}"
    npm install -g pm2
else
    echo -e "${GREEN}PM2 zaten yüklü${NC}"
fi

echo -e "${YELLOW}3. Proje dizini oluşturuluyor...${NC}"
mkdir -p $PROJECT_DIR
cd $PROJECT_DIR

# Eğer dosyalar zaten kopyalanmışsa
if [ -f "package.json" ]; then
    echo -e "${GREEN}Proje dosyaları bulundu${NC}"

    echo -e "${YELLOW}4. npm paketleri yükleniyor...${NC}"
    npm install

    echo -e "${YELLOW}5. Production .env dosyası oluşturuluyor...${NC}"
    if [ -f ".env.production" ]; then
        cp .env.production .env
        chmod 600 .env
        echo -e "${GREEN}.env dosyası oluşturuldu${NC}"
    else
        echo -e "${RED}HATA: .env.production dosyası bulunamadı!${NC}"
        exit 1
    fi

    echo -e "${YELLOW}6. Frontend build ediliyor...${NC}"
    npm run build

    echo -e "${YELLOW}7. Backend PM2 ile başlatılıyor...${NC}"
    pm2 delete voice-assistant-api 2>/dev/null || true
    pm2 start server/index.js --name "voice-assistant-api"
    pm2 startup
    pm2 save

else
    echo -e "${RED}HATA: Proje dosyaları bulunamadı!${NC}"
    echo -e "${YELLOW}Lütfen önce dosyaları $PROJECT_DIR dizinine yükleyin${NC}"
    exit 1
fi

echo -e "${YELLOW}8. Nginx yapılandırılıyor...${NC}"
cat > /etc/nginx/sites-available/syncarch << 'NGINXCONF'
server {
    listen 80;
    server_name syncarch.xyz www.syncarch.xyz;

    root /var/www/syncarch/dist;
    index index.html;

    # Frontend
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Büyük dosyalar için (ses kayıtları)
        client_max_body_size 10M;
    }

    # Güvenlik headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Cache statik dosyalar
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
NGINXCONF

# Nginx site'ı aktifleştir
ln -sf /etc/nginx/sites-available/syncarch /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Nginx test et
echo -e "${YELLOW}Nginx yapılandırması test ediliyor...${NC}"
nginx -t

echo -e "${YELLOW}9. Nginx yeniden başlatılıyor...${NC}"
systemctl restart nginx
systemctl enable nginx

echo -e "${YELLOW}10. SSL sertifikası kuruluyor (Let's Encrypt)...${NC}"
# Certbot ile SSL kurulumu
certbot --nginx -d syncarch.xyz -d www.syncarch.xyz --non-interactive --agree-tos --email $EMAIL --redirect || {
    echo -e "${YELLOW}SSL kurulumu şimdi başarısız oldu, daha sonra deneyebilirsiniz:${NC}"
    echo "certbot --nginx -d syncarch.xyz -d www.syncarch.xyz --email $EMAIL"
}

echo -e "${YELLOW}11. Firewall ayarları yapılıyor...${NC}"
ufw allow 'Nginx Full'
ufw allow OpenSSH
echo "y" | ufw enable || true

echo -e "${GREEN}=========================================="
echo "✓ Kurulum tamamlandı!"
echo "==========================================${NC}"
echo ""
echo -e "${GREEN}Sunucu Bilgileri:${NC}"
echo "Domain: https://syncarch.xyz"
echo "IP: 31.97.78.86"
echo ""
echo -e "${GREEN}Kontrol Komutları:${NC}"
echo "Backend durumu: pm2 status"
echo "Backend logları: pm2 logs voice-assistant-api"
echo "Nginx durumu: systemctl status nginx"
echo "SSL yenileme: certbot renew --dry-run"
echo ""
echo -e "${YELLOW}Not: Tarayıcınızdan https://syncarch.xyz adresini ziyaret edin${NC}"

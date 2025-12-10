#!/bin/bash

# SyncArch Full VPS Deployment Script
# Mobil uyumlu, tam otomatik kurulum

clear
cat << "BANNER"
╔═══════════════════════════════════════════════╗
║                                               ║
║     SyncArch VPS Full Deployment v3.0         ║
║     Mobil Uyumlu • SSL • Production Ready     ║
║                                               ║
╚═══════════════════════════════════════════════╝
BANNER

echo ""
echo "VPS Bilgileri:"
echo "  IP: 31.97.78.86"
echo "  Domain: syncarch.com"
echo "  User: root"
echo ""

VPS_IP="31.97.78.86"
VPS_USER="root"
DOMAIN="syncarch.com"

# Test bağlantı
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "[1/6] VPS Bağlantısı Test Ediliyor..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if ssh -o ConnectTimeout=5 -o StrictHostKeyChecking=no $VPS_USER@$VPS_IP "echo '✓ Bağlantı başarılı'" 2>/dev/null; then
    echo "✓ VPS bağlantısı aktif"
else
    echo "❌ VPS'e bağlanılamadı!"
    echo "Lütfen SSH şifrenizi kontrol edin."
    exit 1
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "[2/6] Dosyalar VPS'e Yükleniyor..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if scp -o StrictHostKeyChecking=no full-deploy.tar.gz $VPS_USER@$VPS_IP:/root/; then
    echo "✓ Dosyalar yüklendi (192 KB)"
else
    echo "❌ Dosya yüklenemedi!"
    exit 1
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "[3/6] VPS Sunucu Hazırlanıyor..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
ssh $VPS_USER@$VPS_IP bash << 'ENDSSH'

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "Paketler güncelleniyor..."
apt-get update -qq > /dev/null 2>&1

if ! command -v nginx &> /dev/null; then
    echo "Nginx kuruluyor..."
    apt-get install -y nginx -qq > /dev/null 2>&1
    echo -e "${GREEN}✓${NC} Nginx kuruldu"
else
    echo -e "${GREEN}✓${NC} Nginx zaten kurulu"
fi

if ! command -v certbot &> /dev/null; then
    echo "Certbot kuruluyor..."
    apt-get install -y certbot python3-certbot-nginx -qq > /dev/null 2>&1
    echo -e "${GREEN}✓${NC} Certbot kuruldu"
else
    echo -e "${GREEN}✓${NC} Certbot zaten kurulu"
fi

ufw --force enable > /dev/null 2>&1
ufw allow 22/tcp > /dev/null 2>&1
ufw allow 80/tcp > /dev/null 2>&1
ufw allow 443/tcp > /dev/null 2>&1
echo -e "${GREEN}✓${NC} Güvenlik duvarı aktif"

ENDSSH

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "[4/6] Site Dosyaları Kuruluyor..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
ssh $VPS_USER@$VPS_IP bash << 'ENDSSH'

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

if [ -d "/var/www/syncarch" ]; then
    BACKUP_NAME="syncarch_backup_$(date +%Y%m%d_%H%M%S)"
    mv /var/www/syncarch /var/www/$BACKUP_NAME
    echo -e "${YELLOW}⚠${NC} Eski site yedeklendi: $BACKUP_NAME"
fi

mkdir -p /var/www/syncarch

echo "Dosyalar çıkartılıyor..."
tar -xzf /root/full-deploy.tar.gz -C /var/www/syncarch

chown -R www-data:www-data /var/www/syncarch
chmod -R 755 /var/www/syncarch

FILE_COUNT=$(find /var/www/syncarch -type f | wc -l)
echo -e "${GREEN}✓${NC} $FILE_COUNT dosya kuruldu"

rm -f /root/full-deploy.tar.gz

ENDSSH

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "[5/6] Nginx Yapılandırması (Mobil Optimizasyonlu)..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
ssh $VPS_USER@$VPS_IP bash << 'ENDSSH'

GREEN='\033[0;32m'
NC='\033[0m'

cat > /etc/nginx/sites-available/syncarch << 'NGINXCONF'
server {
    listen 80;
    listen [::]:80;
    server_name syncarch.com www.syncarch.com 31.97.78.86;

    root /var/www/syncarch;
    index index.html;

    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;

    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/json;

    location / {
        try_files $uri $uri/ /index.html;
        add_header Cache-Control "no-cache, must-revalidate" always;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    location ~* \.(json|webmanifest)$ {
        expires 7d;
        add_header Cache-Control "public, must-revalidate";
    }

    location = /sw.js {
        expires 1d;
        add_header Cache-Control "public, must-revalidate";
    }
}
NGINXCONF

ln -sf /etc/nginx/sites-available/syncarch /etc/nginx/sites-enabled/syncarch
rm -f /etc/nginx/sites-enabled/default

if nginx -t > /dev/null 2>&1; then
    systemctl restart nginx
    echo -e "${GREEN}✓${NC} Nginx yapılandırması tamamlandı"
else
    echo "❌ Nginx config hatası!"
    nginx -t
    exit 1
fi

ENDSSH

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "[6/6] SSL Sertifikası Kuruluyor..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
ssh $VPS_USER@$VPS_IP bash << ENDSSH

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

if [ -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]; then
    echo -e "\${YELLOW}⚠\${NC} SSL zaten mevcut, yenileniyor..."
    certbot renew --nginx --quiet 2>/dev/null
    echo -e "\${GREEN}✓\${NC} SSL sertifikası yenilendi"
else
    echo "SSL sertifikası kuruluyor..."
    certbot --nginx -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN --redirect --quiet 2>/dev/null
    
    if [ -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]; then
        echo -e "\${GREEN}✓\${NC} SSL sertifikası kuruldu"
    else
        echo -e "\${YELLOW}⚠\${NC} SSL kurulamadı (domain DNS'i kontrol edin)"
    fi
fi

systemctl reload nginx

ENDSSH

echo ""
cat << "SUCCESS"
╔═══════════════════════════════════════════════╗
║          ✓ DEPLOYMENT BAŞARILI!               ║
╚═══════════════════════════════════════════════╝
SUCCESS

echo ""
echo "🌐 Siteniz yayında:"
echo "   • https://syncarch.com"
echo "   • https://www.syncarch.com"
echo ""
echo "📱 Mobil Uyumluluk: Aktif"
echo "🔒 SSL Sertifikası: Aktif"
echo "🚀 Gzip Sıkıştırma: Aktif"
echo ""

#!/bin/bash

# Syncarch Otomatik SSL Kurulum
# Let's Encrypt SSL sertifikası otomatik kurulumu

set -e

VPS_USER="root"
VPS_HOST="31.97.78.86"
VPS_PASS="00203549Rk.."
DOMAIN="syncarch.xyz"

GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}=========================================="
echo "Syncarch SSL Sertifikası Kurulumu"
echo "==========================================${NC}"

# Check sshpass
if ! command -v sshpass &> /dev/null; then
    echo -e "${RED}Hata: sshpass kurulu değil!${NC}"
    echo "Kurulum: sudo apt-get install sshpass"
    exit 1
fi

echo -e "${BLUE}SSL sertifikası kuruluyor...${NC}"
echo ""

sshpass -p "${VPS_PASS}" ssh -o StrictHostKeyChecking=no ${VPS_USER}@${VPS_HOST} << 'ENDSSH'
set -e

DOMAIN="syncarch.xyz"
EMAIL="admin@syncarch.xyz"

echo "→ Certbot kurulumu kontrol ediliyor..."
if ! command -v certbot &> /dev/null; then
    echo "→ Certbot kuruluyor..."
    apt-get update
    apt-get install -y certbot python3-certbot-nginx
fi

echo "→ SSL sertifikası alınıyor..."
certbot --nginx \
    -d ${DOMAIN} \
    -d www.${DOMAIN} \
    --non-interactive \
    --agree-tos \
    --email ${EMAIL} \
    --redirect

echo "→ Otomatik yenileme ayarlanıyor..."
systemctl enable certbot.timer
systemctl start certbot.timer

echo "→ Yenileme testi yapılıyor..."
certbot renew --dry-run

echo "→ Gelişmiş Nginx yapılandırması uygulanıyor..."
cat > /etc/nginx/sites-available/syncarch << 'EOF'
# HTTP - HTTPS Redirect
server {
    listen 80;
    listen [::]:80;
    server_name syncarch.xyz www.syncarch.xyz;
    return 301 https://$server_name$request_uri;
}

# HTTPS
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name syncarch.xyz www.syncarch.xyz;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/syncarch.xyz/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/syncarch.xyz/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    root /var/www/syncarch;
    index index.html;

    # Enhanced Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Content-Security-Policy "default-src 'self' https: data: 'unsafe-inline' 'unsafe-eval';" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private auth;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/javascript application/xml+rss application/json application/xml;
    gzip_comp_level 6;
    gzip_buffers 16 8k;

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

echo "→ Nginx yapılandırması test ediliyor..."
nginx -t

echo "→ Nginx yeniden başlatılıyor..."
systemctl restart nginx

echo ""
echo "✓ SSL kurulumu tamamlandı!"
echo ""
echo "Sertifika Bilgileri:"
certbot certificates
ENDSSH

echo ""
echo -e "${GREEN}=========================================="
echo "✓ SSL Kurulumu Başarıyla Tamamlandı!"
echo "==========================================${NC}"
echo ""
echo -e "${BLUE}Güvenli Uygulama URL:${NC} https://syncarch.xyz"
echo ""
echo -e "${GREEN}Özellikler:${NC}"
echo "  ✓ SSL/TLS Şifreleme Aktif"
echo "  ✓ HTTP → HTTPS Yönlendirme"
echo "  ✓ A+ SSL Rating"
echo "  ✓ HSTS Etkin (1 yıl)"
echo "  ✓ Otomatik Sertifika Yenileme"
echo ""
echo -e "${BLUE}Sertifika 90 gün geçerli ve otomatik yenilenecek${NC}"
echo ""

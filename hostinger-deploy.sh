#!/bin/bash

# SyncArch - Hostinger VPS Deployment Script

echo "=========================================="
echo "  SyncArch - VPS Deployment"
echo "=========================================="
echo ""

# VPS bilgilerini kullanıcıdan al
read -p "VPS IP Adresi: " VPS_IP
read -p "SSH Kullanıcı Adı (genellikle root): " SSH_USER
read -p "Domain adınız (örn: syncarch.com): " DOMAIN

echo ""
echo "Bağlantı bilgileri:"
echo "IP: $VPS_IP"
echo "User: $SSH_USER"
echo "Domain: $DOMAIN"
echo ""
read -p "Devam etmek için Enter'a basın..."

# VPS'e dosyaları yükle
echo ""
echo "[1/5] Dosyalar VPS'e yükleniyor..."
scp hostinger-deploy.tar.gz $SSH_USER@$VPS_IP:/tmp/

# VPS'de kurulum
echo ""
echo "[2/5] VPS'de gerekli paketler kuruluyor..."
ssh $SSH_USER@$VPS_IP << 'ENDSSH'
# Paketleri güncelle
apt update && apt upgrade -y

# Nginx ve Node.js kur
apt install -y nginx nodejs npm

# PM2 kur (process manager)
npm install -g pm2

# Site dizini oluştur
mkdir -p /var/www/syncarch
cd /tmp
tar -xzf hostinger-deploy.tar.gz -C /var/www/syncarch/

# Node modülleri kur
cd /var/www/syncarch
npm install --production

ENDSSH

echo ""
echo "[3/5] Nginx yapılandırması..."
ssh $SSH_USER@$VPS_IP << ENDSSH2
# Nginx config oluştur
cat > /etc/nginx/sites-available/syncarch << 'EOF'
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;

    root /var/www/syncarch/dist;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    location / {
        try_files \$uri \$uri/ /index.html;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF

# Siteyi etkinleştir
ln -sf /etc/nginx/sites-available/syncarch /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Nginx'i test et ve başlat
nginx -t
systemctl restart nginx
systemctl enable nginx

ENDSSH2

echo ""
echo "[4/5] SSL sertifikası kuruluyor (Let's Encrypt)..."
ssh $SSH_USER@$VPS_IP << ENDSSH3
# Certbot kur
apt install -y certbot python3-certbot-nginx

# SSL sertifikası al
certbot --nginx -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN --redirect

ENDSSH3

echo ""
echo "[5/5] Güvenlik duvarı ayarları..."
ssh $SSH_USER@$VPS_IP << 'ENDSSH4'
# UFW kur ve ayarla
apt install -y ufw
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

ENDSSH4

echo ""
echo "=========================================="
echo "  ✅ DEPLOYMENT TAMAMLANDI!"
echo "=========================================="
echo ""
echo "Siteniz hazır: https://$DOMAIN"
echo ""
echo "Yararlı komutlar:"
echo "  - Nginx restart: systemctl restart nginx"
echo "  - Nginx loglar: tail -f /var/log/nginx/access.log"
echo "  - SSL yenile: certbot renew"
echo ""
echo "VPS'e bağlan: ssh $SSH_USER@$VPS_IP"
echo ""

#!/bin/bash

# SyncArch VPS Deployment Script - Latest Version
# syncarch.xyz | 31.97.78.86

set -e

echo "🚀 SyncArch VPS Güncellemesi Başlıyor..."

# VPS Bilgileri
VPS_IP="31.97.78.86"
VPS_USER="root"
DOMAIN="syncarch.xyz"
APP_DIR="/var/www/syncarch"

echo ""
echo "📦 Deployment paketi kontrol ediliyor..."
if [ ! -f "syncarch-vps-latest.tar.gz" ]; then
    echo "❌ syncarch-vps-latest.tar.gz bulunamadı!"
    echo "Önce 'npm run build' komutunu çalıştırın."
    exit 1
fi

echo "✓ Paket hazır"
echo ""
echo "📤 VPS'e yükleme başlıyor..."
echo "   IP: $VPS_IP"
echo "   Domain: $DOMAIN"
echo ""

# VPS'e bağlanıp deployment yapacak komutlar
cat << 'DEPLOYMENT_SCRIPT' > /tmp/vps-deploy-commands.sh
#!/bin/bash
set -e

APP_DIR="/var/www/syncarch"

echo "📁 Dizinler hazırlanıyor..."
mkdir -p $APP_DIR
cd $APP_DIR

# Mevcut uygulamayı yedekle
if [ -d "dist" ]; then
    echo "💾 Mevcut versiyon yedekleniyor..."
    BACKUP_DIR="backup-$(date +%Y%m%d-%H%M%S)"
    mkdir -p $BACKUP_DIR
    [ -d "dist" ] && cp -r dist $BACKUP_DIR/
    [ -d "public" ] && cp -r public $BACKUP_DIR/
    [ -d "server" ] && cp -r server $BACKUP_DIR/
    echo "✓ Yedek oluşturuldu: $BACKUP_DIR"
fi

echo ""
echo "📦 Yeni versiyon çıkarılıyor..."
tar -xzf /tmp/syncarch-vps-latest.tar.gz -C $APP_DIR
rm -f /tmp/syncarch-vps-latest.tar.gz

echo ""
echo "📦 Node modülleri kuruluyor..."
npm install --production

echo ""
echo "🔄 PM2 servisi yenileniyor..."
if pm2 describe syncarch > /dev/null 2>&1; then
    echo "   Mevcut servis yeniden başlatılıyor..."
    pm2 restart syncarch
else
    echo "   Yeni servis başlatılıyor..."
    pm2 start server/index.js --name syncarch
fi

pm2 save

echo ""
echo "🌐 Nginx yapılandırması kontrol ediliyor..."
if [ ! -f /etc/nginx/sites-available/syncarch ]; then
    echo "   Nginx config oluşturuluyor..."
    cat > /etc/nginx/sites-available/syncarch << 'NGINX_CONFIG'
server {
    listen 80;
    listen [::]:80;
    server_name syncarch.xyz www.syncarch.xyz;

    root /var/www/syncarch/dist;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json application/javascript;

    # SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API proxy
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Static files caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
NGINX_CONFIG

    ln -sf /etc/nginx/sites-available/syncarch /etc/nginx/sites-enabled/
    nginx -t && systemctl reload nginx
    echo "   ✓ Nginx yapılandırıldı"
else
    echo "   ✓ Nginx zaten yapılandırılmış"
    nginx -t && systemctl reload nginx
fi

echo ""
echo "🔒 SSL sertifikası kontrol ediliyor..."
if ! certbot certificates 2>/dev/null | grep -q "syncarch.xyz"; then
    echo "   SSL sertifikası oluşturuluyor..."
    certbot --nginx -d syncarch.xyz -d www.syncarch.xyz --non-interactive --agree-tos --email admin@syncarch.xyz
else
    echo "   ✓ SSL sertifikası mevcut"
fi

echo ""
echo "✅ DEPLOYMENT TAMAMLANDI!"
echo ""
echo "📊 Servis Durumu:"
pm2 list
echo ""
echo "🌐 Uygulama Adresleri:"
echo "   • https://syncarch.xyz"
echo "   • http://31.97.78.86"
echo ""
echo "📝 Logları görüntülemek için:"
echo "   pm2 logs syncarch"
echo ""
DEPLOYMENT_SCRIPT

chmod +x /tmp/vps-deploy-commands.sh

echo "Şifre: 00203549Rk.."
echo ""
echo "1️⃣ Dosya yükleniyor..."
scp syncarch-vps-latest.tar.gz ${VPS_USER}@${VPS_IP}:/tmp/

echo ""
echo "2️⃣ Deployment script yükleniyor..."
scp /tmp/vps-deploy-commands.sh ${VPS_USER}@${VPS_IP}:/tmp/

echo ""
echo "3️⃣ Deployment çalıştırılıyor..."
ssh ${VPS_USER}@${VPS_IP} 'bash /tmp/vps-deploy-commands.sh'

echo ""
echo "🎉 DEPLOYMENT BAŞARILI!"
echo ""
echo "🌐 Uygulamanız şu adreste yayında:"
echo "   https://syncarch.xyz"
echo ""

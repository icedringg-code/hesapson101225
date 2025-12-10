#!/bin/bash

# VPS Otomatik Deployment Script
# Bu script projeyi build edip VPS'e upload eder ve çalıştırır

set -e

VPS_HOST="31.97.78.86"
VPS_USER="root"
VPS_PASSWORD="00203549Rk.."
VPS_PATH="/var/www/syncarch-is-takip"
DOMAIN="istakip.syncarch.com"

echo "🚀 SyncArch İş Takip - VPS Otomatik Deployment Başlatılıyor..."
echo "=================================================="

# Deployment package oluştur
echo "📦 Deployment package oluşturuluyor..."
tar -czf vps-deployment.tar.gz \
  dist/ \
  server/ \
  package.json \
  package-lock.json \
  .env.production \
  public/

echo "✅ Package oluşturuldu: vps-deployment.tar.gz"

# SCP ile dosyaları upload et
echo "📤 Dosyalar VPS'e yükleniyor..."
sshpass -p "$VPS_PASSWORD" scp -o StrictHostKeyChecking=no vps-deployment.tar.gz ${VPS_USER}@${VPS_HOST}:/tmp/

# SSH ile VPS'te kurulum komutlarını çalıştır
echo "🔧 VPS'te kurulum yapılıyor..."
sshpass -p "$VPS_PASSWORD" ssh -o StrictHostKeyChecking=no ${VPS_USER}@${VPS_HOST} << 'ENDSSH'

echo "📂 Proje dizini hazırlanıyor..."
mkdir -p /var/www/syncarch-is-takip
cd /var/www/syncarch-is-takip

# Eski dosyaları yedekle
if [ -d "dist" ]; then
    echo "💾 Eski dosyalar yedekleniyor..."
    tar -czf backup-$(date +%Y%m%d-%H%M%S).tar.gz dist/ server/ 2>/dev/null || true
fi

# Yeni dosyaları çıkar
echo "📦 Yeni dosyalar çıkartılıyor..."
tar -xzf /tmp/vps-deployment.tar.gz
rm /tmp/vps-deployment.tar.gz

# Node.js ve npm kontrol et
if ! command -v node &> /dev/null; then
    echo "📥 Node.js kuruluyor..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
fi

# Dependencies yükle
echo "📦 Dependencies yükleniyor..."
npm ci --production

# PM2 yükle (yoksa)
if ! command -v pm2 &> /dev/null; then
    echo "📥 PM2 kuruluyor..."
    npm install -g pm2
fi

# Backend'i PM2 ile başlat
echo "🚀 Backend başlatılıyor..."
pm2 delete syncarch-backend 2>/dev/null || true
pm2 start server/index.js --name syncarch-backend
pm2 save
pm2 startup

# Nginx kurulu değilse kur
if ! command -v nginx &> /dev/null; then
    echo "📥 Nginx kuruluyor..."
    apt-get update
    apt-get install -y nginx
fi

# Nginx config oluştur
echo "⚙️  Nginx yapılandırılıyor..."
cat > /etc/nginx/sites-available/syncarch << 'EOF'
server {
    listen 80;
    server_name istakip.syncarch.com 31.97.78.86;

    root /var/www/syncarch-is-takip/dist;
    index index.html;

    # Frontend
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:3000/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Static dosyalar için cache
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
}
EOF

# Nginx config aktifleştir
ln -sf /etc/nginx/sites-available/syncarch /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Nginx test ve restart
nginx -t && systemctl restart nginx

echo ""
echo "=================================================="
echo "✅ DEPLOYMENT TAMAMLANDI!"
echo "=================================================="
echo ""
echo "🌐 Site URL'leri:"
echo "   - http://istakip.syncarch.com"
echo "   - http://31.97.78.86"
echo ""
echo "📊 Servis Durumu:"
pm2 status
echo ""
echo "💡 Faydalı Komutlar:"
echo "   - Backend logları: pm2 logs syncarch-backend"
echo "   - Backend restart: pm2 restart syncarch-backend"
echo "   - Nginx logları: tail -f /var/log/nginx/error.log"
echo "   - Nginx restart: systemctl restart nginx"
echo ""

ENDSSH

echo ""
echo "=================================================="
echo "🎉 DEPLOYMENT BAŞARILI!"
echo "=================================================="
echo ""
echo "🌐 Siteniz şu adreslerde yayında:"
echo "   - http://istakip.syncarch.com"
echo "   - http://31.97.78.86"
echo ""
echo "📝 Notlar:"
echo "   - SSL sertifikası için: sudo certbot --nginx -d istakip.syncarch.com"
echo "   - Backend otomatik başlatılıyor (PM2 ile)"
echo "   - Nginx reverse proxy yapılandırıldı"
echo ""

# Cleanup
rm -f vps-deployment.tar.gz

echo "✨ Kurulum tamamlandı! Site hazır."

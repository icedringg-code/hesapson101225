#!/bin/bash

# VPS'e tek komutla deployment
# Bu scripti çalıştırmak için terminal emülatörü gerekli (expect benzeri)

echo "🚀 SyncArch İş Takip - VPS'e Yükleniyor..."
echo "=========================================="

VPS_HOST="31.97.78.86"
VPS_USER="root"
VPS_PASS="00203549Rk.."

# Paket kontrolü
if [ ! -f "vps-deployment.tar.gz" ]; then
    echo "❌ vps-deployment.tar.gz bulunamadı!"
    exit 1
fi

echo "✅ Deployment paketi hazır ($(ls -lh vps-deployment.tar.gz | awk '{print $5}'))"
echo ""
echo "📤 Şimdi dosyayı VPS'e yükleyeceğiz..."
echo "Şifre istendiğinde: 00203549Rk.."
echo ""
read -p "Devam etmek için ENTER'a basın..."

# SCP ile yükle
scp -o StrictHostKeyChecking=no vps-deployment.tar.gz ${VPS_USER}@${VPS_HOST}:/tmp/

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Dosya başarıyla yüklendi!"
    echo ""
    echo "🔧 Şimdi VPS'te kurulum yapılacak..."
    echo "Şifre istendiğinde: 00203549Rk.."
    echo ""
    read -p "Devam etmek için ENTER'a basın..."

    # SSH ile kurulum komutlarını çalıştır
    ssh -o StrictHostKeyChecking=no ${VPS_USER}@${VPS_HOST} << 'ENDSSH'

set -e

echo "📂 Proje dizini hazırlanıyor..."
mkdir -p /var/www/syncarch-is-takip
cd /var/www/syncarch-is-takip

if [ -d "dist" ]; then
    echo "💾 Eski dosyalar yedekleniyor..."
    tar -czf backup-$(date +%Y%m%d-%H%M%S).tar.gz dist/ server/ 2>/dev/null || true
fi

echo "📦 Yeni dosyalar çıkartılıyor..."
tar -xzf /tmp/vps-deployment.tar.gz
rm /tmp/vps-deployment.tar.gz

if ! command -v node &> /dev/null; then
    echo "📥 Node.js kuruluyor..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
    echo "✅ Node.js kuruldu: $(node --version)"
fi

echo "📦 Dependencies yükleniyor..."
npm ci --production || npm install --production

if ! command -v pm2 &> /dev/null; then
    echo "📥 PM2 kuruluyor..."
    npm install -g pm2
fi

echo "🚀 Backend başlatılıyor..."
pm2 delete syncarch-backend 2>/dev/null || true
pm2 start server/index.js --name syncarch-backend
pm2 save
pm2 startup || true

if ! command -v nginx &> /dev/null; then
    echo "📥 Nginx kuruluyor..."
    apt-get update
    apt-get install -y nginx
fi

echo "⚙️  Nginx yapılandırılıyor..."
cat > /etc/nginx/sites-available/syncarch << 'NGINXEOF'
server {
    listen 80;
    server_name istakip.syncarch.com 31.97.78.86;

    root /var/www/syncarch-is-takip/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

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

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
}
NGINXEOF

ln -sf /etc/nginx/sites-available/syncarch /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

echo "🔄 Nginx test ediliyor..."
nginx -t

echo "🔄 Nginx yeniden başlatılıyor..."
systemctl restart nginx

echo ""
echo "=================================================="
echo "✅ DEPLOYMENT TAMAMLANDI!"
echo "=================================================="
echo ""
echo "🌐 Site URL'leri:"
echo "   • http://istakip.syncarch.com"
echo "   • http://31.97.78.86"
echo ""
echo "📊 Backend Durumu:"
pm2 status
echo ""
echo "💡 Faydalı Komutlar:"
echo "   • Backend logları: pm2 logs syncarch-backend"
echo "   • Backend restart: pm2 restart syncarch-backend"
echo "   • Nginx logları: tail -f /var/log/nginx/error.log"
echo ""
echo "🔒 SSL Sertifikası için:"
echo "   • certbot --nginx -d istakip.syncarch.com"
echo ""

ENDSSH

    if [ $? -eq 0 ]; then
        echo ""
        echo "=================================================="
        echo "🎉 BAŞARILI!"
        echo "=================================================="
        echo ""
        echo "Siteniz hazır:"
        echo "• http://istakip.syncarch.com"
        echo "• http://31.97.78.86"
        echo ""
    else
        echo ""
        echo "❌ Kurulum sırasında hata oluştu!"
    fi
else
    echo ""
    echo "❌ Dosya yükleme hatası!"
fi

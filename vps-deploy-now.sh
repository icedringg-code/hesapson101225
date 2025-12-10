#!/bin/bash

VPS="root@31.97.78.86"
PACKAGE="syncarch-vps-latest.tar.gz"

echo ""
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║         SyncArch VPS Deployment                          ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""
echo "📤 ADIM 1/2: Paket yükleniyor..."
echo "   Şifre: 00203549Rk.."
echo ""

scp -o StrictHostKeyChecking=no "$PACKAGE" "$VPS:/tmp/"

if [ $? -ne 0 ]; then
    echo ""
    echo "❌ Yükleme hatası!"
    exit 1
fi

echo ""
echo "✓ Paket yüklendi"
echo ""
echo "══════════════════════════════════════════════════════════"
echo "🔧 ADIM 2/2: Deployment çalıştırılıyor..."
echo "   Şifre: 00203549Rk.."
echo "══════════════════════════════════════════════════════════"
echo ""

ssh -o StrictHostKeyChecking=no "$VPS" << 'REMOTE_EOF'
set -e
cd /var/www/syncarch || mkdir -p /var/www/syncarch && cd /var/www/syncarch

echo "💾 Yedekleme..."
if [ -d "dist" ]; then
    BACKUP=backup-$(date +%Y%m%d-%H%M%S)
    mkdir -p "$BACKUP"
    cp -r dist/ "$BACKUP/" 2>/dev/null || true
    echo "✓ Yedek: $BACKUP"
fi

echo ""
echo "📦 Dosyalar çıkarılıyor..."
tar -xzf /tmp/syncarch-vps-latest.tar.gz -C /var/www/syncarch
rm -f /tmp/syncarch-vps-latest.tar.gz
echo "✓ Dosyalar çıkarıldı"

echo ""
echo "📦 Node modülleri kuruluyor..."
npm install --production --silent 2>&1 | grep -v "npm WARN" || true
echo "✓ Bağımlılıklar kuruldu"

echo ""
echo "🔄 PM2 güncelleniyor..."
pm2 restart syncarch 2>/dev/null || pm2 start server/index.js --name syncarch
pm2 save > /dev/null 2>&1
echo "✓ PM2 güncellendi"

echo ""
echo "🌐 Nginx kontrol..."
if [ ! -f /etc/nginx/sites-available/syncarch ]; then
    cat > /etc/nginx/sites-available/syncarch << 'NGINX_EOF'
server {
    listen 80;
    listen [::]:80;
    server_name syncarch.xyz www.syncarch.xyz;

    root /var/www/syncarch/dist;
    index index.html;

    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json application/javascript;

    location / {
        try_files $uri $uri/ /index.html;
    }

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

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
NGINX_EOF
    ln -sf /etc/nginx/sites-available/syncarch /etc/nginx/sites-enabled/
fi

nginx -t > /dev/null 2>&1 && systemctl reload nginx
echo "✓ Nginx yenilendi"

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "✅ DEPLOYMENT TAMAMLANDI!"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "📊 Servis Durumu:"
pm2 list

echo ""
echo "🌐 Uygulama Adresleri:"
echo "   • https://syncarch.xyz"
echo "   • http://31.97.78.86"
REMOTE_EOF

echo ""
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║                  🎉 BAŞARILI! 🎉                         ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""
echo "🌐 https://syncarch.xyz"
echo ""
echo "✨ Yeni Özellikler Aktif:"
echo "   • Türk piyasası API entegrasyonu"
echo "   • Gerçek zamanlı altın fiyatları"
echo "   • Güncel döviz kurları"
echo "   • Otomatik fallback"

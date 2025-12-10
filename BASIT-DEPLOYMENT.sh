#!/bin/bash

# SyncArch VPS Basit Deployment
# Kullanıcı şifre girecek (interaktif)

set -e

echo ""
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║         SyncArch VPS Deployment - syncarch.xyz           ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""

VPS_IP="31.97.78.86"
VPS_USER="root"
DOMAIN="syncarch.xyz"
PACKAGE="syncarch-vps-latest.tar.gz"

# Paket kontrolü
if [ ! -f "$PACKAGE" ]; then
    echo "❌ HATA: $PACKAGE bulunamadı!"
    echo ""
    echo "Önce build yapın:"
    echo "  npm run build"
    exit 1
fi

echo "✓ Paket hazır: $PACKAGE"
echo "  IP: $VPS_IP"
echo "  Domain: $DOMAIN"
echo ""
echo "⚠️  NOT: İşlem sırasında VPS şifresi 2 kez istenecek!"
echo "  Şifre: 00203549Rk.."
echo ""
read -p "Devam etmek için ENTER'a basın..."

echo ""
echo "══════════════════════════════════════════════════════════"
echo "📤 ADIM 1/2: Paket VPS'e yükleniyor..."
echo "══════════════════════════════════════════════════════════"
echo ""
echo "Şifre: 00203549Rk.."
echo ""

scp -o StrictHostKeyChecking=no "$PACKAGE" ${VPS_USER}@${VPS_IP}:/tmp/

if [ $? -ne 0 ]; then
    echo ""
    echo "❌ Dosya yüklenemedi!"
    exit 1
fi

echo ""
echo "✓ Paket başarıyla yüklendi!"
echo ""
echo "══════════════════════════════════════════════════════════"
echo "🔧 ADIM 2/2: Deployment çalıştırılıyor..."
echo "══════════════════════════════════════════════════════════"
echo ""
echo "Şifre: 00203549Rk.."
echo ""

ssh -o StrictHostKeyChecking=no ${VPS_USER}@${VPS_IP} << 'REMOTE_COMMANDS'
set -e

echo ""
echo "📁 Uygulama dizinine geçiliyor..."
cd /var/www/syncarch || mkdir -p /var/www/syncarch
cd /var/www/syncarch

echo ""
echo "💾 Mevcut versiyon yedekleniyor..."
BACKUP_DIR="backup-$(date +%Y%m%d-%H%M%S)"
mkdir -p $BACKUP_DIR

if [ -d "dist" ]; then
    cp -r dist $BACKUP_DIR/ 2>/dev/null || true
    echo "✓ Yedek alındı: $BACKUP_DIR"
else
    echo "  (İlk kurulum - yedek yok)"
fi

echo ""
echo "📦 Yeni versiyon çıkarılıyor..."
tar -xzf /tmp/syncarch-vps-latest.tar.gz -C /var/www/syncarch
rm -f /tmp/syncarch-vps-latest.tar.gz
echo "✓ Dosyalar çıkarıldı"

echo ""
echo "📦 Bağımlılıklar kuruluyor..."
npm install --production --silent
echo "✓ Bağımlılıklar kuruldu"

echo ""
echo "🔄 PM2 servisi güncelleniyor..."
pm2 restart syncarch 2>/dev/null || pm2 start server/index.js --name syncarch
pm2 save > /dev/null 2>&1
echo "✓ PM2 güncellendi"

echo ""
echo "🌐 Nginx yapılandırması kontrol ediliyor..."

if [ ! -f /etc/nginx/sites-available/syncarch ]; then
    echo "  Nginx config oluşturuluyor..."
    cat > /etc/nginx/sites-available/syncarch << 'NGINX_CONFIG'
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
NGINX_CONFIG

    ln -sf /etc/nginx/sites-available/syncarch /etc/nginx/sites-enabled/
    nginx -t && systemctl reload nginx
    echo "  ✓ Nginx yapılandırıldı"
else
    echo "  Nginx zaten yapılandırılmış, yenileniyor..."
    nginx -t && systemctl reload nginx
    echo "  ✓ Nginx yenilendi"
fi

echo ""
echo "🔒 SSL kontrolü..."
if ! certbot certificates 2>/dev/null | grep -q "syncarch.xyz"; then
    echo "  SSL sertifikası kurulacak..."
    certbot --nginx -d syncarch.xyz -d www.syncarch.xyz --non-interactive --agree-tos --email admin@syncarch.xyz 2>/dev/null || echo "  ⚠️  SSL manuel kurulum gerekebilir"
else
    echo "  ✓ SSL sertifikası mevcut"
fi

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
echo ""
echo "📝 Logları görüntülemek için:"
echo "   pm2 logs syncarch"
echo ""
echo "🔄 Servisi yeniden başlatmak için:"
echo "   pm2 restart syncarch"
echo ""
REMOTE_COMMANDS

if [ $? -eq 0 ]; then
    echo ""
    echo "╔═══════════════════════════════════════════════════════════╗"
    echo "║                  🎉 BAŞARILI! 🎉                         ║"
    echo "╚═══════════════════════════════════════════════════════════╝"
    echo ""
    echo "Uygulamanız yayında:"
    echo "  🌐 https://syncarch.xyz"
    echo ""
    echo "Yeni özellikler:"
    echo "  ✓ Türk piyasası API entegrasyonu"
    echo "  ✓ Gerçek zamanlı altın fiyatları"
    echo "  ✓ Güncel döviz kurları (USD/TRY, EUR/TRY)"
    echo "  ✓ Otomatik fallback mekanizması"
    echo ""
else
    echo ""
    echo "⚠️  Deployment sırasında bazı hatalar oluştu!"
    echo "Logları kontrol edin: ssh root@31.97.78.86 'pm2 logs syncarch'"
fi

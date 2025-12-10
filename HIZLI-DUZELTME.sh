#!/bin/bash

# SyncArch Hızlı Düzeltme Script
# Failed to fetch hatası için

set -e

echo "🔧 SyncArch - Hızlı Düzeltme"
echo "============================"
echo ""

if [ ! -f "vps-update.tar.gz" ]; then
    echo "❌ vps-update.tar.gz bulunamadı!"
    exit 1
fi

echo "📤 Dosyalar VPS'e yükleniyor..."
scp -o StrictHostKeyChecking=no vps-update.tar.gz root@31.97.78.86:/tmp/
scp -o StrictHostKeyChecking=no nginx-syncarch.conf root@31.97.78.86:/tmp/

echo ""
echo "🔧 VPS'te düzeltmeler uygulanıyor..."
echo "Şifre: 00203549Rk.."
echo ""

ssh -o StrictHostKeyChecking=no root@31.97.78.86 << 'ENDSSH'
set -e

echo "📂 Proje dizini: /var/www/syncarch-is-takip"
cd /var/www/syncarch-is-takip

echo "💾 Yedek alınıyor..."
tar -czf backup-$(date +%Y%m%d-%H%M%S).tar.gz dist/ server/ 2>/dev/null || true

echo "📦 Yeni dosyalar çıkartılıyor..."
tar -xzf /tmp/vps-update.tar.gz
rm /tmp/vps-update.tar.gz

# .env dosyasını ayarla
if [ -f ".env.production" ]; then
    cp .env.production .env
fi

# Database bilgilerini ekle
cat > .env << 'EOF'
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl3a2phaGpwbWN2YnlnbXBidnJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ5MTYyNTQsImV4cCI6MjA4MDQ5MjI1NH0.b0CyNxBMHbZeivT7sQpBOtRFiSW4fJ_DVcUp4blm1IY
VITE_SUPABASE_URL=https://ywkjahjpmcvbygmpbvrr.supabase.co
VITE_API_URL=https://syncarch.xyz

OPENAI_API_KEY=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
PORT=3001

DB_HOST=31.97.78.86
DB_PORT=5432
DB_NAME=syncarch_db
DB_USER=syncarch_user
DB_PASSWORD=SyncArch2025!Secure
EOF

echo "✅ .env ayarlandı"

echo "📦 Dependencies yükleniyor..."
npm ci --production 2>&1 | tail -10 || npm install --production 2>&1 | tail -10

echo "🌐 Nginx yapılandırması güncelleniyor..."
cp /tmp/nginx-syncarch.conf /etc/nginx/sites-available/syncarch.xyz
ln -sf /etc/nginx/sites-available/syncarch.xyz /etc/nginx/sites-enabled/ 2>/dev/null || true
rm -f /tmp/nginx-syncarch.conf

echo "✅ Nginx test ediliyor..."
nginx -t

echo "🔄 Backend yeniden başlatılıyor..."
pm2 delete syncarch-backend 2>/dev/null || true
pm2 start server/index.js --name syncarch-backend
pm2 save

echo "⏳ Backend başlaması bekleniyor (5 saniye)..."
sleep 5

echo "🔄 Nginx yeniden yükleniyor..."
systemctl reload nginx

echo ""
echo "======================================"
echo "✅ DÜZELTME TAMAMLANDI!"
echo "======================================"
echo ""

echo "📊 Backend Durumu:"
pm2 status

echo ""
echo "🔌 Backend Port Kontrolü:"
netstat -tlnp | grep :3001 || echo "⚠️  Backend henüz başlamadı"

echo ""
echo "🌐 Site: https://syncarch.xyz"
echo ""
echo "📝 Backend logları için:"
echo "   pm2 logs syncarch-backend"
echo ""

ENDSSH

echo ""
echo "======================================"
echo "🎉 İşlem Tamamlandı!"
echo "======================================"
echo ""
echo "✅ Düzeltmeler uygulandı:"
echo "   • Backend yeniden başlatıldı"
echo "   • Nginx yapılandırması güncellendi"
echo "   • API endpoint'leri düzeltildi"
echo ""
echo "🌐 Test edin: https://syncarch.xyz"
echo ""
echo "❓ Hala sorun varsa:"
echo "   ssh root@31.97.78.86"
echo "   pm2 logs syncarch-backend"
echo ""

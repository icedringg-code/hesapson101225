#!/bin/bash

# VPS Durum Kontrolü
echo "🔍 VPS Durum Kontrolü"
echo "===================="

ssh root@31.97.78.86 << 'ENDSSH'
echo ""
echo "📊 Backend (PM2) Durumu:"
pm2 status

echo ""
echo "🔧 Backend Logları (son 20 satır):"
pm2 logs syncarch-backend --lines 20 --nostream

echo ""
echo "📁 Proje Dosyaları:"
ls -lah /var/www/syncarch-is-takip/ | head -15

echo ""
echo "🌐 Nginx Yapılandırması:"
cat /etc/nginx/sites-available/syncarch.xyz

echo ""
echo "✅ Nginx Test:"
nginx -t

echo ""
echo "🔌 Backend Port Kontrolü:"
netstat -tlnp | grep :3001 || echo "⚠️  Backend port 3001'de dinlemiyor!"

ENDSSH

#!/bin/bash

# VPS Deployment Script
# Bu script'i lokal bilgisayarınızda çalıştırın

VPS_HOST="31.97.78.86"
VPS_USER="root"
VPS_PASS="00203549Rk.."
PACKAGE="vps-voice-update.tar.gz"

echo "📦 Paketi VPS'e yüklüyorum..."

# SCP ile dosyayı yükle
sshpass -p "$VPS_PASS" scp -o StrictHostKeyChecking=no "$PACKAGE" ${VPS_USER}@${VPS_HOST}:/tmp/

if [ $? -ne 0 ]; then
    echo "❌ Dosya yükleme hatası!"
    echo ""
    echo "Manuel yükleme için:"
    echo "1. WinSCP ile ${VPS_HOST} adresine bağlanın"
    echo "2. ${PACKAGE} dosyasını /tmp/ klasörüne yükleyin"
    echo "3. Aşağıdaki komutları SSH ile çalıştırın:"
    echo ""
    cat << 'COMMANDS'
# Yedek al
cd /var/www/syncarch
cp -r html html.backup.$(date +%Y%m%d_%H%M%S)

# Yeni versiyonu kur
cd /tmp
tar -xzf vps-voice-update.tar.gz
rm -rf /var/www/syncarch/html/*
cp -r dist/* /var/www/syncarch/html/

# İzinleri düzelt
chown -R www-data:www-data /var/www/syncarch/html
chmod -R 755 /var/www/syncarch/html

# Nginx'i restart et
systemctl restart nginx

# Temizlik
rm -f /tmp/vps-voice-update.tar.gz
rm -rf /tmp/dist

echo "✅ Deployment tamamlandı!"
COMMANDS
    exit 1
fi

echo "✅ Paket yüklendi"
echo ""
echo "🚀 VPS'te deployment başlatılıyor..."

# SSH ile komutları çalıştır
sshpass -p "$VPS_PASS" ssh -o StrictHostKeyChecking=no ${VPS_USER}@${VPS_HOST} << 'ENDSSH'
set -e

echo "📁 Mevcut versiyon yedekleniyor..."
cd /var/www/syncarch
if [ -d "html" ]; then
    cp -r html html.backup.$(date +%Y%m%d_%H%M%S)
    echo "✅ Yedek alındı"
fi

echo "📦 Yeni versiyon kuruluyor..."
cd /tmp
tar -xzf vps-voice-update.tar.gz

echo "🔄 Dosyalar kopyalanıyor..."
rm -rf /var/www/syncarch/html/*
cp -r dist/* /var/www/syncarch/html/

echo "🔐 İzinler ayarlanıyor..."
chown -R www-data:www-data /var/www/syncarch/html
chmod -R 755 /var/www/syncarch/html

echo "🔄 Nginx restart ediliyor..."
systemctl restart nginx

echo "🧹 Temizlik yapılıyor..."
rm -f /tmp/vps-voice-update.tar.gz
rm -rf /tmp/dist

echo ""
echo "✅ DEPLOYMENT TAMAMLANDI!"
echo "🌐 Site aktif: https://syncarch.xyz"
echo ""
ENDSSH

if [ $? -eq 0 ]; then
    echo ""
    echo "=========================================="
    echo "✅ TÜM İŞLEMLER BAŞARIYLA TAMAMLANDI!"
    echo "=========================================="
    echo "🌐 Site: https://syncarch.xyz"
    echo "📱 Sesli asistan aktif"
    echo "=========================================="
else
    echo ""
    echo "❌ Deployment sırasında bir hata oluştu!"
fi

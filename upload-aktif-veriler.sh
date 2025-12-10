#!/bin/bash

echo "Aktif verileri VPS'e yüklüyorum..."

# VPS bilgileri
VPS_HOST="31.97.78.86"
VPS_USER="root"
VPS_PASS="SyncArch2025!Secure"
SITE_PATH="/var/www/syncarch"

# Upload işlemi
sshpass -p "$VPS_PASS" scp -o StrictHostKeyChecking=no dist-production.tar.gz $VPS_USER@$VPS_HOST:/tmp/

# VPS'te açma ve kurulum
sshpass -p "$VPS_PASS" ssh -o StrictHostKeyChecking=no $VPS_USER@$VPS_HOST << 'ENDSSH'
cd /var/www/syncarch

# Yedek al
if [ -d "dist" ]; then
    echo "Mevcut dist yedekleniyor..."
    mv dist dist.backup.$(date +%Y%m%d%H%M%S)
fi

# Yeni sürümü kur
echo "Yeni sürüm kuruluyor..."
mkdir -p dist
cd dist
tar -xzf /tmp/dist-production.tar.gz
rm /tmp/dist-production.tar.gz

# İzinleri ayarla
chown -R www-data:www-data /var/www/syncarch/dist
chmod -R 755 /var/www/syncarch/dist

# Nginx cache temizle
systemctl reload nginx

echo "✓ Aktif verilerle güncelleme tamamlandı!"
echo "Site: https://syncarch.xyz"
ENDSSH

echo ""
echo "✓ Güncelleme başarılı!"
echo "✓ Site artık aktif development verilerinizi kullanıyor"
echo ""
echo "Kontrol edin: https://syncarch.xyz"

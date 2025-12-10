#!/bin/bash

# VPS Deployment Script
# Bu script son sürümü VPS'e yükler

VPS_IP="31.97.78.86"
VPS_USER="root"
VPS_PASSWORD="00203549Rk.."
VPS_PATH="/var/www/syncarch"

echo "=========================================="
echo "VPS'e Son Sürüm Yükleniyor..."
echo "=========================================="

# 1. Build kontrolü
if [ ! -d "dist" ]; then
    echo "❌ dist klasörü bulunamadı. Önce build yapılıyor..."
    npm run build
fi

# 2. Tar dosyası oluştur
echo "📦 Dosyalar paketleniyor..."
tar -czf dist-update.tar.gz -C dist .

# 3. SCP ile yükle
echo "⬆️  VPS'e yükleniyor..."
scp -o StrictHostKeyChecking=no dist-update.tar.gz root@31.97.78.86:/tmp/

# 4. VPS'de dosyaları yerleştir
echo "📂 Dosyalar yerleştiriliyor..."
ssh -o StrictHostKeyChecking=no root@31.97.78.86 << 'ENDSSH'
    # Backup al
    if [ -d "/var/www/syncarch" ]; then
        echo "💾 Yedek alınıyor..."
        cp -r /var/www/syncarch /var/www/syncarch-backup-$(date +%Y%m%d-%H%M%S)
    fi

    # Klasörü oluştur
    mkdir -p /var/www/syncarch

    # Eski dosyaları temizle
    rm -rf /var/www/syncarch/*

    # Yeni dosyaları aç
    tar -xzf /tmp/dist-update.tar.gz -C /var/www/syncarch/

    # Geçici dosyayı sil
    rm /tmp/dist-update.tar.gz

    # İzinleri ayarla
    chown -R www-data:www-data /var/www/syncarch
    chmod -R 755 /var/www/syncarch

    # Nginx'i yeniden yükle
    nginx -t && systemctl reload nginx

    echo "✅ Güncelleme tamamlandı!"
ENDSSH

echo "=========================================="
echo "✅ VPS güncellemesi başarıyla tamamlandı!"
echo "=========================================="
echo ""
echo "🌐 Site: http://31.97.78.86"
echo ""

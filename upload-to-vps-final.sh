#!/bin/bash

# SyncArch Dosya Yükleme Script
# Bu script dist klasörünü VPS'e yükler

set -e

VPS_IP="31.97.78.86"
VPS_USER="root"
VPS_PATH="/var/www/syncarch"

echo "======================================"
echo "SyncArch Dosya Yükleme"
echo "======================================"

# Dist klasörü kontrolü
if [ ! -d "dist" ]; then
    echo "HATA: dist klasörü bulunamadı!"
    echo "Önce 'npm run build' komutunu çalıştırın."
    exit 1
fi

echo "Dosyalar yükleniyor..."
echo "Hedef: $VPS_USER@$VPS_IP:$VPS_PATH"
echo ""

# Rsync ile yükleme
rsync -avz --progress \
    --delete \
    --exclude='.git' \
    --exclude='node_modules' \
    dist/ $VPS_USER@$VPS_IP:$VPS_PATH/

echo ""
echo "======================================"
echo "Yükleme Tamamlandı!"
echo "======================================"
echo ""
echo "Dosya izinleri ayarlanıyor..."
ssh $VPS_USER@$VPS_IP "chown -R www-data:www-data $VPS_PATH"

echo ""
echo "Site URL: https://syncarch.xyz"
echo ""

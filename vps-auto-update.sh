#!/bin/bash

echo "=== SyncArch VPS Otomatik Güncelleme ==="
echo "VPS: 31.97.78.86"
echo "Domain: syncarch.xyz"
echo ""

VPS_HOST="31.97.78.86"
VPS_USER="root"
VPS_PASS="00203549Rk.."
WEB_DIR="/var/www/syncarch.xyz"

echo "1. Deployment paketi oluşturuluyor..."
cd /tmp/cc-agent/61274276/project
tar -czf vps-deploy-latest.tar.gz -C dist .

echo "2. VPS'e bağlanılıyor ve eski dosyalar temizleniyor..."
sshpass -p "$VPS_PASS" ssh -o StrictHostKeyChecking=no $VPS_USER@$VPS_HOST << 'ENDSSH'
echo "Eski dosyalar temizleniyor..."
rm -rf /var/www/syncarch.xyz/*
echo "Temizlik tamamlandı."
ENDSSH

echo "3. Yeni dosyalar yükleniyor..."
sshpass -p "$VPS_PASS" scp -o StrictHostKeyChecking=no vps-deploy-latest.tar.gz $VPS_USER@$VPS_HOST:/tmp/

echo "4. Dosyalar açılıyor ve kurulum yapılıyor..."
sshpass -p "$VPS_PASS" ssh -o StrictHostKeyChecking=no $VPS_USER@$VPS_HOST << 'ENDSSH'
cd /var/www/syncarch.xyz
tar -xzf /tmp/vps-deploy-latest.tar.gz
rm /tmp/vps-deploy-latest.tar.gz

echo "Dosya izinleri ayarlanıyor..."
chown -R www-data:www-data /var/www/syncarch.xyz
chmod -R 755 /var/www/syncarch.xyz

echo "Nginx restart ediliyor..."
systemctl restart nginx

echo "✓ Kurulum tamamlandı!"
ENDSSH

echo ""
echo "=== GÜNCELLEME TAMAMLANDI ==="
echo "Site: https://syncarch.xyz"
echo ""
echo "Tarayıcınızda Ctrl+Shift+Delete yapıp cache'i temizleyin."

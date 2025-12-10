#!/bin/bash

# SyncArch VPS Hızlı Güncelleme
# Değişiklikleri VPS'e anında yükler

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

VPS_IP="31.97.78.86"
VPS_USER="root"
VPS_PASS="00203549Rk.."
VPS_PATH="/var/www/syncarch"

echo -e "${BLUE}=========================================="
echo "SyncArch VPS Güncelleme"
echo "==========================================${NC}"
echo ""

# sshpass kontrolü
if ! command -v sshpass &> /dev/null; then
    echo -e "${YELLOW}sshpass yükleniyor...${NC}"
    if [[ "$OSTYPE" == "darwin"* ]]; then
        brew install hudochenkov/sshpass/sshpass
    else
        sudo apt-get update && sudo apt-get install -y sshpass
    fi
fi

echo -e "${YELLOW}1. Proje build alınıyor...${NC}"
npm run build
echo -e "${GREEN}✓ Build tamamlandı${NC}"
echo ""

echo -e "${YELLOW}2. Dosyalar sıkıştırılıyor...${NC}"
tar -czf dist-update.tar.gz dist/ server/
echo -e "${GREEN}✓ Sıkıştırma tamamlandı${NC}"
echo ""

echo -e "${YELLOW}3. VPS'e yükleniyor...${NC}"
sshpass -p "$VPS_PASS" scp -o StrictHostKeyChecking=no dist-update.tar.gz ${VPS_USER}@${VPS_IP}:/root/
echo -e "${GREEN}✓ Dosyalar yüklendi${NC}"
echo ""

echo -e "${YELLOW}4. VPS'de güncelleme yapılıyor...${NC}"
sshpass -p "$VPS_PASS" ssh -o StrictHostKeyChecking=no ${VPS_USER}@${VPS_IP} << 'ENDSSH'
set -e

echo "Dosyalar çıkarılıyor..."
tar -xzf /root/dist-update.tar.gz -C /var/www/syncarch/

echo "PM2 yeniden başlatılıyor..."
pm2 restart voice-assistant-api

echo "Nginx reload ediliyor..."
systemctl reload nginx

echo "Geçici dosyalar temizleniyor..."
rm -f /root/dist-update.tar.gz

echo ""
echo "=========================================="
echo "✓ Güncelleme tamamlandı!"
echo "=========================================="
ENDSSH

echo ""
echo -e "${GREEN}=========================================="
echo "✓✓✓ GÜNCELLEME TAMAMLANDI! ✓✓✓"
echo "==========================================${NC}"
echo ""
echo -e "${GREEN}Site: https://syncarch.xyz${NC}"
echo -e "${BLUE}Değişiklikler 10 saniye içinde aktif olacak${NC}"
echo ""

# Geçici dosyayı temizle
rm -f dist-update.tar.gz

echo -e "${YELLOW}Test için:${NC}"
echo "https://syncarch.xyz adresini açıp F5 ile yenileyin"
echo ""

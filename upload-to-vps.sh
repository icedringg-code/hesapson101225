#!/bin/bash

# SyncArch VPS'e Otomatik Yükleme ve Kurulum
# Bu scripti yerel bilgisayarınızda çalıştırın

set -e

# Renk kodları
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

VPS_IP="31.97.78.86"
VPS_USER="root"
DEPLOY_PACKAGE="syncarch-vps-deploy.tar.gz"

echo -e "${GREEN}=========================================="
echo "SyncArch VPS'e Yükleme ve Kurulum"
echo "==========================================${NC}"

# Deployment paketini kontrol et
if [ ! -f "$DEPLOY_PACKAGE" ]; then
    echo -e "${RED}Hata: $DEPLOY_PACKAGE bulunamadı!${NC}"
    echo -e "${YELLOW}Lütfen önce deployment paketini oluşturun.${NC}"
    exit 1
fi

echo -e "${YELLOW}1. Deployment paketi VPS'e yükleniyor...${NC}"
scp $DEPLOY_PACKAGE ${VPS_USER}@${VPS_IP}:/root/

echo -e "${GREEN}✓ Dosya yüklendi${NC}"

echo -e "${YELLOW}2. VPS'de kurulum başlatılıyor...${NC}"
ssh ${VPS_USER}@${VPS_IP} << 'ENDSSH'
set -e

echo "Proje dizini oluşturuluyor..."
mkdir -p /var/www/syncarch

echo "Dosyalar çıkarılıyor..."
tar -xzf /root/syncarch-vps-deploy.tar.gz -C /var/www/syncarch/

echo "Script izinleri ayarlanıyor..."
chmod +x /var/www/syncarch/vps-full-setup.sh

echo "Otomatik kurulum başlatılıyor..."
cd /var/www/syncarch
./vps-full-setup.sh

echo ""
echo "=========================================="
echo "✓ Kurulum tamamlandı!"
echo "=========================================="
echo ""
echo "Site adresi: https://syncarch.xyz"
echo ""
echo "Kontrol komutları:"
echo "  pm2 status"
echo "  pm2 logs voice-assistant-api"
echo "  systemctl status nginx"
ENDSSH

echo -e "${GREEN}=========================================="
echo "✓ Tüm işlemler tamamlandı!"
echo "==========================================${NC}"
echo ""
echo -e "${GREEN}Site adresi: https://syncarch.xyz${NC}"
echo ""
echo -e "${YELLOW}VPS'e bağlanmak için:${NC}"
echo "ssh root@31.97.78.86"

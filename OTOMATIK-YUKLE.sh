#!/bin/bash

# SyncArch Otomatik VPS Yükleme Script
# Linux/Mac için

set -e

clear
echo "╔════════════════════════════════════════════╗"
echo "║    SyncArch VPS Otomatik Yükleme          ║"
echo "║          syncarch.xyz                      ║"
echo "╚════════════════════════════════════════════╝"
echo ""

# Değişkenler
VPS_IP="31.97.78.86"
VPS_USER="root"
VPS_PATH="/var/www/syncarch"

# Renk kodları
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 1. Dist kontrolü
echo -e "${YELLOW}[1/5]${NC} Dist klasörü kontrol ediliyor..."
if [ ! -d "dist" ]; then
    echo -e "${RED}HATA:${NC} dist klasörü bulunamadı!"
    echo "Önce: npm run build"
    exit 1
fi
echo -e "${GREEN}✓${NC} Dist klasörü bulundu"
echo ""

# 2. Script yükleme
echo -e "${YELLOW}[2/5]${NC} VPS'e kurulum scripti yükleniyor..."
scp TEK-KOMUT-KURULUM.sh $VPS_USER@$VPS_IP:~/
echo -e "${GREEN}✓${NC} Script yüklendi"
echo ""

# 3. VPS kurulum
echo -e "${YELLOW}[3/5]${NC} VPS'te kurulum başlatılıyor..."
ssh $VPS_USER@$VPS_IP "chmod +x ~/TEK-KOMUT-KURULUM.sh && sudo ~/TEK-KOMUT-KURULUM.sh"
echo -e "${GREEN}✓${NC} Sunucu hazırlandı"
echo ""

# 4. Dosya yükleme
echo -e "${YELLOW}[4/5]${NC} Uygulama dosyaları yükleniyor..."
rsync -avz --progress dist/ $VPS_USER@$VPS_IP:$VPS_PATH/
echo -e "${GREEN}✓${NC} Dosyalar yüklendi"
echo ""

# 5. İzinler
echo -e "${YELLOW}[5/5]${NC} Dosya izinleri ayarlanıyor..."
ssh $VPS_USER@$VPS_IP "chown -R www-data:www-data $VPS_PATH && chmod -R 755 $VPS_PATH"
echo -e "${GREEN}✓${NC} İzinler ayarlandı"
echo ""

# Tamamlandı
echo "╔════════════════════════════════════════════╗"
echo "║        Yükleme Tamamlandı! ✓              ║"
echo "╚════════════════════════════════════════════╝"
echo ""
echo -e "${GREEN}Şimdi SSL sertifikası için VPS'e bağlanın:${NC}"
echo "ssh root@31.97.78.86"
echo ""
echo -e "${GREEN}Sonra şu komutu çalıştırın:${NC}"
echo "certbot --nginx -d syncarch.xyz -d www.syncarch.xyz"
echo ""
echo -e "${GREEN}Site URL:${NC} https://syncarch.xyz"
echo ""

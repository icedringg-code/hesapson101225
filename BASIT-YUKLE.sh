#!/bin/bash

# Renkli çıktı
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  VPS Deployment - Otomatik Yükleme${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
echo ""

# Dosya kontrolü
if [ ! -f "vps-deploy-latest.tar.gz" ]; then
    echo -e "${YELLOW}❌ vps-deploy-latest.tar.gz bulunamadı!${NC}"
    exit 1
fi

echo -e "${GREEN}✓${NC} Dosya bulundu: vps-deploy-latest.tar.gz"
echo ""

# VPS bilgileri
VPS_HOST="31.97.78.86"
VPS_USER="root"
REMOTE_DIR="/var/www/syncarch.xyz"

echo -e "${BLUE}📡 VPS Bilgileri:${NC}"
echo "  Host: $VPS_HOST"
echo "  User: $VPS_USER"
echo "  Şifre: 00203549Rk.."
echo ""

echo -e "${YELLOW}📤 Dosya yükleniyor...${NC}"
echo -e "${YELLOW}   (Şifre sorduğunda: 00203549Rk.. yazın)${NC}"
echo ""

# Dosyayı yükle
scp -o StrictHostKeyChecking=no vps-deploy-latest.tar.gz ${VPS_USER}@${VPS_HOST}:/tmp/

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✓${NC} Dosya yüklendi!"
    echo ""
    echo -e "${YELLOW}📂 Extract ve deployment yapılıyor...${NC}"
    echo -e "${YELLOW}   (Şifre tekrar sorulacak)${NC}"
    echo ""

    # Extract ve deployment
    ssh -o StrictHostKeyChecking=no ${VPS_USER}@${VPS_HOST} "cd ${REMOTE_DIR} && tar -xzf /tmp/vps-deploy-latest.tar.gz && rm /tmp/vps-deploy-latest.tar.gz && chmod -R 755 ${REMOTE_DIR} && systemctl restart nginx && echo '' && echo '✅ Deployment tamamlandı!' && echo '' && ls -la ${REMOTE_DIR} | head -20"

    if [ $? -eq 0 ]; then
        echo ""
        echo -e "${GREEN}═══════════════════════════════════════════════════${NC}"
        echo -e "${GREEN}  🎉 Deployment Başarılı!${NC}"
        echo -e "${GREEN}═══════════════════════════════════════════════════${NC}"
        echo ""
        echo -e "${BLUE}🌐 Site: ${NC}https://syncarch.xyz"
        echo ""
    else
        echo -e "${YELLOW}❌ Deployment sırasında hata oluştu!${NC}"
        exit 1
    fi
else
    echo -e "${YELLOW}❌ Dosya yüklenemedi!${NC}"
    exit 1
fi

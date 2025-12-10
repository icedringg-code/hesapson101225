#!/bin/bash

# VPS Sesli Asistan Güncellemesi
# Bu script güncellenmiş frontend'i VPS'e deploy eder

VPS_IP="31.97.78.86"
VPS_USER="root"
DOMAIN="syncarch.xyz"

echo "=========================================="
echo "VPS'e Sesli Asistan Güncellemesi"
echo "=========================================="
echo ""

# Build kontrol
if [ ! -d "dist" ]; then
    echo "❌ dist klasörü bulunamadı!"
    echo "Lütfen önce 'npm run build' komutunu çalıştırın."
    exit 1
fi

echo "✓ Build dosyaları bulundu"
echo ""

# Deployment paketi oluştur
echo "📦 Deployment paketi hazırlanıyor..."
tar -czf vps-voice-update.tar.gz dist/

if [ ! -f "vps-voice-update.tar.gz" ]; then
    echo "❌ Paket oluşturulamadı!"
    exit 1
fi

echo "✓ Paket hazır: vps-voice-update.tar.gz"
echo ""

# VPS'e upload
echo "📤 VPS'e yükleniyor..."
scp vps-voice-update.tar.gz ${VPS_USER}@${VPS_IP}:/tmp/

if [ $? -ne 0 ]; then
    echo "❌ Upload başarısız!"
    echo "Lütfen VPS bağlantınızı kontrol edin."
    exit 1
fi

echo "✓ Dosyalar yüklendi"
echo ""

# VPS'te deployment
echo "🚀 VPS'te güncelleme yapılıyor..."
ssh ${VPS_USER}@${VPS_IP} << 'ENDSSH'
cd /var/www/syncarch

# Yedek al
if [ -d "html" ]; then
    echo "💾 Mevcut sürüm yedekleniyor..."
    cp -r html html.backup.$(date +%Y%m%d_%H%M%S)
fi

# Yeni dosyaları aç
echo "📂 Yeni dosyalar kuruluyor..."
cd /tmp
tar -xzf vps-voice-update.tar.gz

# Eski dosyaları temizle ve yenilerini kopyala
rm -rf /var/www/syncarch/html/*
cp -r dist/* /var/www/syncarch/html/

# Permissions
chown -R www-data:www-data /var/www/syncarch/html
chmod -R 755 /var/www/syncarch/html

# Nginx restart
echo "🔄 Nginx yeniden başlatılıyor..."
systemctl restart nginx

# Temizlik
rm -f /tmp/vps-voice-update.tar.gz

echo "✅ Güncelleme tamamlandı!"
ENDSSH

if [ $? -eq 0 ]; then
    echo ""
    echo "=========================================="
    echo "✅ DEPLOYMENT BAŞARILI!"
    echo "=========================================="
    echo ""
    echo "Siteniz güncellendi: https://${DOMAIN}"
    echo ""
    echo "Şimdi şunları yapın:"
    echo "1. https://${DOMAIN} adresine gidin"
    echo "2. Tarayıcıda CTRL+F5 ile cache'i temizleyin"
    echo "3. Tarayıcı konsolunu açın (F12)"
    echo "4. Mikrofon butonuna tıklayın ve 'iş ekle' deyin"
    echo "5. Console'da şunları göreceksiniz:"
    echo "   - Transcription: Söylediğiniz kelimeler"
    echo "   - Command: Algılanan komut"
    echo "   - Fallback activated: Eğer fallback kullanıldıysa"
    echo ""
else
    echo ""
    echo "❌ Deployment sırasında hata oluştu!"
    echo "Lütfen VPS bağlantınızı ve izinlerinizi kontrol edin."
    exit 1
fi

# Yerel temizlik
rm -f vps-voice-update.tar.gz

echo "Yerel paket dosyası temizlendi."
echo ""

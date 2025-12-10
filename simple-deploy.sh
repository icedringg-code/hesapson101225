#!/bin/bash

# Basit deployment script - lokal bilgisayarda çalıştırın

echo "🚀 VPS Deployment başlıyor..."
echo ""

# Geçici HTTP sunucu başlat
echo "📡 HTTP sunucu başlatılıyor..."
python3 -m http.server 8888 &
SERVER_PID=$!

sleep 2

# VPS'te dosyayı indir ve deploy et
echo "📥 VPS'te dosya indiriliyor..."

# Local IP adresini bul
LOCAL_IP=$(hostname -I | awk '{print $1}')

echo "💡 Şimdi VPS terminalinde şu komutları çalıştırın:"
echo ""
echo "ssh root@31.97.78.86"
echo "# Şifre: 00203549Rk.."
echo ""
echo "cd /tmp"
echo "wget http://${LOCAL_IP}:8888/vps-deploy-latest.tar.gz"
echo "cd /var/www/syncarch.xyz"
echo "tar -xzf /tmp/vps-deploy-latest.tar.gz"
echo "rm /tmp/vps-deploy-latest.tar.gz"
echo "chmod -R 755 /var/www/syncarch.xyz"
echo "systemctl restart nginx"
echo "exit"
echo ""
echo "İşlem tamamlandıktan sonra ENTER'a basın..."
read

# Sunucuyu kapat
echo "🛑 HTTP sunucu kapatılıyor..."
kill $SERVER_PID

echo "✅ Tamamlandı!"

#!/bin/bash

HOST="31.97.78.86"
USER="root"
PASS="00203549Rk.."

echo "🚀 VPS'e dosya yükleniyor..."

# Her parçayı VPS'e gönder
for part in vps-part-*; do
    echo "📤 $part yükleniyor..."
   
    # SSH ile dosyayı oluştur
    cat "$part" | ssh -o StrictHostKeyChecking=no $USER@$HOST "cat >> /tmp/deploy.b64"
    
    if [ $? -eq 0 ]; then
        echo "  ✅ $part yüklendi"
    else
        echo "  ❌ $part yüklenemedi!"
        exit 1
    fi
done

echo ""
echo "🔄 VPS'te dosya birleştiriliyor ve extract ediliyor..."

# VPS'te extract et
ssh -o StrictHostKeyChecking=no $USER@$HOST << 'EOF'
cd /tmp
base64 -d deploy.b64 > vps-deploy.tar.gz
rm deploy.b64
cd /var/www/syncarch.xyz
tar -xzf /tmp/vps-deploy.tar.gz
rm /tmp/vps-deploy.tar.gz
chmod -R 755 /var/www/syncarch.xyz
systemctl restart nginx
echo ""
echo "✅ Deployment tamamlandı!"
ls -la /var/www/syncarch.xyz | head -20
EOF

echo ""
echo "🎉 İşlem tamamlandı!"
echo "🌐 Site: https://syncarch.xyz"

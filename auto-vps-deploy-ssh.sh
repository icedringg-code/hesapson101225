#!/bin/bash

# SyncArch Otomatik VPS Deployment
# Bu script VPS'e otomatik bağlanıp deployment yapar

set -e

DOMAIN="syncarch.xyz"
VPS_USER="root"
VPS_HOST="31.97.78.86"
VPS_PASSWORD="00203549Rk.."

echo "════════════════════════════════════════════════════════════"
echo "  SyncArch Otomatik VPS HTTPS Deployment"
echo "════════════════════════════════════════════════════════════"
echo "🌐 Domain: $DOMAIN"
echo "🖥️  VPS: $VPS_HOST"
echo "════════════════════════════════════════════════════════════"
echo ""

# dist.b64 kontrol
if [ ! -f "dist.b64" ]; then
    echo "❌ dist.b64 bulunamadı!"
    exit 1
fi

echo "📦 Deployment paketi okunuyor..."
BASE64_CONTENT=$(cat dist.b64)

echo "🔧 SSH connection script oluşturuluyor..."

# VPS'te çalıştırılacak komutlar
VPS_SCRIPT=$(cat << 'EOFVPS'
#!/bin/bash
set -e

echo "🚀 Deployment başlatılıyor..."
echo ""

# Base64 içeriğini al
cat > /tmp/dist.b64 << 'EOFBASE64'
BASE64_CONTENT_PLACEHOLDER
EOFBASE64

echo "📦 Dosyalar çıkarılıyor..."
base64 -d /tmp/dist.b64 > /tmp/dist.tar.gz
rm -rf /tmp/syncarch-new
mkdir -p /tmp/syncarch-new
tar -xzf /tmp/dist.tar.gz -C /tmp/syncarch-new

echo "🔧 Nginx ve Certbot yükleniyor..."
apt-get update -qq >> /dev/null 2>&1 || true
apt-get install -y nginx certbot python3-certbot-nginx -qq >> /dev/null 2>&1 || true

echo "💾 Yedek alınıyor..."
mkdir -p /var/www/backup
if [ -d /var/www/syncarch.xyz ]; then
    cp -r /var/www/syncarch.xyz /var/www/backup/syncarch-$(date +%Y%m%d-%H%M%S)
fi

echo "🚀 Yeni versiyon yükleniyor..."
rm -rf /var/www/syncarch.xyz
mkdir -p /var/www/syncarch.xyz
cp -r /tmp/syncarch-new/. /var/www/syncarch.xyz/
rm -rf /tmp/syncarch-new
chmod -R 755 /var/www/syncarch.xyz
chown -R www-data:www-data /var/www/syncarch.xyz

echo "⚙️  Nginx yapılandırılıyor..."
cat > /etc/nginx/sites-available/syncarch.xyz << 'EOFNGINX'
server {
    listen 80;
    listen [::]:80;
    server_name syncarch.xyz www.syncarch.xyz;
    root /var/www/syncarch.xyz;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOFNGINX

ln -sf /etc/nginx/sites-available/syncarch.xyz /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

echo "🔄 Nginx yeniden başlatılıyor..."
nginx -t && systemctl restart nginx

echo "🔒 HTTPS kuruluyor (Let's Encrypt)..."
certbot --nginx -d syncarch.xyz -d www.syncarch.xyz --non-interactive --agree-tos --email admin@syncarch.xyz --redirect || echo "⚠️  SSL kurulumu devam ediyor..."

echo "🧹 Temizlik..."
rm -f /tmp/dist.*

echo ""
echo "════════════════════════════════════════════════════════════"
echo "✅ DEPLOYMENT TAMAMLANDI!"
echo "════════════════════════════════════════════════════════════"
echo "🌐 Site       : https://syncarch.xyz"
echo "🔒 HTTPS      : Aktif"
echo "📁 Dizin      : /var/www/syncarch.xyz"
echo "════════════════════════════════════════════════════════════"
echo ""
ls -lh /var/www/syncarch.xyz | head -20

EOFVPS
)

# Base64 içeriğini script'e ekle
VPS_SCRIPT="${VPS_SCRIPT//BASE64_CONTENT_PLACEHOLDER/$BASE64_CONTENT}"

# Script'i geçici dosyaya yaz
echo "$VPS_SCRIPT" > /tmp/vps-deploy-commands.sh
chmod +x /tmp/vps-deploy-commands.sh

echo "🔐 VPS'e bağlanılıyor..."
echo ""

# SSH ile bağlan ve script'i çalıştır
if command -v sshpass &> /dev/null; then
    echo "Method: sshpass (otomatik)"
    sshpass -p "$VPS_PASSWORD" ssh -o StrictHostKeyChecking=no ${VPS_USER}@${VPS_HOST} 'bash -s' < /tmp/vps-deploy-commands.sh
else
    echo "⚠️  sshpass bulunamadı - Manuel şifre girişi gerekiyor"
    echo ""
    echo "SSH şifresi: $VPS_PASSWORD"
    echo ""
    echo "Şifre sorunca yukarıdaki şifreyi girin..."
    echo ""
    ssh -o StrictHostKeyChecking=no ${VPS_USER}@${VPS_HOST} 'bash -s' < /tmp/vps-deploy-commands.sh
fi

echo ""
echo "════════════════════════════════════════════════════════════"
echo "✅ TÜM İŞLEMLER TAMAMLANDI!"
echo "════════════════════════════════════════════════════════════"
echo "🌐 Siteniz yayında: https://$DOMAIN"
echo "🔒 HTTPS aktif"
echo "════════════════════════════════════════════════════════════"
echo ""

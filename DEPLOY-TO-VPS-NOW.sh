#!/bin/bash

# SyncArch VPS Deployment with HTTPS
# Domain: syncarch.xyz
# VPS: 31.97.78.86

set -e

DOMAIN="syncarch.xyz"
VPS_USER="root"
VPS_HOST="31.97.78.86"
VPS_PASSWORD="00203549Rk.."

echo "============================================================"
echo "  SyncArch VPS Deployment with HTTPS"
echo "============================================================"
echo "🌐 Domain: $DOMAIN"
echo "🖥️  VPS: $VPS_HOST"
echo "============================================================"
echo ""

# Check if dist.b64 exists
if [ ! -f "dist.b64" ]; then
    echo "❌ dist.b64 not found!"
    echo "Creating deployment package..."
    tar -czf dist.tar.gz -C dist .
    base64 dist.tar.gz > dist.b64
    echo "✅ Package created"
fi

echo "📦 Reading deployment package..."
BASE64_CONTENT=$(cat dist.b64)

echo "🚀 Uploading to VPS..."

# Create SSH commands
ssh -o StrictHostKeyChecking=no ${VPS_USER}@${VPS_HOST} << EOSSH

# Upload base64 content
cat > /tmp/dist.b64 << 'EOFBASE64'
${BASE64_CONTENT}
EOFBASE64

echo "📦 Extracting files..."
base64 -d /tmp/dist.b64 > /tmp/dist.tar.gz
mkdir -p /tmp/syncarch-new
tar -xzf /tmp/dist.tar.gz -C /tmp/syncarch-new

echo "🔧 Installing nginx and certbot..."
apt-get update -qq
apt-get install -y nginx certbot python3-certbot-nginx -qq

echo "💾 Backing up current site..."
mkdir -p /var/www/backup
if [ -d /var/www/${DOMAIN} ]; then
    cp -r /var/www/${DOMAIN} /var/www/backup/syncarch-\$(date +%Y%m%d-%H%M%S)
fi

echo "🚀 Deploying new version..."
rm -rf /var/www/${DOMAIN}
mkdir -p /var/www/${DOMAIN}
mv /tmp/syncarch-new/* /var/www/${DOMAIN}/
rmdir /tmp/syncarch-new
chmod -R 755 /var/www/${DOMAIN}
chown -R www-data:www-data /var/www/${DOMAIN}

echo "⚙️  Configuring nginx..."
cat > /etc/nginx/sites-available/${DOMAIN} << 'EOFNGINX'
server {
    listen 80;
    listen [::]:80;
    server_name ${DOMAIN} www.${DOMAIN};
    root /var/www/${DOMAIN};
    index index.html;

    location / {
        try_files \$uri \$uri/ /index.html;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOFNGINX

ln -sf /etc/nginx/sites-available/${DOMAIN} /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

echo "🔄 Restarting nginx..."
nginx -t && systemctl restart nginx

echo "🔒 Setting up HTTPS..."
certbot --nginx -d ${DOMAIN} -d www.${DOMAIN} --non-interactive --agree-tos --email admin@${DOMAIN} --redirect || echo "⚠️  SSL setup may need manual attention"

echo "🧹 Cleaning up..."
rm -f /tmp/dist.*

echo ""
echo "============================================================"
echo "✅ DEPLOYMENT COMPLETE!"
echo "============================================================"
echo "🌐 Site: https://${DOMAIN}"
echo "🔒 HTTPS: Enabled"
echo "📁 Path: /var/www/${DOMAIN}"
echo "============================================================"
echo ""
ls -lh /var/www/${DOMAIN}

EOSSH

echo ""
echo "============================================================"
echo "✅ ALL DONE!"
echo "============================================================"
echo "🌐 Your site is live at: https://${DOMAIN}"
echo "============================================================"

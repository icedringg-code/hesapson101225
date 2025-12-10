#!/bin/bash

# Syncarch VPS Deployment Script
# Domain: syncarch.xyz
# VPS IP: 31.97.78.86

set -e

echo "=========================================="
echo "Syncarch VPS Deployment"
echo "=========================================="

# VPS Configuration
VPS_USER="root"
VPS_HOST="31.97.78.86"
VPS_DOMAIN="syncarch.xyz"
APP_DIR="/var/www/syncarch"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}1. Building production version...${NC}"
npm run build

echo -e "${BLUE}2. Creating deployment package...${NC}"
cd dist
tar -czf ../syncarch-deploy.tar.gz *
cd ..

echo -e "${GREEN}✓ Build completed${NC}"
echo ""
echo -e "${BLUE}3. Uploading to VPS...${NC}"

# Upload deployment package
scp syncarch-deploy.tar.gz ${VPS_USER}@${VPS_HOST}:/tmp/

echo -e "${GREEN}✓ Upload completed${NC}"
echo ""
echo -e "${BLUE}4. Deploying on VPS...${NC}"

# Deploy on VPS
ssh ${VPS_USER}@${VPS_HOST} << 'ENDSSH'
set -e

APP_DIR="/var/www/syncarch"
DOMAIN="syncarch.xyz"

echo "Creating application directory..."
mkdir -p ${APP_DIR}

echo "Extracting files..."
cd ${APP_DIR}
tar -xzf /tmp/syncarch-deploy.tar.gz
rm /tmp/syncarch-deploy.tar.gz

echo "Setting permissions..."
chown -R www-data:www-data ${APP_DIR}
chmod -R 755 ${APP_DIR}

echo "Configuring Nginx..."
cat > /etc/nginx/sites-available/syncarch << 'EOF'
server {
    listen 80;
    listen [::]:80;
    server_name syncarch.xyz www.syncarch.xyz;

    root /var/www/syncarch;
    index index.html;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/javascript application/xml+rss application/json;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Service Worker - no cache
    location = /sw.js {
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        expires 0;
    }

    # Manifest - no cache
    location = /manifest.json {
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        expires 0;
    }
}
EOF

echo "Enabling site..."
ln -sf /etc/nginx/sites-available/syncarch /etc/nginx/sites-enabled/

echo "Testing Nginx configuration..."
nginx -t

echo "Reloading Nginx..."
systemctl reload nginx

echo "Deployment completed successfully!"
ENDSSH

echo ""
echo -e "${GREEN}=========================================="
echo -e "✓ Deployment Completed Successfully!"
echo -e "==========================================${NC}"
echo ""
echo -e "${BLUE}Application URL:${NC} http://syncarch.xyz"
echo ""
echo -e "${BLUE}Next Steps:${NC}"
echo "1. Setup SSL certificate: sudo certbot --nginx -d syncarch.xyz -d www.syncarch.xyz"
echo "2. Test the application: http://syncarch.xyz"
echo ""
echo -e "${BLUE}Useful Commands:${NC}"
echo "  - View Nginx logs: sudo tail -f /var/log/nginx/error.log"
echo "  - Restart Nginx: sudo systemctl restart nginx"
echo "  - Check Nginx status: sudo systemctl status nginx"
echo ""

# Cleanup
rm syncarch-deploy.tar.gz

echo -e "${GREEN}Local cleanup completed${NC}"

#!/bin/bash

# SyncArch VPS Complete Deployment Script
# Domain: syncarch.xyz
# VPS IP: 31.97.78.86

set -e

echo "======================================"
echo "SyncArch VPS Deployment Starting..."
echo "======================================"

VPS_IP="31.97.78.86"
DOMAIN="syncarch.xyz"
APP_DIR="/var/www/syncarch"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}1. Creating deployment package...${NC}"
cd "$(dirname "$0")"

# Create deployment directory
mkdir -p deployment-package
rm -rf deployment-package/*

# Copy dist files
echo "Copying dist files..."
cp -r dist/* deployment-package/

# Copy server files
echo "Copying server files..."
cp -r server deployment-package/
cp package.json deployment-package/
cp .env.production deployment-package/.env

# Create production package.json
cat > deployment-package/package.json << 'EOF'
{
  "name": "syncarch-is-takip",
  "version": "1.2.0",
  "type": "module",
  "scripts": {
    "start": "node server/index.js"
  },
  "dependencies": {
    "express": "^4.19.2",
    "cors": "^2.8.5",
    "dotenv": "^16.4.5",
    "multer": "^1.4.5-lts.1",
    "form-data": "^4.0.0",
    "node-fetch": "^3.3.2"
  }
}
EOF

# Create tar.gz
echo "Creating archive..."
cd deployment-package
tar -czf ../syncarch-deploy.tar.gz .
cd ..

echo -e "${GREEN}Deployment package created: syncarch-deploy.tar.gz${NC}"

echo -e "${YELLOW}2. Uploading to VPS...${NC}"
scp syncarch-deploy.tar.gz root@${VPS_IP}:/tmp/

echo -e "${YELLOW}3. Deploying on VPS...${NC}"
ssh root@${VPS_IP} << 'ENDSSH'
set -e

APP_DIR="/var/www/syncarch"
DOMAIN="syncarch.xyz"

echo "Creating application directory..."
mkdir -p ${APP_DIR}

echo "Extracting files..."
cd ${APP_DIR}
tar -xzf /tmp/syncarch-deploy.tar.gz
rm /tmp/syncarch-deploy.tar.gz

echo "Installing dependencies..."
npm install --production

echo "Setting up PM2..."
# Stop existing process if running
pm2 delete syncarch 2>/dev/null || true

# Start application
pm2 start server/index.js --name syncarch --node-args="--max-old-space-size=2048"
pm2 save
pm2 startup | tail -1 | bash

echo "Configuring Nginx..."
cat > /etc/nginx/sites-available/syncarch << 'EOF'
server {
    listen 80;
    server_name syncarch.xyz www.syncarch.xyz;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name syncarch.xyz www.syncarch.xyz;

    # SSL Configuration (will be configured by Certbot)
    ssl_certificate /etc/letsencrypt/live/syncarch.xyz/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/syncarch.xyz/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Root directory for static files
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
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json application/javascript;

    # API proxy
    location /api/ {
        proxy_pass http://localhost:3001/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_connect_timeout 600;
        proxy_send_timeout 600;
        proxy_read_timeout 600;
        send_timeout 600;
    }

    # Static files
    location / {
        try_files $uri $uri/ /index.html;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Assets with cache
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Service worker
    location /sw.js {
        expires off;
        add_header Cache-Control "no-cache, no-store, must-revalidate";
    }

    # Manifest
    location /manifest.json {
        expires off;
        add_header Cache-Control "no-cache, no-store, must-revalidate";
    }
}
EOF

# Enable site
ln -sf /etc/nginx/sites-available/syncarch /etc/nginx/sites-enabled/

# Test nginx configuration
nginx -t

# Reload nginx
systemctl reload nginx

echo "Checking SSL certificate..."
if [ ! -f /etc/letsencrypt/live/syncarch.xyz/fullchain.pem ]; then
    echo "Setting up SSL certificate..."
    apt-get update
    apt-get install -y certbot python3-certbot-nginx
    certbot --nginx -d syncarch.xyz -d www.syncarch.xyz --non-interactive --agree-tos --email admin@syncarch.xyz --redirect
fi

echo "Deployment completed successfully!"
echo "Application running on: https://syncarch.xyz"
echo ""
echo "Useful commands:"
echo "  pm2 status           - Check application status"
echo "  pm2 logs syncarch    - View application logs"
echo "  pm2 restart syncarch - Restart application"
echo "  pm2 stop syncarch    - Stop application"
ENDSSH

echo ""
echo -e "${GREEN}======================================"
echo "Deployment Completed Successfully!"
echo "======================================${NC}"
echo ""
echo -e "${GREEN}Application URL: https://syncarch.xyz${NC}"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "1. Supabase SQL Editor'e git: https://supabase.com/dashboard"
echo "2. setup-exchange-rates.sql dosyasını çalıştır"
echo ""
echo -e "${YELLOW}Monitoring:${NC}"
echo "  ssh root@${VPS_IP}"
echo "  pm2 status"
echo "  pm2 logs syncarch"
echo ""

# Cleanup
rm -rf deployment-package
rm -f syncarch-deploy.tar.gz

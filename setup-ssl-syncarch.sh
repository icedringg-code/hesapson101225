#!/bin/bash

# SSL Setup Script for Syncarch
# Domain: syncarch.xyz

set -e

echo "=========================================="
echo "SSL Certificate Setup for Syncarch"
echo "=========================================="

VPS_USER="root"
VPS_HOST="31.97.78.86"
VPS_DOMAIN="syncarch.xyz"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}Connecting to VPS and setting up SSL...${NC}"
echo ""

ssh ${VPS_USER}@${VPS_HOST} << 'ENDSSH'
set -e

DOMAIN="syncarch.xyz"

echo "Installing Certbot if not already installed..."
if ! command -v certbot &> /dev/null; then
    apt-get update
    apt-get install -y certbot python3-certbot-nginx
fi

echo "Obtaining SSL certificate..."
certbot --nginx -d ${DOMAIN} -d www.${DOMAIN} --non-interactive --agree-tos --email admin@${DOMAIN} --redirect

echo "Setting up auto-renewal..."
systemctl enable certbot.timer
systemctl start certbot.timer

echo "Testing auto-renewal..."
certbot renew --dry-run

echo "SSL certificate installed successfully!"

echo ""
echo "Updating Nginx configuration for enhanced security..."
cat > /etc/nginx/sites-available/syncarch << 'EOF'
# HTTP - Redirect to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name syncarch.xyz www.syncarch.xyz;

    return 301 https://$server_name$request_uri;
}

# HTTPS
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name syncarch.xyz www.syncarch.xyz;

    # SSL Configuration (managed by Certbot)
    ssl_certificate /etc/letsencrypt/live/syncarch.xyz/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/syncarch.xyz/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    root /var/www/syncarch;
    index index.html;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private auth;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/javascript application/xml+rss application/json application/xml;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    # Service Worker - no cache
    location = /sw.js {
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        add_header Pragma "no-cache";
        expires 0;
    }

    # Manifest - no cache
    location = /manifest.json {
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        add_header Pragma "no-cache";
        expires 0;
    }

    # Block access to hidden files
    location ~ /\. {
        deny all;
        access_log off;
        log_not_found off;
    }
}
EOF

echo "Testing Nginx configuration..."
nginx -t

echo "Reloading Nginx..."
systemctl reload nginx

echo "SSL setup completed successfully!"
ENDSSH

echo ""
echo -e "${GREEN}=========================================="
echo -e "✓ SSL Certificate Installed Successfully!"
echo -e "==========================================${NC}"
echo ""
echo -e "${BLUE}Secure Application URL:${NC} https://syncarch.xyz"
echo ""
echo -e "${GREEN}Certificate Details:${NC}"
echo "  - SSL/TLS: Enabled"
echo "  - Auto-renewal: Enabled"
echo "  - HTTP to HTTPS: Automatic redirect"
echo "  - HSTS: Enabled (1 year)"
echo ""
echo -e "${BLUE}Certificate will auto-renew every 60 days${NC}"
echo ""

#!/bin/bash

# VPS SSL Installation Script
# Run this on your VPS: ./install-ssl-vps.sh

set -e

DOMAIN="syncarch.online"
WWW_DOMAIN="www.syncarch.online"
EMAIL=""

echo "🔒 SSL Installation Script for $DOMAIN"
echo "========================================"

# Check if running as root
if [ "$EUID" -ne 0 ]; then
  echo "❌ Please run as root (use sudo)"
  exit 1
fi

# Ask for email
read -p "Enter your email for SSL notifications: " EMAIL

if [ -z "$EMAIL" ]; then
  echo "❌ Email is required"
  exit 1
fi

echo "📦 Updating system packages..."
apt update && apt upgrade -y

echo "🔧 Installing Certbot..."
apt install certbot python3-certbot-nginx -y

echo "🛑 Stopping Nginx temporarily..."
systemctl stop nginx

echo "📜 Obtaining SSL certificate..."
certbot certonly --standalone \
  -d $DOMAIN \
  -d $WWW_DOMAIN \
  --non-interactive \
  --agree-tos \
  --email $EMAIL \
  --preferred-challenges http

echo "🚀 Starting Nginx..."
systemctl start nginx

echo "🔄 Setting up auto-renewal..."
systemctl enable certbot.timer
systemctl start certbot.timer

echo "🧪 Testing SSL configuration..."
nginx -t

echo "✅ SSL Installation Complete!"
echo ""
echo "Next steps:"
echo "1. Copy nginx-ssl.conf to /etc/nginx/sites-available/syncarch.online"
echo "2. Create symlink: ln -s /etc/nginx/sites-available/syncarch.online /etc/nginx/sites-enabled/"
echo "3. Reload Nginx: systemctl reload nginx"
echo "4. Test: https://$DOMAIN"
echo ""
echo "🎉 Done!"

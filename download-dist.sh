#!/bin/bash
# Download script - Run this on your Windows machine

echo "Downloading dist files..."
scp root@31.97.78.86:/tmp/cc-agent/60856901/project/is-takip-dist.tar.gz C:/Users/ABBARA/Desktop/

echo "Done! Now extract and upload to VPS:"
echo "On Windows:"
echo "  cd C:\Users\ABBARA\Desktop"
echo "  tar -xzf is-takip-dist.tar.gz"
echo "  scp -r dist root@188.245.108.171:/tmp/"
echo ""
echo "On VPS (188.245.108.171):"
echo "  cd /var/www/is-takip"
echo "  rm -rf *"
echo "  mv /tmp/dist/* ."
echo "  mv /tmp/dist/.* . 2>/dev/null || true"

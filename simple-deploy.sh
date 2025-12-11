#!/bin/bash
scp -o StrictHostKeyChecking=no dist-update.tar.gz root@31.97.78.86:/tmp/
ssh -o StrictHostKeyChecking=no root@31.97.78.86 << 'EOSSH'
cd /var/www/syncarch
rm -rf dist
mkdir -p dist
cd dist
tar -xzf /tmp/dist-update.tar.gz
ls -la assets/ | grep index
rm /tmp/dist-update.tar.gz
chown -R www-data:www-data /var/www/syncarch/dist
chmod -R 755 /var/www/syncarch/dist
systemctl reload nginx
echo "=== DEPLOYMENT COMPLETE ==="
EOSSH

#!/bin/bash
echo "Dosyalar VPS'e yükleniyor..."
scp -o StrictHostKeyChecking=no full-deploy.sh full-deploy.tar.gz root@31.97.78.86:/root/
echo "✓ Yükleme tamamlandı!"

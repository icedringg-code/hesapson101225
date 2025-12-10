#!/usr/bin/env python3
import os
import sys
import subprocess

print("Aktif verileri VPS'e yüklüyorum...")

VPS_HOST = "31.97.78.86"
VPS_USER = "root"
VPS_PASS = "SyncArch2025!Secure"
SITE_PATH = "/var/www/syncarch"

# Upload dosyası
print("1. Dosya VPS'e yükleniyor...")
upload_cmd = f"scp -o StrictHostKeyChecking=no dist-production.tar.gz {VPS_USER}@{VPS_HOST}:/tmp/"
print(f"Şifre: {VPS_PASS}")
os.system(upload_cmd)

# VPS'te kurulum
print("\n2. VPS'te kurulum yapılıyor...")
ssh_commands = f"""
cd /var/www/syncarch

# Yedek al
if [ -d "dist" ]; then
    echo "Mevcut dist yedekleniyor..."
    mv dist dist.backup.$(date +%Y%m%d%H%M%S)
fi

# Yeni sürümü kur
echo "Yeni sürüm kuruluyor..."
mkdir -p dist
cd dist
tar -xzf /tmp/dist-production.tar.gz
rm /tmp/dist-production.tar.gz

# İzinleri ayarla
chown -R www-data:www-data /var/www/syncarch/dist
chmod -R 755 /var/www/syncarch/dist

# Nginx cache temizle
systemctl reload nginx

echo "✓ Aktif verilerle güncelleme tamamlandı!"
echo "Site: https://syncarch.xyz"
"""

ssh_cmd = f"ssh -o StrictHostKeyChecking=no {VPS_USER}@{VPS_HOST}"
print(f"SSH komutu: {ssh_cmd}")
print(f"Şifre: {VPS_PASS}")
print("\nLütfen şifreyi girin ve aşağıdaki komutları manuel çalıştırın:")
print(ssh_commands)

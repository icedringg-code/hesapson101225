#!/usr/bin/env python3
import subprocess
import sys
import os

# VPS bilgileri
VPS_HOST = "31.97.78.86"
VPS_USER = "root"
VPS_PASS = "00203549Rk.."
LOCAL_FILE = "/tmp/cc-agent/61274276/project/vps-deploy-latest.tar.gz"
REMOTE_PATH = "/tmp/vps-deploy-latest.tar.gz"
DEPLOY_PATH = "/var/www/syncarch.xyz"

print("🚀 VPS'e otomatik yükleme başlıyor...")

# 1. Dosyayı base64'e çevir
print("\n📦 Dosya base64'e çevriliyor...")
result = subprocess.run(
    ["base64", LOCAL_FILE],
    capture_output=True,
    text=True
)
base64_content = result.stdout

# 2. Base64'ü 1000 satırlık parçalara böl
print("✂️  Dosya parçalara bölünüyor...")
lines = base64_content.strip().split('\n')
chunk_size = 1000
chunks = [lines[i:i + chunk_size] for i in range(0, len(lines), chunk_size)]

print(f"📊 Toplam {len(chunks)} parça oluşturuldu")

# 3. Her parçayı SSH ile yükle
print("\n📤 Parçalar VPS'e yükleniyor...")

for i, chunk in enumerate(chunks, 1):
    chunk_data = '\n'.join(chunk)

    # SSH komutu ile veriyi yazma
    if i == 1:
        # İlk parça - yeni dosya oluştur
        cmd = f"echo '{chunk_data}' | base64 -d > {REMOTE_PATH}"
    else:
        # Diğer parçalar - dosyaya ekle
        cmd = f"echo '{chunk_data}' | base64 -d >> {REMOTE_PATH}"

    ssh_cmd = [
        "sshpass", "-p", VPS_PASS,
        "ssh", "-o", "StrictHostKeyChecking=no",
        f"{VPS_USER}@{VPS_HOST}",
        cmd
    ]

    try:
        subprocess.run(ssh_cmd, check=True, capture_output=True)
        print(f"  ✓ Parça {i}/{len(chunks)} yüklendi")
    except Exception as e:
        print(f"  ✗ Parça {i} yüklenemedi: {e}")
        sys.exit(1)

# 4. VPS'te dosyayı extract et
print("\n📂 Dosya VPS'te extract ediliyor...")
deploy_commands = f"""
cd {DEPLOY_PATH} && \
tar -xzf {REMOTE_PATH} && \
rm {REMOTE_PATH} && \
chmod -R 755 {DEPLOY_PATH} && \
systemctl restart nginx && \
ls -la {DEPLOY_PATH} | head -20
"""

ssh_cmd = [
    "sshpass", "-p", VPS_PASS,
    "ssh", "-o", "StrictHostKeyChecking=no",
    f"{VPS_USER}@{VPS_HOST}",
    deploy_commands
]

try:
    result = subprocess.run(ssh_cmd, check=True, capture_output=True, text=True)
    print("\n✅ Deployment tamamlandı!")
    print("\n📋 Dosya listesi:")
    print(result.stdout)
except Exception as e:
    print(f"\n❌ Deployment hatası: {e}")
    sys.exit(1)

print("\n🎉 Tüm işlemler başarıyla tamamlandı!")
print(f"🌐 Site: https://syncarch.xyz")

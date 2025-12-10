#!/usr/bin/env python3
"""
Otomatik SSH deployment - şifre ile
"""
import subprocess
import sys
import os

VPS_HOST = "31.97.78.86"
VPS_USER = "root"
VPS_PASS = "00203549Rk.."
TAR_FILE = "vps-deploy-latest.tar.gz"

def deploy():
    print("🚀 VPS Deployment başlıyor...")
    print(f"📦 Dosya: {TAR_FILE} ({os.path.getsize(TAR_FILE) / 1024:.1f} KB)")
    print(f"🌐 Hedef: {VPS_USER}@{VPS_HOST}")
    print()

    # Base64 encode et
    print("📝 Dosya hazırlanıyor...")
    with open(TAR_FILE, 'rb') as f:
        import base64
        b64_data = base64.b64encode(f.read()).decode('ascii')

    # SSH komutu
    ssh_cmd = f"""
cd /var/www/syncarch.xyz && \\
base64 -d > /tmp/deploy.tar.gz && \\
tar -xzf /tmp/deploy.tar.gz && \\
rm /tmp/deploy.tar.gz && \\
chmod -R 755 /var/www/syncarch.xyz && \\
systemctl restart nginx && \\
echo "" && \\
echo "✅ Deployment tamamlandı!" && \\
echo "" && \\
ls -la /var/www/syncarch.xyz | head -20
    """.strip()

    print("📤 Dosya VPS'e gönderiliyor...")
    print()

    # SSH process başlat
    proc = subprocess.Popen(
        ['ssh', '-o', 'StrictHostKeyChecking=no', f'{VPS_USER}@{VPS_HOST}', ssh_cmd],
        stdin=subprocess.PIPE,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=False
    )

    # Base64 veriyi stdin'e gönder
    try:
        stdout, stderr = proc.communicate(input=b64_data.encode('ascii'), timeout=60)

        if proc.returncode == 0:
            print(stdout.decode('utf-8', errors='ignore'))
            print()
            print("🎉 Deployment başarıyla tamamlandı!")
            print("🌐 Site: https://syncarch.xyz")
            return True
        else:
            print("❌ Hata oluştu!")
            print(stderr.decode('utf-8', errors='ignore'))
            return False

    except subprocess.TimeoutExpired:
        proc.kill()
        print("❌ Timeout! İşlem çok uzun sürdü.")
        return False
    except Exception as e:
        print(f"❌ Hata: {e}")
        return False

if __name__ == "__main__":
    if not os.path.exists(TAR_FILE):
        print(f"❌ Dosya bulunamadı: {TAR_FILE}")
        sys.exit(1)

    try:
        success = deploy()
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\n⚠️  İptal edildi")
        sys.exit(1)

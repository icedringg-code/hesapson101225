#!/usr/bin/env python3
"""
VPS'e otomatik deployment - SSH ile direkt yükleme
Şifresiz çalışır, base64 ile küçük parçalar halinde gönderir
"""
import os
import subprocess
import time

# Konfigürasyon
VPS_HOST = "31.97.78.86"
VPS_USER = "root"
VPS_PASS = "00203549Rk.."
TAR_FILE = "vps-deploy-latest.tar.gz"

def ssh_command(cmd, input_data=None):
    """SSH komutu çalıştır"""
    full_cmd = f"""
sshpass -p '{VPS_PASS}' ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null {VPS_USER}@{VPS_HOST} "{cmd}" 2>/dev/null
    """.strip()

    try:
        if input_data:
            result = subprocess.run(
                full_cmd,
                shell=True,
                input=input_data.encode() if isinstance(input_data, str) else input_data,
                capture_output=True,
                timeout=30
            )
        else:
            result = subprocess.run(
                full_cmd,
                shell=True,
                capture_output=True,
                timeout=30
            )

        return result.returncode == 0, result.stdout.decode() if result.stdout else ""
    except Exception as e:
        print(f"Hata: {e}")
        return False, str(e)

def upload_file():
    """Dosyayı yükle"""
    print("🚀 VPS Deployment başlıyor...")
    print(f"📦 Dosya: {TAR_FILE}")
    print(f"🌐 Hedef: {VPS_HOST}")
    print()

    # Base64'e çevir
    print("📝 Dosya base64'e çevriliyor...")
    with open(TAR_FILE, 'rb') as f:
        import base64
        b64_data = base64.b64encode(f.read()).decode('ascii')

    # 40KB parçalara böl
    chunk_size = 40000
    chunks = [b64_data[i:i+chunk_size] for i in range(0, len(b64_data), chunk_size)]
    total = len(chunks)

    print(f"✂️  {total} parça oluşturuldu")
    print()

    # Önceki dosyayı sil
    print("🧹 VPS temizleniyor...")
    ssh_command("rm -f /tmp/deploy.b64")

    # Her parçayı gönder
    for i, chunk in enumerate(chunks, 1):
        print(f"📤 Parça {i}/{total} gönderiliyor... ", end='', flush=True)

        # Base64 chunk'ı dosyaya ekle
        success, _ = ssh_command(f"echo '{chunk}' >> /tmp/deploy.b64")

        if success:
            print("✅")
        else:
            print("❌")
            return False

    print()
    print("🔄 Dosya decode ediliyor ve extract ediliyor...")

    # Deployment komutları
    deploy_cmd = """
cd /var/www/syncarch.xyz && \
base64 -d /tmp/deploy.b64 > /tmp/deploy.tar.gz && \
rm /tmp/deploy.b64 && \
tar -xzf /tmp/deploy.tar.gz && \
rm /tmp/deploy.tar.gz && \
chmod -R 755 /var/www/syncarch.xyz && \
systemctl restart nginx && \
echo "✅ Deployment tamamlandı!" && \
ls -la /var/www/syncarch.xyz | head -20
    """

    success, output = ssh_command(deploy_cmd.strip())

    print()
    if success:
        print("✅ Deployment başarılı!")
        print()
        print("📋 Dosyalar:")
        print(output)
        print()
        print("🎉 Tamamlandı!")
        print("🌐 Site: https://syncarch.xyz")
        return True
    else:
        print("❌ Deployment hatası!")
        print(output)
        return False

if __name__ == "__main__":
    # sshpass kontrolü
    result = subprocess.run("which sshpass", shell=True, capture_output=True)
    if result.returncode != 0:
        print("❌ sshpass bulunamadı!")
        print()
        print("📦 Kurulum:")
        print("   Ubuntu/Debian: sudo apt-get install sshpass")
        print("   macOS: brew install hudochenkov/sshpass/sshpass")
        print("   Windows: Git Bash kullanın veya manuel yükleme yapın")
        exit(1)

    if not os.path.exists(TAR_FILE):
        print(f"❌ Dosya bulunamadı: {TAR_FILE}")
        exit(1)

    try:
        success = upload_file()
        exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\n⚠️  İptal edildi")
        exit(1)
    except Exception as e:
        print(f"\n❌ Hata: {e}")
        import traceback
        traceback.print_exc()
        exit(1)

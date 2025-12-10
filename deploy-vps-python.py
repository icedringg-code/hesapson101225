#!/usr/bin/env python3
"""
VPS'e otomatik deployment scripti
SSH şifresi ile bağlanıp dosyaları yükler
"""
import os
import sys
import subprocess
import base64

# Konfigürasyon
VPS_HOST = "31.97.78.86"
VPS_USER = "root"
VPS_PASS = "00203549Rk.."
LOCAL_FILE = "vps-deploy-latest.tar.gz"
REMOTE_FILE = "/tmp/deploy.tar.gz"
DEPLOY_DIR = "/var/www/syncarch.xyz"

def run_ssh_command(command, show_output=True):
    """SSH komutu çalıştır"""
    # SSH komutu hazırla - şifre için sshpass kullanılabilir ama alternatif yöntem
    full_cmd = f'ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null {VPS_USER}@{VPS_HOST} "{command}"'

    if show_output:
        print(f"🔧 Komut çalıştırılıyor...")

    # Şifre girdisi için pexpect kullan (varsa)
    try:
        import pexpect
        child = pexpect.spawn(full_cmd, encoding='utf-8', timeout=300)
        child.expect(['password:', pexpect.EOF])
        child.sendline(VPS_PASS)
        child.expect(pexpect.EOF)
        output = child.before
        child.close()

        if show_output:
            print(output)
        return output
    except ImportError:
        print("❌ pexpect modülü bulunamadı")
        print("📦 Alternatif yöntem deneniyor...")

        # Base64 ile veri gönderme yöntemi
        return None

def upload_via_base64():
    """Base64 ile dosyayı parça parça yükle"""
    print("📦 Dosya base64'e çevriliyor...")

    with open(LOCAL_FILE, 'rb') as f:
        file_data = f.read()

    b64_data = base64.b64encode(file_data).decode('ascii')

    # 50KB'lık parçalara böl
    chunk_size = 50000
    total_chunks = (len(b64_data) + chunk_size - 1) // chunk_size

    print(f"📊 Dosya {total_chunks} parçaya bölünüyor...")

    # İlk parçayı gönder (yeni dosya oluştur)
    for i in range(0, len(b64_data), chunk_size):
        chunk_num = i // chunk_size + 1
        chunk = b64_data[i:i + chunk_size]

        if i == 0:
            # İlk parça - yeni dosya
            cmd = f"echo '{chunk}' | base64 -d > {REMOTE_FILE}.b64.part"
        else:
            # Sonraki parçalar - dosyaya ekle
            cmd = f"echo '{chunk}' >> {REMOTE_FILE}.b64.part"

        print(f"  📤 Parça {chunk_num}/{total_chunks} yükleniyor...")
        result = run_ssh_command(cmd, show_output=False)

        if result is None:
            print(f"  ❌ Parça {chunk_num} yüklenemedi")
            return False

        print(f"  ✅ Parça {chunk_num}/{total_chunks} yüklendi")

    # Base64'ü decode et
    print("🔄 Base64 decode ediliyor...")
    run_ssh_command(f"base64 -d {REMOTE_FILE}.b64.part > {REMOTE_FILE} && rm {REMOTE_FILE}.b64.part")

    return True

def deploy():
    """Deployment işlemini gerçekleştir"""
    print("🚀 VPS Deployment Başlıyor...")
    print(f"🌐 Hedef: {VPS_USER}@{VPS_HOST}")
    print()

    # Dosya yükle
    if not upload_via_base64():
        print("❌ Dosya yüklenemedi!")
        return False

    print()
    print("📂 Dosya extract ediliyor...")

    commands = [
        f"cd {DEPLOY_DIR}",
        f"tar -xzf {REMOTE_FILE}",
        f"rm {REMOTE_FILE}",
        f"chmod -R 755 {DEPLOY_DIR}",
        "systemctl restart nginx",
        f"ls -la {DEPLOY_DIR} | head -20"
    ]

    combined_cmd = " && ".join(commands)
    output = run_ssh_command(combined_cmd)

    print()
    print("✅ Deployment tamamlandı!")
    print("🌐 Site: https://syncarch.xyz")

    return True

if __name__ == "__main__":
    try:
        if not os.path.exists(LOCAL_FILE):
            print(f"❌ Dosya bulunamadı: {LOCAL_FILE}")
            sys.exit(1)

        success = deploy()
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\n\n⚠️  İşlem iptal edildi")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Hata: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

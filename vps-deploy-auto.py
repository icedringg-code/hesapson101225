#!/usr/bin/env python3
"""
SyncArch VPS Otomatik Deployment Script
"""

import os
import sys
import subprocess
import time

# VPS Bilgileri
VPS_IP = "31.97.78.86"
VPS_USER = "root"
VPS_PASSWORD = "00203549Rk.."
PACKAGE = "syncarch-vps-latest.tar.gz"
APP_DIR = "/var/www/syncarch"

def run_command(cmd, env_vars=None):
    """Komutu çalıştır ve çıktıyı göster"""
    try:
        env = os.environ.copy()
        if env_vars:
            env.update(env_vars)

        result = subprocess.run(
            cmd,
            shell=True,
            check=True,
            text=True,
            capture_output=True,
            env=env
        )
        return True, result.stdout
    except subprocess.CalledProcessError as e:
        return False, e.stderr

def print_header(text):
    """Başlık yazdır"""
    print("\n" + "="*60)
    print(f"  {text}")
    print("="*60)

def print_step(step, text):
    """Adım yazdır"""
    print(f"\n{step} {text}")

def main():
    print_header("🚀 SyncArch VPS Deployment")

    # Paket kontrolü
    if not os.path.exists(PACKAGE):
        print(f"\n❌ HATA: {PACKAGE} bulunamadı!")
        print("Önce 'npm run build' çalıştırın.")
        sys.exit(1)

    print(f"\n✓ Paket hazır: {PACKAGE}")
    print(f"  IP: {VPS_IP}")
    print(f"  Domain: syncarch.xyz")

    # sshpass kontrolü
    print_step("🔍", "SSH araçları kontrol ediliyor...")
    success, _ = run_command("which sshpass")

    use_sshpass = success

    # 1. Dosya yükleme
    print_step("📤", "Paket VPS'e yükleniyor...")

    if use_sshpass:
        cmd = f"sshpass -p '{VPS_PASSWORD}' scp -o StrictHostKeyChecking=no {PACKAGE} {VPS_USER}@{VPS_IP}:/tmp/"
    else:
        cmd = f"scp -o StrictHostKeyChecking=no {PACKAGE} {VPS_USER}@{VPS_IP}:/tmp/"

    print(f"  Komut: scp {PACKAGE} -> VPS:/tmp/")
    success, output = run_command(cmd)

    if not success:
        print(f"\n❌ Dosya yüklenemedi!")
        print(f"Hata: {output}")
        print("\nManuel yükleme için:")
        print(f"  scp {PACKAGE} {VPS_USER}@{VPS_IP}:/tmp/")
        sys.exit(1)

    print("  ✓ Paket yüklendi")

    # 2. Deployment komutları
    print_step("🔧", "Deployment başlatılıyor...")

    deployment_script = f"""
cd {APP_DIR} || mkdir -p {APP_DIR}

echo "📁 Dizin: $(pwd)"

# Yedek al
BACKUP_DIR="backup-$(date +%Y%m%d-%H%M%S)"
mkdir -p $BACKUP_DIR
if [ -d "dist" ]; then
    cp -r dist $BACKUP_DIR/ 2>/dev/null
    echo "✓ Yedek: $BACKUP_DIR"
fi

# Yeni versiyonu çıkar
echo "📦 Paket çıkarılıyor..."
tar -xzf /tmp/{PACKAGE} -C {APP_DIR}
rm -f /tmp/{PACKAGE}
echo "✓ Dosyalar çıkarıldı"

# Node modülleri
echo "📦 Bağımlılıklar kuruluyor..."
npm install --production --silent
echo "✓ Bağımlılıklar kuruldu"

# PM2 güncelle
echo "🔄 Servis güncelleniyor..."
pm2 restart syncarch 2>/dev/null || pm2 start server/index.js --name syncarch
pm2 save
echo "✓ PM2 güncellendi"

# Nginx yenile
echo "🌐 Nginx yenileniyor..."
nginx -t && systemctl reload nginx
echo "✓ Nginx yenilendi"

# Nginx config kontrolü (yoksa oluştur)
if [ ! -f /etc/nginx/sites-available/syncarch ]; then
    echo "📝 Nginx config oluşturuluyor..."
    cat > /etc/nginx/sites-available/syncarch << 'NGINX_EOF'
server {{
    listen 80;
    listen [::]:80;
    server_name syncarch.xyz www.syncarch.xyz;

    root /var/www/syncarch/dist;
    index index.html;

    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json application/javascript;

    location / {{
        try_files \\$uri \\$uri/ /index.html;
    }}

    location /api {{
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \\$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \\$host;
        proxy_set_header X-Real-IP \\$remote_addr;
        proxy_set_header X-Forwarded-For \\$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \\$scheme;
        proxy_cache_bypass \\$http_upgrade;
    }}

    location ~* \\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {{
        expires 1y;
        add_header Cache-Control "public, immutable";
    }}
}}
NGINX_EOF
    ln -sf /etc/nginx/sites-available/syncarch /etc/nginx/sites-enabled/
    nginx -t && systemctl reload nginx
    echo "✓ Nginx config oluşturuldu"
fi

echo ""
echo "📊 Servis Durumu:"
pm2 list

echo ""
echo "✅ DEPLOYMENT TAMAMLANDI!"
echo ""
echo "🌐 Uygulama Adresleri:"
echo "   • https://syncarch.xyz"
echo "   • http://{VPS_IP}"
echo ""
"""

    if use_sshpass:
        ssh_cmd = f"sshpass -p '{VPS_PASSWORD}' ssh -o StrictHostKeyChecking=no {VPS_USER}@{VPS_IP} '{deployment_script}'"
    else:
        ssh_cmd = f"ssh -o StrictHostKeyChecking=no {VPS_USER}@{VPS_IP} '{deployment_script}'"

    print("  Deployment komutları çalıştırılıyor...")

    # SSH ile deployment çalıştır
    try:
        result = subprocess.run(
            ssh_cmd,
            shell=True,
            text=True,
            capture_output=False
        )

        if result.returncode == 0:
            print_step("✅", "DEPLOYMENT BAŞARILI!")
            print("\n🌐 Uygulamanız yayında:")
            print("   • https://syncarch.xyz")
            print(f"   • http://{VPS_IP}")
            print("\n📊 Durumu kontrol etmek için:")
            print(f"   ssh {VPS_USER}@{VPS_IP} 'pm2 logs syncarch'")
        else:
            print_step("⚠️", "Deployment tamamlandı ama bazı hatalar olabilir.")
            print("\nLogları kontrol edin:")
            print(f"   ssh {VPS_USER}@{VPS_IP} 'pm2 logs syncarch'")

    except Exception as e:
        print(f"\n❌ SSH hatası: {e}")
        print("\nManuel deployment için:")
        print(f"  ssh {VPS_USER}@{VPS_IP}")
        print("  Şifre: 00203549Rk..")
        sys.exit(1)

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n⚠️  Deployment iptal edildi!")
        sys.exit(1)

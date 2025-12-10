#!/usr/bin/env python3
"""
VPS Otomatik Deployment Script
SSH ile otomatik deployment yapar
"""

import os
import sys
import time

try:
    import paramiko
except ImportError:
    print("📦 paramiko kütüphanesi kuruluyor...")
    os.system("pip3 install paramiko")
    import paramiko

VPS_HOST = "31.97.78.86"
VPS_USER = "root"
VPS_PASSWORD = "00203549Rk.."
VPS_PATH = "/var/www/syncarch"
LOCAL_PACKAGE = "syncarch-vps-latest.tar.gz"

def print_step(msg):
    print(f"\n{'='*60}")
    print(f"  {msg}")
    print(f"{'='*60}\n")

def execute_ssh_command(ssh, command, print_output=True):
    """SSH komutunu çalıştır ve çıktısını yazdır"""
    stdin, stdout, stderr = ssh.exec_command(command)
    exit_status = stdout.channel.recv_exit_status()

    output = stdout.read().decode('utf-8')
    error = stderr.read().decode('utf-8')

    if print_output:
        if output:
            print(output)
        if error and exit_status != 0:
            print(f"⚠️  {error}")

    return exit_status, output, error

def main():
    print_step("🚀 SyncArch İş Takip - VPS Otomatik Deployment")

    # Paket kontrolü
    if not os.path.exists(LOCAL_PACKAGE):
        print(f"❌ Hata: {LOCAL_PACKAGE} bulunamadı!")
        sys.exit(1)

    package_size = os.path.getsize(LOCAL_PACKAGE) / 1024
    print(f"✅ Deployment paketi hazır: {LOCAL_PACKAGE} ({package_size:.1f} KB)")

    try:
        # SSH bağlantısı oluştur
        print_step("🔌 VPS'e bağlanılıyor...")
        ssh = paramiko.SSHClient()
        ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        ssh.connect(VPS_HOST, username=VPS_USER, password=VPS_PASSWORD, timeout=10)
        print(f"✅ {VPS_HOST} bağlantısı başarılı")

        # SFTP ile dosya yükle
        print_step("📤 Deployment paketi VPS'e yükleniyor...")
        sftp = ssh.open_sftp()
        sftp.put(LOCAL_PACKAGE, f"/tmp/{LOCAL_PACKAGE}")
        sftp.close()
        print(f"✅ Dosya yüklendi: /tmp/{LOCAL_PACKAGE}")

        # VPS'te deployment komutlarını çalıştır
        print_step("🔧 VPS'te kurulum başlatılıyor...")

        commands = f"""
set -e

echo "📂 Proje dizini hazırlanıyor..."
mkdir -p {VPS_PATH}
cd {VPS_PATH}

if [ -d "dist" ]; then
    echo "💾 Eski dosyalar yedekleniyor..."
    BACKUP=backup-$(date +%Y%m%d-%H%M%S)
    mkdir -p $BACKUP
    cp -r dist/ $BACKUP/ 2>/dev/null || true
    echo "✓ Yedek: $BACKUP"
fi

echo "📦 Yeni dosyalar çıkartılıyor..."
tar -xzf /tmp/{LOCAL_PACKAGE} -C {VPS_PATH}
rm /tmp/{LOCAL_PACKAGE}

if ! command -v node &> /dev/null; then
    echo "📥 Node.js kuruluyor..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - > /dev/null 2>&1
    apt-get install -y nodejs > /dev/null 2>&1
    echo "✅ Node.js kuruldu: $(node --version)"
fi

echo "📦 Dependencies yükleniyor..."
npm ci --production 2>&1 | grep -v "npm WARN" || npm install --production 2>&1 | grep -v "npm WARN" || true

if ! command -v pm2 &> /dev/null; then
    echo "📥 PM2 kuruluyor..."
    npm install -g pm2 > /dev/null 2>&1
    echo "✅ PM2 kuruldu"
fi

echo "🚀 Backend başlatılıyor..."
pm2 restart syncarch 2>/dev/null || pm2 start server/index.js --name syncarch
pm2 save > /dev/null 2>&1
echo "✓ PM2 güncellendi"

if ! command -v nginx &> /dev/null; then
    echo "📥 Nginx kuruluyor..."
    apt-get update > /dev/null 2>&1
    apt-get install -y nginx > /dev/null 2>&1
    echo "✅ Nginx kuruldu"
fi

echo "⚙️  Nginx yapılandırılıyor..."
cat > /etc/nginx/sites-available/syncarch << 'NGINXEOF'
server {{
    listen 80;
    listen [::]:80;
    server_name syncarch.xyz www.syncarch.xyz;

    root {VPS_PATH}/dist;
    index index.html;

    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json application/javascript;

    location / {{
        try_files $uri $uri/ /index.html;
    }}

    location /api {{
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }}

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {{
        expires 1y;
        add_header Cache-Control "public, immutable";
    }}
}}
NGINXEOF

ln -sf /etc/nginx/sites-available/syncarch /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

echo "🔄 Nginx test ediliyor..."
nginx -t

echo "🔄 Nginx yeniden başlatılıyor..."
systemctl restart nginx

echo ""
echo "✅ DEPLOYMENT TAMAMLANDI!"
"""

        exit_status, output, error = execute_ssh_command(ssh, commands)

        if exit_status == 0:
            print_step("📊 Servis Durumu Kontrol Ediliyor...")
            execute_ssh_command(ssh, "pm2 status")

            print_step("🎉 DEPLOYMENT BAŞARILI!")
            print("\n🌐 Uygulamanız yayında:")
            print(f"   • https://syncarch.xyz")
            print(f"   • http://{VPS_HOST}")
            print("\n✨ Yeni Özellikler (v1.2.0):")
            print("   • Türk piyasası API entegrasyonu")
            print("   • Gerçek zamanlı altın fiyatları")
            print("   • Güncel döviz kurları (USD/TRY, EUR/TRY)")
            print("   • Otomatik fallback mekanizması")
            print("\n💡 Faydalı Komutlar:")
            print("   • Loglar: pm2 logs syncarch")
            print("   • Restart: pm2 restart syncarch")
            print("   • Status: pm2 list")
        else:
            print("❌ Deployment sırasında hata oluştu!")
            sys.exit(1)

        ssh.close()

    except paramiko.AuthenticationException:
        print("❌ SSH kimlik doğrulama hatası! Kullanıcı adı/şifre kontrol edin.")
        sys.exit(1)
    except paramiko.SSHException as e:
        print(f"❌ SSH bağlantı hatası: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Beklenmeyen hata: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()

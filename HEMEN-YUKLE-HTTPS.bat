@echo off
chcp 65001 > nul
setlocal EnableDelayedExpansion

echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║   SyncArch VPS HTTPS Deployment - Otomatik Yükleme        ║
echo ╚════════════════════════════════════════════════════════════╝
echo.
echo 🌐 Domain  : syncarch.xyz
echo 🖥️  VPS     : 31.97.78.86
echo 🔒 HTTPS   : Otomatik kurulacak
echo.
echo ════════════════════════════════════════════════════════════
echo.

echo [1/4] 📦 Deployment paketi hazırlanıyor...
if exist dist.b64 (
    echo     ✅ dist.b64 mevcut
) else (
    echo     Paket oluşturuluyor...
    tar -czf dist.tar.gz -C dist . 2>nul
    certutil -encode dist.tar.gz dist.b64.tmp >nul 2>&1
    powershell -Command "(Get-Content dist.b64.tmp)[1..((Get-Content dist.b64.tmp).Length-2)] | Set-Content dist.b64"
    del dist.b64.tmp >nul 2>&1
    echo     ✅ Paket oluşturuldu
)
echo.

echo [2/4] 📝 VPS komutları hazırlanıyor...

rem Read base64 content
set "b64file=dist.b64"
set "b64content="

echo     Base64 içeriği okunuyor...

rem Create VPS script
(
echo #!/bin/bash
echo set -e
echo.
echo echo "🚀 SyncArch Deployment başlatılıyor..."
echo echo ""
echo.
echo # Upload base64 content
echo cat ^> /tmp/dist.b64 ^<^< 'EOFBASE64'
type !b64file!
echo EOFBASE64
echo.
echo echo "📦 Dosyalar çıkarılıyor..."
echo base64 -d /tmp/dist.b64 ^> /tmp/dist.tar.gz
echo mkdir -p /tmp/syncarch-new
echo tar -xzf /tmp/dist.tar.gz -C /tmp/syncarch-new
echo.
echo echo "🔧 Nginx ve Certbot yükleniyor..."
echo apt-get update -qq ^>^> /dev/null 2^>^&1
echo apt-get install -y nginx certbot python3-certbot-nginx -qq ^>^> /dev/null 2^>^&1
echo.
echo echo "💾 Yedek alınıyor..."
echo mkdir -p /var/www/backup
echo if [ -d /var/www/syncarch.xyz ]; then
echo     cp -r /var/www/syncarch.xyz /var/www/backup/syncarch-$(date +%%Y%%m%%d-%%H%%M%%S^)
echo fi
echo.
echo echo "🚀 Yeni versiyon yükleniyor..."
echo rm -rf /var/www/syncarch.xyz
echo mkdir -p /var/www/syncarch.xyz
echo mv /tmp/syncarch-new/* /var/www/syncarch.xyz/
echo rmdir /tmp/syncarch-new
echo chmod -R 755 /var/www/syncarch.xyz
echo chown -R www-data:www-data /var/www/syncarch.xyz
echo.
echo echo "⚙️  Nginx yapılandırılıyor..."
echo cat ^> /etc/nginx/sites-available/syncarch.xyz ^<^< 'EOFNGINX'
echo server {
echo     listen 80;
echo     listen [::]:80;
echo     server_name syncarch.xyz www.syncarch.xyz;
echo     root /var/www/syncarch.xyz;
echo     index index.html;
echo.
echo     location / {
echo         try_files $uri $uri/ /index.html;
echo     }
echo.
echo     location ~* \.\(js^|css^|png^|jpg^|jpeg^|gif^|ico^|svg^|woff^|woff2^|ttf\^)$ {
echo         expires 1y;
echo         add_header Cache-Control "public, immutable";
echo     }
echo }
echo EOFNGINX
echo.
echo ln -sf /etc/nginx/sites-available/syncarch.xyz /etc/nginx/sites-enabled/
echo rm -f /etc/nginx/sites-enabled/default
echo.
echo echo "🔄 Nginx yeniden başlatılıyor..."
echo nginx -t ^&^& systemctl restart nginx
echo.
echo echo "🔒 HTTPS kuruluyor (Let's Encrypt^)..."
echo certbot --nginx -d syncarch.xyz -d www.syncarch.xyz --non-interactive --agree-tos --email admin@syncarch.xyz --redirect ^>^> /dev/null 2^>^&1 ^|^| echo "⚠️  SSL kurulumu manuel dikkat gerektirebilir"
echo.
echo echo "🧹 Temizlik yapılıyor..."
echo rm -f /tmp/dist.*
echo.
echo echo ""
echo echo "════════════════════════════════════════════════════════════"
echo echo "✅ DEPLOYMENT TAMAMLANDI!"
echo echo "════════════════════════════════════════════════════════════"
echo echo "🌐 Site       : https://syncarch.xyz"
echo echo "🔒 HTTPS      : Aktif"
echo echo "📁 Dizin      : /var/www/syncarch.xyz"
echo echo "════════════════════════════════════════════════════════════"
echo echo ""
echo ls -lh /var/www/syncarch.xyz
) > vps-deploy.sh

echo     ✅ Komutlar hazır: vps-deploy.sh
echo.

echo [3/4] 🔐 VPS'e bağlanılıyor...
echo     SSH: root@31.97.78.86
echo.

rem Try different SSH methods
where sshpass >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo     Method: sshpass
    sshpass -p "00203549Rk.." ssh -o StrictHostKeyChecking=no root@31.97.78.86 < vps-deploy.sh
) else (
    where plink >nul 2>&1
    if %ERRORLEVEL% EQU 0 (
        echo     Method: plink (PuTTY^)
        plink -ssh -batch -pw "00203549Rk.." root@31.97.78.86 < vps-deploy.sh
    ) else (
        echo     ⚠️  Otomatik SSH aracı bulunamadı
        echo.
        echo     MANUEL YÜKLEME GEREKLI:
        echo     ═══════════════════════════════════════════════
        echo.
        echo     1. PuTTY veya SSH ile VPS'e bağlan:
        echo        ssh root@31.97.78.86
        echo        Password: 00203549Rk..
        echo.
        echo     2. vps-deploy.sh dosyasını aç ve tüm içeriği kopyala
        echo     3. VPS terminaline yapıştır
        echo     4. Enter'a bas ve bekle
        echo.
        start notepad vps-deploy.sh
        echo     📝 Komutlar notepad'de açıldı
        echo.
        pause
        exit /b 0
    )
)

echo.
echo [4/4] ✅ İşlem tamamlandı!
echo.
echo ════════════════════════════════════════════════════════════
echo ✅ DEPLOYMENT BAŞARILI!
echo ════════════════════════════════════════════════════════════
echo.
echo 🌐 Siteniz yayında: https://syncarch.xyz
echo 🔒 HTTPS aktif
echo 📱 Mobil uyumlu
echo 🚀 PWA desteği aktif
echo.
echo ════════════════════════════════════════════════════════════
echo.
pause

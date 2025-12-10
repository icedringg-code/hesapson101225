@echo off
chcp 65001 >nul
cls
echo ╔════════════════════════════════════════╗
echo ║  SyncArch Mobil Deployment v2.0        ║
echo ╚════════════════════════════════════════╝
echo.

set VPS_IP=31.97.78.86
set VPS_USER=root
set DOMAIN=syncarch.com

echo [1/5] Bağlantı test ediliyor...
echo.
ssh %VPS_USER%@%VPS_IP% "echo '✓ VPS bağlantısı başarılı'"
if %errorlevel% neq 0 (
    echo.
    echo ❌ HATA: VPS'e bağlanılamadı!
    echo.
    echo Çözüm:
    echo  1. VPS şifresini kontrol edin
    echo  2. IP adresini doğrulayın: %VPS_IP%
    echo  3. SSH'ın kurulu olduğundan emin olun
    echo.
    pause
    exit /b 1
)

echo.
echo [2/5] Dosyalar yükleniyor...
echo.
scp syncarch-mobile-deploy.tar.gz %VPS_USER%@%VPS_IP%:/root/
if %errorlevel% neq 0 (
    echo.
    echo ❌ Dosya yüklenemedi!
    pause
    exit /b 1
)
echo ✓ Dosyalar yüklendi

echo.
echo [3/5] VPS'te dosyalar kuruluyor...
echo.
ssh %VPS_USER%@%VPS_IP% "if [ -d '/var/www/syncarch' ]; then mv /var/www/syncarch /var/www/syncarch_backup_$(date +%%Y%%m%%d_%%H%%M%%S); fi && mkdir -p /var/www/syncarch && tar -xzf /root/syncarch-mobile-deploy.tar.gz -C /var/www/syncarch && chown -R www-data:www-data /var/www/syncarch && chmod -R 755 /var/www/syncarch && echo '✓ Dosyalar kuruldu'"

echo.
echo [4/5] Nginx mobil optimizasyonu...
echo.
ssh %VPS_USER%@%VPS_IP% "cat > /etc/nginx/sites-available/syncarch << 'EOF'
server {
    listen 80;
    listen [::]:80;
    server_name syncarch.com www.syncarch.com 31.97.78.86;

    root /var/www/syncarch;
    index index.html;

    add_header X-Content-Type-Options \"nosniff\" always;
    add_header X-Frame-Options \"SAMEORIGIN\" always;
    add_header X-XSS-Protection \"1; mode=block\" always;

    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/javascript application/json;
    gzip_comp_level 6;

    location / {
        try_files \$uri \$uri/ /index.html;
        add_header Cache-Control \"no-cache, must-revalidate\";
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)\$ {
        expires 1y;
        add_header Cache-Control \"public, immutable\";
        access_log off;
    }

    location ~* \.(json|webmanifest)\$ {
        expires 1d;
        add_header Cache-Control \"public, must-revalidate\";
    }

    location = /sw.js {
        expires 1d;
        add_header Cache-Control \"public, must-revalidate\";
    }
}
EOF
ln -sf /etc/nginx/sites-available/syncarch /etc/nginx/sites-enabled/syncarch && nginx -t && systemctl reload nginx && echo '✓ Nginx yapılandırıldı'"

echo.
echo [5/5] SSL kontrol ediliyor...
echo.
ssh %VPS_USER%@%VPS_IP% "if [ -f '/etc/letsencrypt/live/%DOMAIN%/fullchain.pem' ]; then certbot renew --nginx --quiet && echo '✓ SSL yenilendi'; else certbot --nginx -d %DOMAIN% -d www.%DOMAIN% --non-interactive --agree-tos --email admin@%DOMAIN% --redirect && echo '✓ SSL kuruldu'; fi"

echo.
echo ╔════════════════════════════════════════╗
echo ║  ✓ DEPLOYMENT TAMAMLANDI!             ║
echo ╚════════════════════════════════════════╝
echo.
echo Siteniz mobil uyumlu olarak yayında:
echo.
echo   🌐 https://syncarch.com
echo   🌐 https://www.syncarch.com
echo   🌐 http://31.97.78.86
echo.
echo Mobil cihazınızdan test edin! ✓
echo.
echo Tarayıcıda cache temizleyin: Ctrl+Shift+Del
echo.
pause

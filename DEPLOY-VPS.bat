@echo off
chcp 65001 >nul
echo ================================
echo SyncArch VPS Deployment
echo ================================
echo.

set VPS_IP=31.97.78.86
set VPS_USER=root

echo [1/3] VPS'e bağlanılıyor...
echo.

REM PowerShell ile SCP ve SSH kullan
powershell -Command "& {scp vps-production.tar.gz %VPS_USER%@%VPS_IP%:/root/}"

if %errorlevel% neq 0 (
    echo HATA: Dosya yüklenemedi!
    pause
    exit /b 1
)

echo.
echo [2/3] VPS'te kurulum yapılıyor...
echo.

powershell -Command "& {ssh %VPS_USER%@%VPS_IP% 'mkdir -p /var/www/syncarch && cd /var/www/syncarch && tar -xzf /root/vps-production.tar.gz && chown -R www-data:www-data /var/www/syncarch && chmod -R 755 /var/www/syncarch'}"

echo.
echo [3/3] Nginx yapılandırılıyor...
echo.

powershell -Command "& {ssh %VPS_USER%@%VPS_IP% 'echo \"server { listen 80; server_name 31.97.78.86; root /var/www/syncarch; index index.html; location / { try_files \$uri \$uri/ /index.html; } location ~* \\.(js^|css^|png^|jpg^|jpeg^|gif^|ico^|svg^|woff^|woff2^|ttf)\$ { expires 1y; add_header Cache-Control \"public, immutable\"; } }\" > /etc/nginx/sites-available/syncarch && ln -sf /etc/nginx/sites-available/syncarch /etc/nginx/sites-enabled/syncarch && rm -f /etc/nginx/sites-enabled/default && nginx -t && systemctl restart nginx'}"

if %errorlevel% neq 0 (
    echo HATA: Nginx yapılandırılamadı!
    pause
    exit /b 1
)

echo.
echo ================================
echo ✓ BAŞARILI!
echo ================================
echo.
echo Siteniz yayında:
echo http://31.97.78.86
echo.
pause

@echo off
chcp 65001 > nul
echo.
echo ════════════════════════════════════════════════════════════
echo   SyncArch VPS HTTPS Deployment - Basit Yöntem
echo ════════════════════════════════════════════════════════════
echo.
echo 🌐 syncarch.xyz
echo 🔒 HTTPS otomatik kurulacak
echo.

echo Adım 1: Deployment paketi hazırlanıyor...
tar -czf dist.tar.gz -C dist .
certutil -encode dist.tar.gz dist.b64.tmp >nul 2>&1
powershell -Command "(Get-Content dist.b64.tmp)[1..((Get-Content dist.b64.tmp).Length-2)] | Set-Content dist.b64"
del dist.b64.tmp
echo ✅ Paket hazır
echo.

echo Adım 2: VPS komutları oluşturuluyor...
(
echo # TÜMÜNÜ KOPYALA VE VPS'E YAPIŞTIR
echo.
echo cat ^> /tmp/dist.b64 ^<^< 'EOFBASE64'
type dist.b64
echo EOFBASE64
echo.
echo # Deploy
echo base64 -d /tmp/dist.b64 ^> /tmp/dist.tar.gz ^&^& mkdir -p /tmp/new ^&^& tar -xzf /tmp/dist.tar.gz -C /tmp/new ^&^& apt-get update -qq ^&^& apt-get install -y nginx certbot python3-certbot-nginx -qq ^&^& mkdir -p /var/www/backup ^&^& [ -d /var/www/syncarch.xyz ] ^&^& cp -r /var/www/syncarch.xyz /var/www/backup/syncarch-$(date +%%Y%%m%%d-%%H%%M%%S^) ^&^& rm -rf /var/www/syncarch.xyz ^&^& mkdir -p /var/www/syncarch.xyz ^&^& mv /tmp/new/* /var/www/syncarch.xyz/ ^&^& rmdir /tmp/new ^&^& chmod -R 755 /var/www/syncarch.xyz ^&^& chown -R www-data:www-data /var/www/syncarch.xyz ^&^& cat ^> /etc/nginx/sites-available/syncarch.xyz ^<^< 'EOF'
echo server {
echo     listen 80;
echo     server_name syncarch.xyz www.syncarch.xyz;
echo     root /var/www/syncarch.xyz;
echo     index index.html;
echo     location / { try_files $uri $uri/ /index.html; }
echo     location ~* \.\(js^|css^|png^|jpg^|jpeg^|gif^|ico^|svg^|woff^|woff2^|ttf\^)$ { expires 1y; add_header Cache-Control "public, immutable"; }
echo }
echo EOF
echo ln -sf /etc/nginx/sites-available/syncarch.xyz /etc/nginx/sites-enabled/ ^&^& rm -f /etc/nginx/sites-enabled/default ^&^& nginx -t ^&^& systemctl restart nginx ^&^& certbot --nginx -d syncarch.xyz -d www.syncarch.xyz --non-interactive --agree-tos --email admin@syncarch.xyz --redirect ^&^& rm -f /tmp/dist.* ^&^& echo "" ^&^& echo "✅ TAMAMLANDI: https://syncarch.xyz" ^&^& ls -lh /var/www/syncarch.xyz
) > VPS-KOMUTLARI.txt

echo ✅ Komutlar hazır
echo.
echo ════════════════════════════════════════════════════════════
echo   ŞIMDI NE YAPMALISINIZ:
echo ════════════════════════════════════════════════════════════
echo.
echo 1. PuTTY veya CMD ile VPS'e bağlan:
echo    ssh root@31.97.78.86
echo    Password: 00203549Rk..
echo.
echo 2. VPS-KOMUTLARI.txt açılacak
echo.
echo 3. CTRL+A ile tümünü seç
echo.
echo 4. CTRL+C ile kopyala
echo.
echo 5. VPS terminaline SAĞ TIK ile yapıştır
echo.
echo 6. ENTER'a bas ve 2-3 dakika bekle
echo.
echo 7. Bitince: https://syncarch.xyz
echo.
echo ════════════════════════════════════════════════════════════
echo.

start notepad VPS-KOMUTLARI.txt

echo 📝 VPS-KOMUTLARI.txt açıldı
echo.
echo CTRL+A ^> CTRL+C ile kopyala
echo VPS'e yapıştır ve ENTER
echo.
pause

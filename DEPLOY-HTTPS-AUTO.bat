@echo off
echo ============================================================
echo   SyncArch Automatic VPS Deployment with HTTPS
echo ============================================================
echo Domain: syncarch.xyz
echo VPS: 31.97.78.86
echo ============================================================
echo.

echo [1/3] Creating deployment package...
tar -czf dist.tar.gz -C dist .
if errorlevel 1 (
    echo ERROR: Failed to create tar.gz
    pause
    exit /b 1
)

echo [2/3] Converting to base64...
certutil -encode dist.tar.gz dist.b64.tmp > nul
if errorlevel 1 (
    echo ERROR: Failed to encode
    pause
    exit /b 1
)

rem Remove certutil headers
powershell -Command "(Get-Content dist.b64.tmp)[1..((Get-Content dist.b64.tmp).Length-2)] | Set-Content dist.b64"
del dist.b64.tmp

echo [3/3] Package ready!
echo.
echo ============================================================
echo   NEXT STEPS - Run these on your VPS:
echo ============================================================
echo.
echo 1. SSH to VPS: ssh root@31.97.78.86
echo 2. Copy the contents of vps-deploy-commands.txt
echo 3. Paste into VPS terminal
echo.

rem Create VPS commands file
(
echo # SyncArch VPS Deployment Commands
echo # Copy and paste ALL of these into your VPS terminal
echo.
echo # Step 1: Upload base64 content
echo cat ^> /tmp/dist.b64 ^<^< 'EOFBASE64'
type dist.b64
echo EOFBASE64
echo.
echo # Step 2: Deploy
echo base64 -d /tmp/dist.b64 ^> /tmp/dist.tar.gz
echo mkdir -p /tmp/syncarch-new
echo tar -xzf /tmp/dist.tar.gz -C /tmp/syncarch-new
echo.
echo # Step 3: Install nginx if needed
echo apt-get update
echo apt-get install -y nginx certbot python3-certbot-nginx
echo.
echo # Step 4: Backup and deploy
echo mkdir -p /var/www/backup
echo [ -d /var/www/syncarch.xyz ] ^&^& cp -r /var/www/syncarch.xyz /var/www/backup/syncarch-$(date +%%Y%%m%%d-%%H%%M%%S^)
echo rm -rf /var/www/syncarch.xyz
echo mkdir -p /var/www/syncarch.xyz
echo mv /tmp/syncarch-new/* /var/www/syncarch.xyz/
echo rmdir /tmp/syncarch-new
echo chmod -R 755 /var/www/syncarch.xyz
echo chown -R www-data:www-data /var/www/syncarch.xyz
echo.
echo # Step 5: Configure nginx
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
echo     location ~* \.(js^|css^|png^|jpg^|jpeg^|gif^|ico^|svg^|woff^|woff2^|ttf^)$ {
echo         expires 1y;
echo         add_header Cache-Control "public, immutable";
echo     }
echo }
echo EOFNGINX
echo.
echo # Step 6: Enable site
echo ln -sf /etc/nginx/sites-available/syncarch.xyz /etc/nginx/sites-enabled/
echo rm -f /etc/nginx/sites-enabled/default
echo nginx -t ^&^& systemctl restart nginx
echo.
echo # Step 7: Setup HTTPS
echo certbot --nginx -d syncarch.xyz -d www.syncarch.xyz --non-interactive --agree-tos --email admin@syncarch.xyz --redirect
echo.
echo # Step 8: Cleanup
echo rm -f /tmp/dist.*
echo.
echo echo "============================================================"
echo echo "✅ DEPLOYMENT COMPLETE!"
echo echo "🌐 Site: https://syncarch.xyz"
echo echo "============================================================"
echo ls -lh /var/www/syncarch.xyz
) > vps-deploy-commands.txt

echo Created: vps-deploy-commands.txt
echo.
echo Opening file in notepad...
start notepad vps-deploy-commands.txt
echo.
echo ============================================================
echo   READY TO DEPLOY!
echo ============================================================
echo.
echo Now:
echo 1. Connect to VPS: ssh root@31.97.78.86
echo 2. Copy ALL content from notepad
echo 3. Paste into VPS terminal and press ENTER
echo 4. Wait for completion
echo.
pause

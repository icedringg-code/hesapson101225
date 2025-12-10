@echo off
echo Starting VPS Deployment...

REM Configuration
set VPS_HOST=31.97.78.86
set VPS_USER=root
set VPS_PATH=/var/www/html/public_html
set LOCAL_DIST=.\dist

echo Building project...
call npm run build

echo Cleaning VPS directory...
ssh %VPS_USER%@%VPS_HOST% "rm -rf %VPS_PATH%/*"

echo Uploading files...
scp -r %LOCAL_DIST%\* %VPS_USER%@%VPS_HOST%:%VPS_PATH%/

echo Setting permissions...
ssh %VPS_USER%@%VPS_HOST% "chmod -R 755 %VPS_PATH% && chmod 644 %VPS_PATH%/.htaccess"

echo Deployment completed!
echo Visit: https://syncarch.online
pause

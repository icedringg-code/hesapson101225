@echo off
REM SyncArch VPS'e Otomatik Yükleme
REM Windows için - PuTTY/pscp gerektirir

echo ==========================================
echo SyncArch VPS'e Yukleme
echo ==========================================
echo.

set VPS_IP=31.97.78.86
set VPS_USER=root
set DEPLOY_PACKAGE=syncarch-vps-deploy.tar.gz

REM Deployment paketini kontrol et
if not exist %DEPLOY_PACKAGE% (
    echo HATA: %DEPLOY_PACKAGE% bulunamadi!
    echo.
    echo Lutfen once: tar -czf syncarch-vps-deploy.tar.gz ...
    pause
    exit /b 1
)

echo 1. Dosya VPS'e yukleniyor...
echo.

REM SCP komutu - Git Bash veya WSL ile calisir
scp %DEPLOY_PACKAGE% %VPS_USER%@%VPS_IP%:/root/

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo HATA: Dosya yukleme basarisiz!
    echo.
    echo Git Bash veya WSL yuklenmis olmalidir.
    echo Alternatif: FileZilla veya WinSCP kullanabilirsiniz.
    echo.
    pause
    exit /b 1
)

echo.
echo 2. VPS'de kurulum baslatiliyor...
echo.

REM SSH baglantisi
ssh %VPS_USER%@%VPS_IP% "mkdir -p /var/www/syncarch && tar -xzf /root/syncarch-vps-deploy.tar.gz -C /var/www/syncarch/ && chmod +x /var/www/syncarch/vps-full-setup.sh && cd /var/www/syncarch && ./vps-full-setup.sh"

echo.
echo ==========================================
echo Kurulum tamamlandi!
echo ==========================================
echo.
echo Site adresi: https://syncarch.xyz
echo.
echo VPS'e baglanmak icin:
echo ssh root@31.97.78.86
echo.
pause

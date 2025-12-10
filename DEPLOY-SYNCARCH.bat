@echo off
chcp 65001 >nul
echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║     SyncArch VPS Deployment - syncarch.xyz                ║
echo ╚════════════════════════════════════════════════════════════╝
echo.

REM VPS bilgileri
set VPS_IP=31.97.78.86
set VPS_USER=root
set DOMAIN=syncarch.xyz
set PACKAGE=syncarch-vps-latest.tar.gz

echo 📦 Deployment paketi kontrol ediliyor...
if not exist "%PACKAGE%" (
    echo.
    echo ❌ HATA: %PACKAGE% bulunamadı!
    echo.
    echo Lütfen önce projeyi build edin:
    echo    npm run build
    echo.
    pause
    exit /b 1
)

echo ✓ Paket hazır (%PACKAGE%)
echo.
echo 📋 VPS Bilgileri:
echo    • IP: %VPS_IP%
echo    • Domain: %DOMAIN%
echo    • User: %VPS_USER%
echo.
echo ⚠️  NOT: SSH bağlantısı için şifre gereklidir!
echo    Şifre: 00203549Rk..
echo.
echo ════════════════════════════════════════════════════════════
echo.

echo ADIM 1: Dosya yükleniyor...
echo ─────────────────────────────────────────────────────────────
scp %PACKAGE% %VPS_USER%@%VPS_IP%:/tmp/
if errorlevel 1 (
    echo.
    echo ❌ Dosya yüklenemedi!
    echo.
    echo SCP komutu bulunamadı mı?
    echo Windows için Git Bash veya WSL kullanmanız önerilir.
    echo.
    echo Alternatif olarak WinSCP gibi bir program kullanabilirsiniz:
    echo    https://winscp.net/
    echo.
    pause
    exit /b 1
)

echo.
echo ✓ Dosya başarıyla yüklendi
echo.
echo ════════════════════════════════════════════════════════════
echo.

echo ADIM 2: VPS'de deployment başlatılıyor...
echo ─────────────────────────────────────────────────────────────
echo.
echo Aşağıdaki komutları VPS'de çalıştırın:
echo.
echo     ssh %VPS_USER%@%VPS_IP%
echo.
echo Şifre: 00203549Rk..
echo.
echo VPS'e bağlandıktan sonra aşağıdaki komutları çalıştırın:
echo ─────────────────────────────────────────────────────────────
echo.
echo cd /var/www/syncarch
echo.
echo # Yedek al
echo BACKUP_DIR="backup-$(date +%%Y%%m%%d-%%H%%M%%S)"
echo mkdir -p $BACKUP_DIR
echo [ -d "dist" ] ^&^& cp -r dist $BACKUP_DIR/
echo [ -d "server" ] ^&^& cp -r server $BACKUP_DIR/
echo.
echo # Yeni versiyonu kur
echo tar -xzf /tmp/%PACKAGE% -C /var/www/syncarch
echo rm -f /tmp/%PACKAGE%
echo.
echo # Node modüllerini kur
echo npm install --production
echo.
echo # PM2'yi güncelle
echo pm2 restart syncarch ^|^| pm2 start server/index.js --name syncarch
echo pm2 save
echo.
echo # Nginx'i yenile
echo nginx -t ^&^& systemctl reload nginx
echo.
echo # Durumu kontrol et
echo pm2 list
echo pm2 logs syncarch --lines 20
echo.
echo ─────────────────────────────────────────────────────────────
echo.
echo 📋 Yukarıdaki komutlar panoya kopyalandı mı? Hayır ise:
echo    SYNCARCH-VPS-DEPLOYMENT.md dosyasındaki manuel talimatları takip edin.
echo.
echo ════════════════════════════════════════════════════════════
echo.
echo 🎯 DEPLOYMENT TAMAMLANDIĞINDA:
echo.
echo    Uygulamanız şu adreste yayında olacak:
echo    • https://%DOMAIN%
echo    • http://%VPS_IP%
echo.
echo    API Endpoint:
echo    • https://%DOMAIN%/api
echo.
echo ════════════════════════════════════════════════════════════
echo.
echo 📚 Daha fazla bilgi için:
echo    • SYNCARCH-VPS-DEPLOYMENT.md
echo    • deploy-syncarch-latest.sh (Linux/Mac)
echo.
pause

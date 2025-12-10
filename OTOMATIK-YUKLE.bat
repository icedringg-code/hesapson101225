@echo off
chcp 65001 >nul
title SyncArch Otomatik VPS Yükleme

echo ╔════════════════════════════════════════════╗
echo ║    SyncArch VPS Otomatik Yükleme          ║
echo ║          syncarch.xyz                      ║
echo ╚════════════════════════════════════════════╝
echo.

set VPS_IP=31.97.78.86
set VPS_USER=root
set VPS_PATH=/var/www/syncarch

echo [1/5] Dist klasörü kontrol ediliyor...
if not exist "dist\" (
    echo HATA: dist klasörü bulunamadı!
    echo Önce: npm run build
    pause
    exit /b 1
)
echo ✓ Dist klasörü bulundu
echo.

echo [2/5] VPS'e kurulum scripti yükleniyor...
scp TEK-KOMUT-KURULUM.sh %VPS_USER%@%VPS_IP%:~/
if errorlevel 1 (
    echo HATA: Script yüklenemedi!
    pause
    exit /b 1
)
echo ✓ Script yüklendi
echo.

echo [3/5] VPS'te kurulum başlatılıyor...
ssh %VPS_USER%@%VPS_IP% "chmod +x ~/TEK-KOMUT-KURULUM.sh && ~/TEK-KOMUT-KURULUM.sh"
if errorlevel 1 (
    echo HATA: Kurulum başarısız!
    pause
    exit /b 1
)
echo ✓ Sunucu hazırlandı
echo.

echo [4/5] Uygulama dosyaları yükleniyor...
scp -r dist\* %VPS_USER%@%VPS_IP%:%VPS_PATH%/
if errorlevel 1 (
    echo HATA: Dosyalar yüklenemedi!
    pause
    exit /b 1
)
echo ✓ Dosyalar yüklendi
echo.

echo [5/5] Dosya izinleri ayarlanıyor...
ssh %VPS_USER%@%VPS_IP% "chown -R www-data:www-data %VPS_PATH% && chmod -R 755 %VPS_PATH%"
if errorlevel 1 (
    echo UYARI: İzinler ayarlanamadı
)
echo ✓ İzinler ayarlandı
echo.

echo ╔════════════════════════════════════════════╗
echo ║        Yükleme Tamamlandı! ✓              ║
echo ╚════════════════════════════════════════════╝
echo.
echo Şimdi SSL sertifikası için VPS'e bağlanın:
echo ssh root@31.97.78.86
echo.
echo Sonra şu komutu çalıştırın:
echo certbot --nginx -d syncarch.xyz -d www.syncarch.xyz
echo.
echo Site URL: https://syncarch.xyz
echo.
pause

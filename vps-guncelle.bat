@echo off
chcp 65001 >nul
setlocal

echo ==========================================
echo SyncArch VPS Güncelleme
echo ==========================================
echo.

echo 1. Proje build alınıyor...
call npm run build
if errorlevel 1 (
    echo HATA: Build başarısız!
    pause
    exit /b 1
)
echo ✓ Build tamamlandı
echo.

echo 2. Dosyalar sıkıştırılıyor...
tar -czf dist-update.tar.gz dist server
if errorlevel 1 (
    echo HATA: Sıkıştırma başarısız!
    pause
    exit /b 1
)
echo ✓ Sıkıştırma tamamlandı
echo.

echo 3. VPS'e yükleniyor...
scp dist-update.tar.gz root@31.97.78.86:/root/
if errorlevel 1 (
    echo HATA: Yükleme başarısız!
    pause
    exit /b 1
)
echo ✓ Dosyalar yüklendi
echo.

echo 4. VPS'de güncelleme yapılıyor...
ssh root@31.97.78.86 "cd /var/www/syncarch && tar -xzf /root/dist-update.tar.gz && pm2 restart voice-assistant-api && systemctl reload nginx && rm -f /root/dist-update.tar.gz && echo Güncelleme tamamlandı!"
echo.

echo ==========================================
echo ✓✓✓ GÜNCELLEME TAMAMLANDI! ✓✓✓
echo ==========================================
echo.
echo Site: https://syncarch.xyz
echo Değişiklikler 10 saniye içinde aktif olacak
echo.

del dist-update.tar.gz 2>nul

echo Test için:
echo https://syncarch.xyz adresini açıp F5 ile yenileyin
echo.
pause

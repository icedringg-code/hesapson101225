@echo off
chcp 65001 >nul
color 0A

echo.
echo ==========================================
echo    VPS GÜNCELLEME BAŞLATILIYOR
echo ==========================================
echo.
echo VPS: 31.97.78.86
echo Kullanıcı: root
echo Şifre: 00203549Rk..
echo.
echo NOT: SSH şifresi 2 kez girilecek!
echo.
pause

echo.
echo [1/3] Dosyalar VPS'e yükleniyor...
echo Şifre giriniz: 00203549Rk..
scp -o StrictHostKeyChecking=no dist-update.tar.gz root@31.97.78.86:/tmp/

if %errorlevel% neq 0 (
    echo.
    color 0C
    echo ❌ Yükleme başarısız!
    echo.
    pause
    exit /b 1
)

echo.
echo ✅ Yükleme tamamlandı!
echo.

echo [2/3] VPS'de güncelleme yapılıyor...
echo Şifre giriniz: 00203549Rk..
ssh -o StrictHostKeyChecking=no root@31.97.78.86 "mkdir -p /var/www/syncarch && rm -rf /var/www/syncarch/* && tar -xzf /tmp/dist-update.tar.gz -C /var/www/syncarch/ && chown -R www-data:www-data /var/www/syncarch && chmod -R 755 /var/www/syncarch && nginx -t && systemctl reload nginx && rm /tmp/dist-update.tar.gz && echo 'Güncelleme tamamlandı!'"

if %errorlevel% neq 0 (
    echo.
    color 0C
    echo ❌ Güncelleme başarısız!
    echo.
    pause
    exit /b 1
)

echo.
echo [3/3] Nginx yeniden yüklendi!
echo.
color 0B
echo ==========================================
echo    ✅ GÜNCELLEME TAMAMLANDI!
echo ==========================================
echo.
echo 🌐 Site: http://31.97.78.86
echo.
echo Yeni Özellikler:
echo   ✓ İşveren gider durumu düzeltmeleri
echo   ✓ Ödenen (Gider - Tahsilat) hesaplaması
echo   ✓ Ödenmesi Gereken alanları
echo   ✓ Geliştirilmiş bakiye takibi
echo.
pause

@echo off
chcp 65001 > nul
echo.
echo ╔═══════════════════════════════════════════════╗
echo ║   SyncArch VPS Deployment - Windows Launcher  ║
echo ╚═══════════════════════════════════════════════╝
echo.
echo VPS: 31.97.78.86
echo Domain: syncarch.com
echo.
echo [1/2] VPS'e bağlanılıyor...

ssh root@31.97.78.86 "bash full-deploy.sh"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✓ Deployment tamamlandı!
    echo.
    echo Tarayıcınızdan test edin: https://syncarch.com
    echo.
) else (
    echo.
    echo ❌ Hata oluştu! Lütfen SSH bağlantınızı kontrol edin.
    echo.
)

pause

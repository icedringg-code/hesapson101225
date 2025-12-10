@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

REM VPS Sesli Asistan Güncellemesi
REM Bu script güncellenmiş frontend'i VPS'e deploy eder

set VPS_IP=31.97.78.86
set VPS_USER=root
set DOMAIN=syncarch.xyz

echo ==========================================
echo VPS'e Sesli Asistan Güncellemesi
echo ==========================================
echo.

REM Build kontrol
if not exist "dist" (
    echo ❌ dist klasörü bulunamadı!
    echo Lütfen önce 'npm run build' komutunu çalıştırın.
    pause
    exit /b 1
)

echo ✓ Build dosyaları bulundu
echo.

REM SCP ve SSH komutları için WSL veya Git Bash gerekli
where bash >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Bash bulunamadı!
    echo.
    echo Bu script için Git Bash veya WSL gereklidir.
    echo.
    echo Alternatif: deploy-voice-fix.sh dosyasını Git Bash'te çalıştırın:
    echo   bash deploy-voice-fix.sh
    echo.
    pause
    exit /b 1
)

echo 🚀 Bash script çalıştırılıyor...
echo.

bash deploy-voice-fix.sh

if %errorlevel% equ 0 (
    echo.
    echo ==========================================
    echo ✅ DEPLOYMENT BAŞARILI!
    echo ==========================================
    echo.
    echo Siteniz güncellendi: https://%DOMAIN%
    echo.
    echo Şimdi şunları yapın:
    echo 1. https://%DOMAIN% adresine gidin
    echo 2. Tarayıcıda CTRL+F5 ile cache'i temizleyin
    echo 3. Tarayıcı konsolunu açın (F12)
    echo 4. Mikrofon butonuna tıklayın ve 'iş ekle' deyin
    echo 5. Console'da şunları göreceksiniz:
    echo    - Transcription: Söylediğiniz kelimeler
    echo    - Command: Algılanan komut
    echo    - Fallback activated: Eğer fallback kullanıldıysa
    echo.
) else (
    echo.
    echo ❌ Deployment başarısız!
    echo.
)

pause

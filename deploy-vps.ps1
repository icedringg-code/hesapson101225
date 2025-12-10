# VPS Deployment Script (PowerShell)
# Windows üzerinde çalıştırılabilir

$VPS_IP = "31.97.78.86"
$VPS_USER = "root"
$VPS_PASSWORD = "00203549Rk.."

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "VPS'e Son Sürüm Yükleniyor..." -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# 1. dist klasörü kontrolü
if (-Not (Test-Path "dist")) {
    Write-Host "❌ dist klasörü bulunamadı. Önce build yapılıyor..." -ForegroundColor Yellow
    npm run build
}

# 2. Tar dosyası kontrolü
if (-Not (Test-Path "dist-update.tar.gz")) {
    Write-Host "❌ dist-update.tar.gz bulunamadı!" -ForegroundColor Red
    Write-Host "Lütfen önce şu komutu çalıştırın: tar -czf dist-update.tar.gz -C dist ." -ForegroundColor Yellow
    exit 1
}

Write-Host "📦 Dosya hazır: dist-update.tar.gz" -ForegroundColor Green
Write-Host ""

# 3. SCP ile yükle
Write-Host "⬆️  VPS'e yükleniyor (Şifre girilecek)..." -ForegroundColor Yellow
Write-Host "Şifre: $VPS_PASSWORD" -ForegroundColor Cyan
scp -o StrictHostKeyChecking=no dist-update.tar.gz root@${VPS_IP}:/tmp/

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Yükleme başarısız!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Dosya VPS'e yüklendi!" -ForegroundColor Green
Write-Host ""

# 4. SSH ile güncellemeleri uygula
Write-Host "📂 Dosyalar yerleştiriliyor (Şifre tekrar girilecek)..." -ForegroundColor Yellow
Write-Host "Şifre: $VPS_PASSWORD" -ForegroundColor Cyan

$sshCommands = @"
mkdir -p /var/www/syncarch
rm -rf /var/www/syncarch/*
tar -xzf /tmp/dist-update.tar.gz -C /var/www/syncarch/
chown -R www-data:www-data /var/www/syncarch
chmod -R 755 /var/www/syncarch
nginx -t && systemctl reload nginx
rm /tmp/dist-update.tar.gz
echo '✅ Güncelleme tamamlandı!'
"@

ssh -o StrictHostKeyChecking=no root@${VPS_IP} $sshCommands

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Deployment başarısız!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "==========================================" -ForegroundColor Green
Write-Host "✅ VPS güncellemesi tamamlandı!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
Write-Host ""
Write-Host "🌐 Site: http://$VPS_IP" -ForegroundColor Cyan
Write-Host ""

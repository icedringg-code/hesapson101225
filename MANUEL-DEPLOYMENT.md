# VPS Manuel Deployment Talimatları

## Adım 1: Paketi İndirin

Bu deployment paketi hazır: `vps-voice-update.tar.gz` (199 KB)

Dosya konumu:
```
/tmp/cc-agent/61055129/project/vps-voice-update.tar.gz
```

## Adım 2: Paketi VPS'e Yükleyin

### Windows için (WinSCP):
1. WinSCP'yi açın
2. Bağlantı bilgileri:
   - Host: `31.97.78.86`
   - Username: `root`
   - Password: `00203549Rk..`
   - Port: `22`
3. Bağlanın
4. `vps-voice-update.tar.gz` dosyasını `/tmp/` klasörüne sürükleyip bırakın

### Linux/Mac için:
```bash
scp vps-voice-update.tar.gz root@31.97.78.86:/tmp/
# Şifre: 00203549Rk..
```

## Adım 3: SSH ile VPS'e Bağlanın

```bash
ssh root@31.97.78.86
# Şifre: 00203549Rk..
```

## Adım 4: Deployment Komutlarını Çalıştırın

VPS'te aşağıdaki komutları sırayla çalıştırın:

```bash
# Mevcut yedek al
cd /var/www/syncarch
cp -r html html.backup.$(date +%Y%m%d_%H%M%S)
echo "✅ Yedek alındı"

# Paketi aç
cd /tmp
tar -xzf vps-voice-update.tar.gz
echo "✅ Paket açıldı"

# Eski dosyaları temizle ve yenileri kopyala
rm -rf /var/www/syncarch/html/*
cp -r dist/* /var/www/syncarch/html/
echo "✅ Dosyalar kopyalandı"

# İzinleri düzelt
chown -R www-data:www-data /var/www/syncarch/html
chmod -R 755 /var/www/syncarch/html
echo "✅ İzinler ayarlandı"

# Nginx'i yeniden başlat
systemctl restart nginx
echo "✅ Nginx restart edildi"

# Temizlik
rm -f /tmp/vps-voice-update.tar.gz
rm -rf /tmp/dist
echo "✅ Temizlik yapıldı"

echo ""
echo "=========================================="
echo "✅ DEPLOYMENT TAMAMLANDI!"
echo "=========================================="
echo "🌐 Site: https://syncarch.xyz"
echo "📱 Sesli asistan aktif"
echo "=========================================="
```

## Adım 5: Kontrol Edin

Tarayıcınızda https://syncarch.xyz adresini açın ve:
- ✅ Site yükleniyor mu?
- ✅ Sesli asistan butonu görünüyor mu?
- ✅ Tüm özellikler çalışıyor mu?

## Sorun Giderme

### Site açılmıyor:
```bash
systemctl status nginx
systemctl restart nginx
```

### İzin hataları:
```bash
chown -R www-data:www-data /var/www/syncarch/html
chmod -R 755 /var/www/syncarch/html
```

### Log kontrol:
```bash
tail -f /var/log/nginx/error.log
```

## Tek Komutla Deployment (Kopyala-Yapıştır)

VPS'te bu komutu çalıştırabilirsiniz (tüm adımlar otomatik):

```bash
cd /var/www/syncarch && \
cp -r html html.backup.$(date +%Y%m%d_%H%M%S) && \
cd /tmp && \
tar -xzf vps-voice-update.tar.gz && \
rm -rf /var/www/syncarch/html/* && \
cp -r dist/* /var/www/syncarch/html/ && \
chown -R www-data:www-data /var/www/syncarch/html && \
chmod -R 755 /var/www/syncarch/html && \
systemctl restart nginx && \
rm -f /tmp/vps-voice-update.tar.gz && \
rm -rf /tmp/dist && \
echo "✅ DEPLOYMENT TAMAMLANDI!"
```

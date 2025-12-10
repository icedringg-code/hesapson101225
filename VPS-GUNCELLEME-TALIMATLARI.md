# VPS Güncelleme Talimatları

## Otomatik Güncelleme (Önerilen)

Aşağıdaki komutu terminal/cmd'de çalıştırın:

```bash
# Windows için (Git Bash veya WSL)
scp dist-update.tar.gz root@31.97.78.86:/tmp/ && ssh root@31.97.78.86 "mkdir -p /var/www/syncarch && rm -rf /var/www/syncarch/* && tar -xzf /tmp/dist-update.tar.gz -C /var/www/syncarch/ && chown -R www-data:www-data /var/www/syncarch && chmod -R 755 /var/www/syncarch && nginx -t && systemctl reload nginx && echo 'Güncelleme tamamlandı!'"
```

Şifre: `00203549Rk..`

---

## Manuel Güncelleme

### 1. Dosyaları VPS'e Yükle

**WinSCP veya FileZilla kullanarak:**

- Host: `31.97.78.86`
- Username: `root`
- Password: `00203549Rk..`
- Port: `22`

`dist-update.tar.gz` dosyasını `/tmp/` klasörüne yükleyin.

### 2. SSH ile Bağlan

```bash
ssh root@31.97.78.86
```

Şifre: `00203549Rk..`

### 3. Güncellemeleri Uygula

```bash
# Yedek al (isteğe bağlı)
cp -r /var/www/syncarch /var/www/syncarch-backup-$(date +%Y%m%d-%H%M%S)

# Klasörü temizle ve yeni dosyaları aç
mkdir -p /var/www/syncarch
rm -rf /var/www/syncarch/*
tar -xzf /tmp/dist-update.tar.gz -C /var/www/syncarch/

# İzinleri ayarla
chown -R www-data:www-data /var/www/syncarch
chmod -R 755 /var/www/syncarch

# Nginx'i yeniden yükle
nginx -t
systemctl reload nginx

# Geçici dosyayı sil
rm /tmp/dist-update.tar.gz

echo "✅ Güncelleme tamamlandı!"
```

---

## Güncelleme Sonrası Kontrol

Site: http://31.97.78.86

### Yeni Özellikler:

1. ✅ İşveren Başına Gider Durumu - Düzeltilmiş hesaplamalar
2. ✅ Nakit/Havale Durum - Ödenen (Gider - Tahsilat)
3. ✅ Çek Durum - Ödenen ve Ödenmesi Gereken
4. ✅ Geliştirilmiş bakiye takibi

---

## Sorun Giderme

### Nginx Hatası Durumunda:

```bash
# Nginx durumunu kontrol et
systemctl status nginx

# Nginx configuration test
nginx -t

# Nginx'i yeniden başlat
systemctl restart nginx
```

### İzin Hatası Durumunda:

```bash
# Tüm dosyalar için doğru izinleri ver
chown -R www-data:www-data /var/www/syncarch
chmod -R 755 /var/www/syncarch
```

### Log Kontrol:

```bash
# Nginx error log
tail -f /var/log/nginx/error.log

# Nginx access log
tail -f /var/log/nginx/access.log
```

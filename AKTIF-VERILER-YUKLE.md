# Aktif Verileri VPS'e Yükleme

## Durum
✅ Production build aktif development database ile oluşturuldu
- Database: `rkrlzazhacfuduglkuej.supabase.co`
- Build dosyası: `dist-production.tar.gz`

## VPS'e Yükleme

### Yöntem 1: SCP ile (Önerilen)

**Windows'tan (PowerShell/CMD):**
```powershell
scp dist-production.tar.gz root@31.97.78.86:/tmp/
```

Şifre: `SyncArch2025!Secure`

**Sonra VPS'e SSH ile bağlanın:**
```bash
ssh root@31.97.78.86
```

**VPS'te şu komutları çalıştırın:**
```bash
cd /var/www/syncarch

# Yedek al
if [ -d "dist" ]; then
    mv dist dist.backup.$(date +%Y%m%d%H%M%S)
fi

# Yeni sürümü kur
mkdir -p dist
cd dist
tar -xzf /tmp/dist-production.tar.gz
rm /tmp/dist-production.tar.gz

# İzinleri ayarla
chown -R www-data:www-data /var/www/syncarch/dist
chmod -R 755 /var/www/syncarch/dist

# Nginx cache temizle
systemctl reload nginx

echo "✓ Tamamlandı!"
```

### Yöntem 2: WinSCP ile

1. WinSCP'yi açın
2. Bağlantı bilgileri:
   - Host: `31.97.78.86`
   - User: `root`
   - Password: `SyncArch2025!Secure`
3. `dist-production.tar.gz` dosyasını `/tmp/` klasörüne upload edin
4. SSH ile bağlanıp yukarıdaki komutları çalıştırın

## Kontrol

Yükleme tamamlandıktan sonra:
- https://syncarch.xyz adresini ziyaret edin
- Login olun ve verilerinizin geldiğini kontrol edin

## Özet

- ✅ `.env.production` güncellendi
- ✅ Production build oluşturuldu
- ⏳ VPS'e upload bekleniyor

Database artık her iki ortamda da aynı: `rkrlzazhacfuduglkuej.supabase.co`

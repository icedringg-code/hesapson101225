# VPS Güncelleme Talimatları - syncarch.online

## Otomatik Yükleme (Önerilen)

Terminal veya komut satırında aşağıdaki komutları çalıştırın:

### 1. VPS'e SSH ile bağlanın:
```bash
ssh root@31.97.78.86
```

### 2. Mevcut dosyaları yedekleyin (opsiyonel):
```bash
cp -r /var/www/html/public_html /var/www/html/public_html_backup_$(date +%Y%m%d_%H%M%S)
```

### 3. Eski dosyaları temizleyin:
```bash
rm -rf /var/www/html/public_html/*
```

### 4. SSH bağlantısından çıkın:
```bash
exit
```

### 5. Yeni dosyaları yükleyin (kendi bilgisayarınızdan):
```bash
cd /tmp/cc-agent/60856901/project
scp -r dist/* root@31.97.78.86:/var/www/html/public_html/
```

### 6. VPS'e tekrar bağlanın ve izinleri ayarlayın:
```bash
ssh root@31.97.78.86
chmod -R 755 /var/www/html/public_html
chmod 644 /var/www/html/public_html/.htaccess
exit
```

## Manuel Yükleme (FTP/SFTP)

### FileZilla veya benzeri bir FTP programı kullanarak:

1. **SFTP Bağlantısı:**
   - Host: `31.97.78.86`
   - Kullanıcı: `root`
   - Port: `22`
   - Protokol: `SFTP`

2. **Dosya Yükleme:**
   - Uzak dizin: `/var/www/html/public_html/`
   - Mevcut dosyaları silin
   - `dist` klasöründeki **TÜM** dosyaları yükleyin (index.html, assets/, .htaccess, vs.)

3. **İzinler:**
   - Tüm klasörler: `755`
   - Tüm dosyalar: `644`

## Güncellenen Özellikler

### ✅ Çek Ödeme Takibi
- Çek ile yapılan ödemelerin durumu izlenebiliyor (Ödendi/Ödenmedi)
- İş detay sayfasında çek ödemeleri bölümü eklendi
- Tek tıkla çek durumu değiştirilebiliyor

### ✅ Altın Bakiyesi Düzeltmesi
- Çek ödemeleri altın bakiyesine dahil edilmiyor
- Sadece nakit, havale/EFT ve kredi kartı ödemeleri altın bakiyesini etkiliyor

### ✅ Veritabanı Güncellemeleri
- `check_payment_status` alanı otomatik eklendi
- Yeni ödeme durumu takip sistemi aktif

## Doğrulama

Yükleme tamamlandıktan sonra:
1. https://syncarch.online adresini ziyaret edin
2. Tarayıcı önbelleğini temizleyin (Ctrl+Shift+R veya Cmd+Shift+R)
3. Giriş yapın ve çek ödemelerini test edin

## Sorun Giderme

### Site açılmıyor:
```bash
ssh root@31.97.78.86
ls -la /var/www/html/public_html/
# index.html ve assets klasörü olmalı
```

### İzin hatası:
```bash
ssh root@31.97.78.86
chmod -R 755 /var/www/html/public_html
chmod 644 /var/www/html/public_html/.htaccess
```

### Önbellek sorunu:
- Tarayıcıda Ctrl+Shift+R (Windows/Linux) veya Cmd+Shift+R (Mac)
- Gizli pencerede test edin

## İletişim

Herhangi bir sorun yaşarsanız lütfen bildirin.

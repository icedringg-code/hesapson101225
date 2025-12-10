# VPS'e Güncelleme Yükleme Talimatları

## ⚠️ ÖNEMLİ
VPS'e SSH ile bağlanmışken yükleme YAPAMAZSINIZ!
Kendi bilgisayarınızdan (lokal terminalden) yükleme yapmalısınız.

## DOĞRU YÖNTEM

### Adım 1: VPS'den ÇIKIN
```bash
exit
```

### Adım 2: Kendi bilgisayarınızda proje klasörüne gidin
```bash
# Windows (PowerShell veya CMD):
cd C:\path\to\syncarch-project

# Mac/Linux:
cd ~/path/to/syncarch-project
```

### Adım 3: dist klasörünü VPS'e yükleyin
```bash
scp -r dist/* root@31.97.78.86:/var/www/html/public_html/
```

### Adım 4: VPS'e bağlanıp izinleri ayarlayın
```bash
ssh root@31.97.78.86
chmod -R 755 /var/www/html/public_html
chmod 644 /var/www/html/public_html/.htaccess
exit
```

## VEYA: GitHub Üzerinden Deployment

Eğer GitHub kullanıyorsanız:

### 1. GitHub'a push yapın (kendi bilgisayarınızdan)
```bash
git add .
git commit -m "Çek ödeme takibi eklendi"
git push origin main
```

### 2. VPS'de repository'yi güncelleyin
```bash
ssh root@31.97.78.86
cd /path/to/git/repository
git pull origin main
npm install
npm run build
rm -rf /var/www/html/public_html/*
cp -r dist/* /var/www/html/public_html/
chmod -R 755 /var/www/html/public_html
chmod 644 /var/www/html/public_html/.htaccess
exit
```

## FileZilla ile Manuel Yükleme (En Kolay)

1. FileZilla'yı açın
2. Bağlantı bilgileri:
   - Host: `sftp://31.97.78.86`
   - Kullanıcı: `root`
   - Port: `22`
3. Sağ tarafta `/var/www/html/public_html/` dizinine gidin
4. Mevcut tüm dosyaları silin
5. Sol tarafta `dist` klasörüne gidin
6. Tüm dosyaları sağ tarafa sürükleyip bırakın
7. Yükleme tamamlandı!

## Doğrulama

https://syncarch.online adresini ziyaret edin ve yeni özellikleri test edin:
- İş detay sayfasında "Çek Ödemeleri" bölümü görünmeli
- Çek durumunu değiştirebilmelisiniz (Ödendi/Ödenmedi)

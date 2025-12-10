# SyncArch VPS Hızlı Kurulum

## ÖNEMLİ: İlk Önce Supabase Veritabanını Kurun!

### Adım 1: Supabase Veritabanı
1. Tarayıcıda açın: https://supabase.com/dashboard/project/ywkjahjpmcvbygmpbvrr/sql
2. `SETUP_DATABASE.sql` dosyasını açın
3. Tüm içeriği kopyalayıp SQL Editor'a yapıştırın
4. "Run" butonuna tıklayın
5. ✅ İşlem başarılı olmalı

---

## VPS Kurulum (3 Basit Komut)

### Windows PowerShell'de:

```powershell
# 1. VPS'e bağlan
ssh root@31.97.78.86
# Şifre: şifre00203549Rk..

# 2. Sunucu kurulumu (VPS'te çalıştır)
curl -sL https://raw.githubusercontent.com/syncarch/install/main/vps-setup.sh | bash

# VEYA Manuel kurulum:
bash -c "$(cat << 'ENDSCRIPT'
apt update && apt upgrade -y
apt install -y nginx certbot python3-certbot-nginx
mkdir -p /var/www/syncarch
chown -R www-data:www-data /var/www/syncarch

cat > /etc/nginx/sites-available/syncarch << 'EOF'
server {
    listen 80;
    server_name syncarch.xyz www.syncarch.xyz;
    root /var/www/syncarch;
    index index.html;

    location / {
        try_files \$uri \$uri/ /index.html;
    }
}
EOF

ln -sf /etc/nginx/sites-available/syncarch /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl restart nginx
echo 'Sunucu hazır!'
ENDSCRIPT
)"

# 3. Çıkış yap
exit
```

### Yerel Bilgisayarınızda:

```powershell
# Dosyaları yükle
scp -r dist/* root@31.97.78.86:/var/www/syncarch/

# İzinleri düzelt
ssh root@31.97.78.86 "chown -R www-data:www-data /var/www/syncarch"
```

### SSL Kurulumu (VPS'te):

```bash
ssh root@31.97.78.86
certbot --nginx -d syncarch.xyz -d www.syncarch.xyz
# Email gir, A ve 2 seç
```

---

## DNS Ayarları (Hostinger Panelinde)

Domain yönetim paneline girin ve ekleyin:

```
A Record: @ -> 31.97.78.86
A Record: www -> 31.97.78.86
```

DNS yayılması: 5-30 dakika

---

## Test

https://syncarch.xyz - Siteyi açın ve test edin!

---

## Sorun mu var?

### Nginx çalışmıyor:
```bash
systemctl status nginx
systemctl restart nginx
```

### Site açılmıyor:
```bash
tail -f /var/log/nginx/error.log
```

### Dosya izinleri:
```bash
chown -R www-data:www-data /var/www/syncarch
chmod -R 755 /var/www/syncarch
```

# Hızlı VPS Güncelleme - syncarch.online

## Şu anda VPS'desiniz, şu adımları izleyin:

### 1. syncarch-update.tar.gz dosyasını VPS'e yükleyin

**Seçenek A - wget ile (eğer dosya bir URL'de ise):**
```bash
cd /root
wget [DOSYA_URL]/syncarch-update.tar.gz
```

**Seçenek B - Başka bir terminal açıp lokal makinenizden yükleyin:**
Yeni bir terminal penceresi açın ve şunu çalıştırın:
```bash
scp /tmp/cc-agent/60856901/project/syncarch-update.tar.gz root@31.97.78.86:/root/
```

### 2. VPS'de arşivi açın ve dosyaları kopyalayın

VPS'deki terminalinizde:
```bash
# Arşivi geçici bir klasöre çıkart
cd /root
mkdir -p temp_deploy
tar -xzf syncarch-update.tar.gz -C temp_deploy/

# Eski dosyaları temizle (zaten yaptınız)
# rm -rf /var/www/html/public_html/*

# Yeni dosyaları kopyala
cp -r temp_deploy/* /var/www/html/public_html/

# İzinleri ayarla
chmod -R 755 /var/www/html/public_html
find /var/www/html/public_html -type f -exec chmod 644 {} \;
chmod 644 /var/www/html/public_html/.htaccess

# Temizlik
rm -rf temp_deploy
rm syncarch-update.tar.gz

# Kontrol
ls -la /var/www/html/public_html/
```

### 3. Test edin
```bash
curl -I https://syncarch.online
```

Site açılmalı ve yeni özellikler aktif olmalı!

---

## VEYA: En Kolay Yöntem - Python HTTP Server

Eğer yukarıdaki yöntem karmaşık geliyorsa:

### Local makinenizde (VPS'den çıktıktan sonra):
```bash
# exit ile VPS'den çıkın
exit

# Proje klasörüne gidin
cd /tmp/cc-agent/60856901/project/dist

# Basit HTTP server başlatın
python3 -m http.server 8080
```

### VPS'de:
```bash
cd /root
wget http://[LOCAL_IP]:8080/index.html
# Tüm dosyaları indirin
```

---

## EN KOLAY: FileZilla Kullanın

1. **FileZilla'yı açın** (SFTP client)
2. **Bağlan:**
   - Host: `sftp://31.97.78.86`
   - Kullanıcı: `root`
   - Şifre: [VPS şifreniz]
   - Port: `22`

3. **Dosyaları Yükle:**
   - Sağ tarafta: `/var/www/html/public_html/` (zaten temizlenmiş)
   - Sol tarafta: Lokal `dist` klasörünü bulun
   - Tüm içeriği sürükle-bırak

Çok daha kolay ve görsel!

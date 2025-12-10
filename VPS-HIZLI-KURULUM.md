# VPS Hızlı Kurulum Talimatları - SyncArch İş Takip

## VPS Bilgileri
- **IP:** 31.97.78.86
- **Domain:** syncarch.xyz
- **Kullanıcı:** root
- **İşletim Sistemi:** Ubuntu 24.04

## Adım 1: Dosyaları Hazırla

Yerel bilgisayarınızda bu komutları çalıştırın (proje klasöründe):

```bash
# Deployment paketi oluştur
tar -czf syncarch-vps-deploy.tar.gz \
  dist/ \
  server/ \
  package.json \
  package-lock.json \
  .env.production \
  vps-full-setup.sh \
  --exclude=node_modules

# Dosya boyutunu kontrol et
ls -lh syncarch-vps-deploy.tar.gz
```

## Adım 2: VPS'e Bağlan ve Dosyaları Yükle

### Option A: SCP ile Yükleme (Önerilen)

Yerel bilgisayarınızdan:

```bash
# Dosyayı VPS'e yükle
scp syncarch-vps-deploy.tar.gz root@31.97.78.86:/root/

# VPS'e bağlan
ssh root@31.97.78.86
```

### Option B: Direct SSH ile Yükleme

```bash
# VPS'e bağlan
ssh root@31.97.78.86
```

## Adım 3: VPS'de Kurulum

VPS'de aşağıdaki komutları çalıştırın:

```bash
# Root dizinine git
cd /root

# Eğer dosyayı SCP ile yüklediyseniz
# (yoksa dosyayı başka bir yöntemle /root dizinine yükleyin)

# Proje dizinini oluştur
mkdir -p /var/www/syncarch

# Dosyaları çıkar
tar -xzf syncarch-vps-deploy.tar.gz -C /var/www/syncarch/

# Kurulum scriptine yürütme izni ver
chmod +x /var/www/syncarch/vps-full-setup.sh

# Otomatik kurulumu başlat
cd /var/www/syncarch
./vps-full-setup.sh
```

## Adım 4: Kurulum Sonrası Kontroller

```bash
# Backend durumunu kontrol et
pm2 status
pm2 logs voice-assistant-api

# Nginx durumunu kontrol et
systemctl status nginx

# Port kontrolü
netstat -tlnp | grep 3001

# .env dosyasını kontrol et
cat /var/www/syncarch/.env
```

## Adım 5: Test Et

Tarayıcınızda şu adresleri açın:
- https://syncarch.xyz
- http://31.97.78.86 (HTTP otomatik HTTPS'e yönlendirilecek)

## Sorun Giderme

### Backend çalışmıyor

```bash
cd /var/www/syncarch
pm2 logs voice-assistant-api --lines 50
pm2 restart voice-assistant-api
```

### Nginx hatası

```bash
nginx -t
tail -f /var/log/nginx/error.log
systemctl restart nginx
```

### SSL sertifikası kurulmadı

```bash
certbot --nginx -d syncarch.xyz -d www.syncarch.xyz --email admin@syncarch.xyz
```

### Port 3001 açık değil

```bash
ufw status
ufw allow 3001
systemctl restart ufw
```

### Proje güncelleme

```bash
cd /var/www/syncarch

# Yeni dosyaları yükle ve çıkar (aynı şekilde)
# Sonra:

npm install
npm run build
pm2 restart voice-assistant-api
```

## Hızlı Komutlar

```bash
# Her şeyi yeniden başlat
pm2 restart voice-assistant-api
systemctl restart nginx

# Logları izle
pm2 logs voice-assistant-api --lines 100

# Disk kullanımı
df -h

# Sistem kaynakları
htop

# PM2 süreç listesi
pm2 list
```

## Güvenlik Kontrolleri

```bash
# Firewall durumu
ufw status verbose

# Açık portlar
netstat -tlnp

# .env dosyası izinleri (sadece root okuyabilmeli)
ls -la /var/www/syncarch/.env

# Düzelt (gerekirse)
chmod 600 /var/www/syncarch/.env
```

## Manuel SSL Kurulumu (gerekirse)

```bash
# Certbot ile SSL kur
certbot --nginx -d syncarch.xyz -d www.syncarch.xyz --email admin@syncarch.xyz --agree-tos --redirect

# SSL otomatik yenileme test
certbot renew --dry-run
```

## Önemli Notlar

1. **OpenAI API Key** zaten .env.production dosyasında mevcut
2. **Domain DNS** ayarlarının 31.97.78.86 IP'sine yönlendirildiğinden emin olun
3. **SSL sertifikası** otomatik olarak 3 ayda bir yenilenir
4. **PM2** sistem yeniden başladığında otomatik başlatılır
5. **Nginx** tüm HTTP trafiği HTTPS'e yönlendirir

## İletişim

Sorun yaşarsanız:
```bash
pm2 logs voice-assistant-api
tail -f /var/log/nginx/error.log
```

komutlarının çıktılarını paylaşın.

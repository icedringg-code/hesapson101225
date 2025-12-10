# VPS Kurulum Özeti - SyncArch İş Takip

## Hazırlanan Dosyalar

Tüm kurulum dosyaları hazır durumda:

✅ `syncarch-vps-deploy.tar.gz` - Deployment paketi (84KB)
✅ `.env.production` - Production ortam değişkenleri (OpenAI key dahil)
✅ `vps-full-setup.sh` - Otomatik kurulum scripti
✅ `upload-to-vps.sh` - Otomatik yükleme scripti (Linux/Mac)
✅ `upload-to-vps.bat` - Otomatik yükleme scripti (Windows)

## VPS Bilgileri

- **IP:** 31.97.78.86
- **Domain:** syncarch.xyz
- **Kullanıcı:** root
- **İşletim Sistemi:** Ubuntu 24.04
- **OpenAI API Key:** Hazır ve yapılandırılmış

## En Hızlı Kurulum (3 Adım)

### Linux/Mac Kullanıcıları İçin:

```bash
# 1. Script'e yürütme izni ver
chmod +x upload-to-vps.sh

# 2. Tek komutla yükle ve kur
./upload-to-vps.sh

# 3. Tarayıcıda aç
# https://syncarch.xyz
```

### Windows Kullanıcıları İçin:

```cmd
REM 1. Git Bash veya WSL ile çalıştır
upload-to-vps.bat

REM 2. Tarayıcıda aç
REM https://syncarch.xyz
```

## Manuel Kurulum (İsterseniz)

### Adım 1: Dosyayı VPS'e Yükle

```bash
scp syncarch-vps-deploy.tar.gz root@31.97.78.86:/root/
```

### Adım 2: VPS'e Bağlan

```bash
ssh root@31.97.78.86
```

### Adım 3: Kurulumu Başlat

```bash
mkdir -p /var/www/syncarch
tar -xzf /root/syncarch-vps-deploy.tar.gz -C /var/www/syncarch/
chmod +x /var/www/syncarch/vps-full-setup.sh
cd /var/www/syncarch
./vps-full-setup.sh
```

## Kurulum Ne Yapar?

Otomatik kurulum scripti şunları yapar:

1. ✅ Sistem paketlerini günceller
2. ✅ Node.js ve npm yükler (gerekirse)
3. ✅ PM2 process manager yükler
4. ✅ NPM paketlerini yükler
5. ✅ Production .env dosyasını yapılandırır
6. ✅ Frontend'i build eder
7. ✅ Backend'i PM2 ile başlatır
8. ✅ Nginx'i yapılandırır
9. ✅ SSL sertifikası kurar (Let's Encrypt)
10. ✅ Firewall ayarlarını yapar

## Kurulum Sonrası

### Site Testi

Tarayıcınızda şu adresleri açın:
- https://syncarch.xyz (HTTPS - Güvenli)
- http://syncarch.xyz (HTTP - otomatik HTTPS'e yönlendirilir)
- http://31.97.78.86 (IP üzerinden)

### Sesli Asistan Testi

1. Siteye giriş yapın
2. Sağ alttaki mikrofon butonuna tıklayın
3. Tarayıcı mikrofon izni isteyecek - izin verin
4. Bir komut söyleyin, örneğin:
   - "ABC firmasından 5000 lira tahsilat yap"
   - "XYZ firmasına nakit olarak 3000 lira ödeme yap"
   - "Yeni bir firma ekle ismi DEF firması"
5. Kayıt bittiğinde sistem komutu işleyecek

### Kontrol Komutları

VPS'de kontrol için:

```bash
# Backend durumu
pm2 status
pm2 logs voice-assistant-api

# Nginx durumu
systemctl status nginx

# Port kontrolü
netstat -tlnp | grep 3001

# SSL sertifikası
certbot certificates
```

## Yapılandırma Detayları

### Backend (Express Server)
- **Port:** 3001
- **Endpoint:** https://syncarch.xyz/api/voice-assistant
- **Özellikler:**
  - OpenAI Whisper (Ses tanıma)
  - OpenAI GPT-4 mini (Komut analizi)
  - Türkçe dil desteği
  - Tahsilat/Ödeme ekleme
  - Firma ve iş ekleme

### Frontend (React + Vite)
- **URL:** https://syncarch.xyz
- **Build:** Production optimized
- **PWA:** Progressive Web App desteği
- **Responsive:** Mobil uyumlu

### Database
- **Supabase:** Zaten yapılandırılmış
- **RLS:** Row Level Security aktif
- **Auth:** Email/Password

## Güncelleme Nasıl Yapılır?

Gelecekte kod değişikliği olduğunda:

```bash
# 1. Yeni deployment paketi oluştur
tar -czf syncarch-vps-deploy.tar.gz dist/ server/ package.json package-lock.json .env.production

# 2. VPS'e yükle
scp syncarch-vps-deploy.tar.gz root@31.97.78.86:/root/

# 3. VPS'de çıkar ve güncelle
ssh root@31.97.78.86
cd /var/www/syncarch
tar -xzf /root/syncarch-vps-deploy.tar.gz
npm install
npm run build
pm2 restart voice-assistant-api
```

## Sorun Giderme

### Backend çalışmıyor

```bash
pm2 logs voice-assistant-api --lines 50
pm2 restart voice-assistant-api
```

### Nginx hatası

```bash
nginx -t
systemctl restart nginx
tail -f /var/log/nginx/error.log
```

### SSL sorunu

```bash
certbot renew --dry-run
certbot --nginx -d syncarch.xyz -d www.syncarch.xyz
```

### OpenAI API hatası

```bash
# .env dosyasını kontrol et
cat /var/www/syncarch/.env | grep OPENAI

# Backend'i yeniden başlat
pm2 restart voice-assistant-api
```

### Port 3001 bağlantı sorunu

```bash
# Port dinleniyor mu?
netstat -tlnp | grep 3001

# Firewall ayarları
ufw status
ufw allow 3001
```

## Güvenlik

Kurulum şunları içerir:

- ✅ HTTPS/SSL sertifikası (Let's Encrypt)
- ✅ Automatic SSL yenileme (90 günde bir)
- ✅ .env dosyası sadece root tarafından okunabilir (chmod 600)
- ✅ Firewall yapılandırması (UFW)
- ✅ Nginx security headers
- ✅ PM2 process monitoring
- ✅ Supabase RLS (Row Level Security)

## Sistem Gereksinimleri

Minimum:
- 1 CPU
- 1GB RAM
- 10GB Disk

Mevcut VPS:
- ✅ Ubuntu 24.04
- ✅ n8n pre-installed
- ✅ 128 gün uptime (kararlı)

## İletişim ve Destek

Sorun yaşarsanız:

```bash
# Tüm logları topla
pm2 logs voice-assistant-api --lines 100 > backend-logs.txt
tail -n 100 /var/log/nginx/error.log > nginx-logs.txt
systemctl status nginx > nginx-status.txt
```

Bu log dosyalarını paylaşın.

## Önemli Notlar

1. **DNS Ayarları:** syncarch.xyz domain'in A kaydı 31.97.78.86 IP'sine yönlendirilmiş olmalı
2. **OpenAI Kredi:** API key'inizde yeterli kredi olduğundan emin olun
3. **Otomatik Yedekleme:** Düzenli olarak `/var/www/syncarch` dizinini yedekleyin
4. **SSL Yenileme:** Certbot otomatik yeniler, ama test edin: `certbot renew --dry-run`
5. **PM2 Monitoring:** `pm2 monit` ile real-time izleme yapabilirsiniz

## Tebrikler!

Sesli asistan özelliği artık VPS'nizde çalışıyor. Kullanıcılarınız şimdi:
- Türkçe sesli komutlarla tahsilat/ödeme ekleyebilir
- Yeni firma ve iş ekleyebilir
- Tüm işlemleri hızlıca sesli asistan ile yapabilir

**Site:** https://syncarch.xyz
**Backend API:** https://syncarch.xyz/api/voice-assistant

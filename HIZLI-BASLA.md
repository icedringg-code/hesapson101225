# 🚀 SyncArch VPS - Hızlı Deployment

## ⚡ 3 ADIMDA DEPLOYMENT

### 1️⃣ Windows Kullanıcıları

```cmd
DEPLOY-SYNCARCH.bat
```

Çift tıklayın, talimatları takip edin.

---

### 2️⃣ Linux/Mac Kullanıcıları

```bash
chmod +x deploy-syncarch-latest.sh
./deploy-syncarch-latest.sh
```

Şifre istendiğinde: `00203549Rk..`

---

### 3️⃣ Manuel Deployment (Tüm Platformlar)

#### A) Dosyayı Yükle

```bash
scp syncarch-vps-latest.tar.gz root@31.97.78.86:/tmp/
```

**Şifre**: `00203549Rk..`

#### B) VPS'e Bağlan

```bash
ssh root@31.97.78.86
```

**Şifre**: `00203549Rk..`

#### C) Deployment Komutları

VPS'de aşağıdaki komutları sırayla çalıştırın:

```bash
# Dizine git
cd /var/www/syncarch

# Yedek al
BACKUP_DIR="backup-$(date +%Y%m%d-%H%M%S)"
mkdir -p $BACKUP_DIR
[ -d "dist" ] && cp -r dist $BACKUP_DIR/
[ -d "server" ] && cp -r server $BACKUP_DIR/
echo "✓ Yedek: $BACKUP_DIR"

# Yeni versiyonu kur
tar -xzf /tmp/syncarch-vps-latest.tar.gz -C /var/www/syncarch
rm -f /tmp/syncarch-vps-latest.tar.gz
echo "✓ Dosyalar çıkarıldı"

# Node modülleri
npm install --production
echo "✓ Bağımlılıklar kuruldu"

# Servisi yeniden başlat
pm2 restart syncarch || pm2 start server/index.js --name syncarch
pm2 save
echo "✓ Servis başlatıldı"

# Nginx'i yenile
nginx -t && systemctl reload nginx
echo "✓ Nginx güncellendi"

# Durumu kontrol et
pm2 list
```

---

## ✅ DEPLOYMENT KONTROL

### Test Komutları

```bash
# PM2 durumu
pm2 list
pm2 logs syncarch --lines 50

# Web testi
curl -I https://syncarch.xyz

# API testi
curl https://syncarch.xyz/api/statistics
```

### Tarayıcı Testleri

- 🌐 Ana Site: https://syncarch.xyz
- 🔌 API: https://syncarch.xyz/api/statistics
- 📊 Health Check: http://31.97.78.86:3000/api/health

---

## 🎯 BEKLENEN SONUÇLAR

### ✓ PM2 Output
```
┌────┬──────────┬─────────┬──────┐
│ id │ name     │ status  │ cpu  │
├────┼──────────┼─────────┼──────┤
│ 0  │ syncarch │ online  │ 0%   │
└────┴──────────┴─────────┴──────┘
```

### ✓ Web Erişim
```
HTTP/2 200
server: nginx
content-type: text/html
```

### ✓ API Response
```json
{
  "totalRevenue": 0,
  "totalExpenses": 0,
  "activeJobs": 0,
  ...
}
```

---

## ⚠️ SORUN VARSA

### PM2 Çalışmıyor

```bash
pm2 delete syncarch
pm2 start server/index.js --name syncarch
pm2 save
```

### Nginx Hata Veriyor

```bash
nginx -t
systemctl restart nginx
```

### Port Kullanımda

```bash
lsof -i :3000
pm2 restart syncarch
```

---

## 📚 DETAYLI DOKÜMANTASYON

Daha fazla bilgi için: **SYNCARCH-VPS-DEPLOYMENT.md**

---

## 🎉 BAŞARILI!

Deployment tamamlandıktan sonra:

✓ https://syncarch.xyz adresinde uygulamanız yayında
✓ Türk piyasası API'leri aktif
✓ Gram altın ve döviz kurları güncel
✓ SSL sertifikası aktif
✓ PWA özellikleri çalışıyor

**Son Güncelleme**: 2025-12-06
**Versiyon**: 1.2.0

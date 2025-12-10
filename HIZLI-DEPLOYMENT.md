# 🚀 SyncArch VPS Deployment - HIZLI KURULUM

## ✅ Hazırlık Tamamlandı

- **Build:** Başarılı (v1.2.0)
- **Paket:** syncarch-vps-latest.tar.gz (498 KB)
- **VPS:** 31.97.78.86 (syncarch.xyz)

---

## 📋 3 BASIT ADIM

### 1️⃣ Paketi VPS'e Yükle

Terminalinizde çalıştırın:

```bash
scp syncarch-vps-latest.tar.gz root@31.97.78.86:/tmp/
```

**Şifre:** `00203549Rk..`

---

### 2️⃣ VPS'e Bağlan

```bash
ssh root@31.97.78.86
```

**Şifre:** `00203549Rk..`

---

### 3️⃣ Deployment Komutlarını Çalıştır

VPS'e bağlandıktan sonra aşağıdaki komutları sırayla çalıştırın:

```bash
cd /var/www/syncarch || mkdir -p /var/www/syncarch && cd /var/www/syncarch

BACKUP=backup-$(date +%Y%m%d-%H%M%S) && mkdir -p "$BACKUP" && [ -d dist ] && cp -r dist/ "$BACKUP/" && echo "✓ Yedek: $BACKUP"

tar -xzf /tmp/syncarch-vps-latest.tar.gz -C /var/www/syncarch && rm -f /tmp/syncarch-vps-latest.tar.gz && echo "✓ Dosyalar çıkarıldı"

npm install --production --silent && echo "✓ Bağımlılıklar kuruldu"

pm2 restart syncarch || pm2 start server/index.js --name syncarch && pm2 save && echo "✓ PM2 güncellendi"

nginx -t && systemctl reload nginx && echo "✓ Nginx yenilendi"

echo "" && echo "✅ DEPLOYMENT TAMAMLANDI!" && pm2 list
```

---

## ✨ Deployment Sonrası

Uygulamanız yayında:
- **🌐 https://syncarch.xyz**
- **🌐 http://31.97.78.86**

### Yeni Özellikler (v1.2.0):
- Türk piyasası API entegrasyonu
- Gerçek zamanlı altın fiyatları: **5,746.26 ₺**
- Güncel döviz kurları: **USD: 42.54 ₺, EUR: 49.57 ₺**
- Otomatik fallback mekanizması

### Test:
```bash
curl -I https://syncarch.xyz
curl https://syncarch.xyz/api/statistics
```

---

## 🔧 Faydalı Komutlar

```bash
# Logları görüntüle
pm2 logs syncarch

# Servisi yeniden başlat
pm2 restart syncarch

# Durum kontrol
pm2 list

# SSH'tan çık
exit
```

---

**Süre:** 2-3 dakika  
**Versiyon:** 1.2.0  
**Tarih:** 2025-12-06

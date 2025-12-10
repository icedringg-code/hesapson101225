# 🚀 SyncArch VPS - ŞİMDİ ÇALIŞTIR!

## ✅ HER ŞEY HAZIR!

Tüm dosyalar hazırlandı ve deployment için bekliyor:

| Dosya | Durum |
|-------|-------|
| ✅ `syncarch-vps-latest.tar.gz` | Build tamamlandı (499 KB) |
| ✅ `BASIT-DEPLOYMENT.sh` | Otomatik deployment script |
| ✅ `DEPLOYMENT-OZET.md` | Detaylı dokümantasyon |
| ✅ `HIZLI-BASLA.md` | Hızlı başlangıç kılavuzu |

---

## ⚡ HEMEN BAŞLA (TEK KOMUT)

Terminal'de şu komutu çalıştırın:

```bash
./BASIT-DEPLOYMENT.sh
```

### Ne Olacak:

1. ✅ Script VPS'e bağlanacak
2. ✅ Paketi yükleyecek
3. ✅ Mevcut versiyonu yedekleyecek
4. ✅ Yeni versiyonu kuracak
5. ✅ PM2 ve Nginx'i güncelleyecek
6. ✅ SSL kontrol edecek

### Şifre İstediğinde:

**2 kez şifre istenecek:**
- 1. Dosya yükleme için
- 2. SSH bağlantısı için

**Şifre:** `00203549Rk..`

---

## 📋 ALTERNATIF: MANUEL DEPLOYMENT

Script çalışmazsa manuel deployment:

### Adım 1: Dosyayı Yükle

```bash
scp syncarch-vps-latest.tar.gz root@31.97.78.86:/tmp/
```

**Şifre:** `00203549Rk..`

### Adım 2: VPS'e Bağlan

```bash
ssh root@31.97.78.86
```

**Şifre:** `00203549Rk..`

### Adım 3: VPS'de Bu Komutları Çalıştır

Tüm komutları kopyalayıp VPS'e yapıştırın:

```bash
# Dizine git
cd /var/www/syncarch

# Yedek al
BACKUP_DIR="backup-$(date +%Y%m%d-%H%M%S)"
mkdir -p $BACKUP_DIR
[ -d "dist" ] && cp -r dist $BACKUP_DIR/
echo "✓ Yedek: $BACKUP_DIR"

# Yeni versiyonu kur
tar -xzf /tmp/syncarch-vps-latest.tar.gz -C /var/www/syncarch
rm -f /tmp/syncarch-vps-latest.tar.gz
echo "✓ Dosyalar çıkarıldı"

# Bağımlılıkları kur
npm install --production
echo "✓ Bağımlılıklar kuruldu"

# PM2'yi güncelle
pm2 restart syncarch || pm2 start server/index.js --name syncarch
pm2 save
echo "✓ PM2 güncellendi"

# Nginx'i yenile
nginx -t && systemctl reload nginx
echo "✓ Nginx yenilendi"

# Durumu kontrol et
pm2 list
pm2 logs syncarch --lines 30
```

---

## 🧪 DEPLOYMENT SONRASI TEST

### 1. Servis Kontrolü (VPS'de)

```bash
pm2 list
pm2 logs syncarch --lines 50
```

Beklenen:
```
┌────┬──────────┬─────────┬──────┐
│ id │ name     │ status  │ cpu  │
├────┼──────────┼─────────┼──────┤
│ 0  │ syncarch │ online  │ 0%   │
└────┴──────────┴─────────┴──────┘
```

### 2. Web Testi (Bilgisayarınızdan)

```bash
curl -I https://syncarch.xyz
```

Beklenen:
```
HTTP/2 200
server: nginx
```

### 3. API Testi

```bash
curl https://syncarch.xyz/api/statistics
```

Beklenen: JSON response

### 4. Tarayıcı Testi

Tarayıcıda açın:
- https://syncarch.xyz
- https://syncarch.xyz/api/statistics

---

## ✨ YENİ ÖZELLİKLER (v1.2.0)

Deployment sonrası aktif olacak:

### Türk Piyasası API'leri
- ✅ GenelPara API (gram altın + döviz)
- ✅ TruncGil API (yedek altın)
- ✅ USD/TRY: 42.5357 ₺
- ✅ EUR/TRY: 49.5732 ₺
- ✅ Gram Altın: 5,746.26 ₺

### İyileştirmeler
- ✅ Otomatik fallback
- ✅ Hata toleransı
- ✅ Console log iyileştirmeleri
- ✅ API validation

---

## ⚠️ SORUN GİDERME

### PM2 Çalışmıyor

```bash
ssh root@31.97.78.86
pm2 delete syncarch
pm2 start server/index.js --name syncarch
pm2 save
pm2 list
```

### Nginx Hata Veriyor

```bash
ssh root@31.97.78.86
nginx -t
systemctl restart nginx
```

### Port Kullanımda

```bash
ssh root@31.97.78.86
lsof -i :3000
pm2 restart syncarch
```

### Site Açılmıyor

1. PM2 kontrolü: `pm2 list`
2. Nginx kontrolü: `systemctl status nginx`
3. Log kontrolü: `pm2 logs syncarch`
4. Port kontrolü: `netstat -tulpn | grep 3000`

---

## 🎯 BAŞARILI DEPLOYMENT

Deployment başarılı olduğunda göreceğiniz:

```
✅ DEPLOYMENT TAMAMLANDI!

📊 Servis Durumu:
┌────┬──────────┬─────────┬──────┐
│ id │ name     │ status  │ cpu  │
├────┼──────────┼─────────┼──────┤
│ 0  │ syncarch │ online  │ 0%   │
└────┴──────────┴─────────┴──────┘

🌐 Uygulama Adresleri:
   • https://syncarch.xyz
   • http://31.97.78.86
```

---

## 📞 YARDIM

Sorun yaşarsanız:

1. **Logları kontrol edin:**
   ```bash
   ssh root@31.97.78.86 'pm2 logs syncarch --lines 100'
   ```

2. **Dokümantasyona bakın:**
   - `DEPLOYMENT-OZET.md` - Tam özet
   - `HIZLI-BASLA.md` - Hızlı başlangıç
   - `SYNCARCH-VPS-DEPLOYMENT.md` - Detaylı rehber

3. **Servisi yeniden başlatın:**
   ```bash
   ssh root@31.97.78.86 'pm2 restart syncarch'
   ```

---

## 🎉 ŞİMDİ BAŞLA!

```bash
./BASIT-DEPLOYMENT.sh
```

**Şifre (2 kez):** `00203549Rk..`

**Beklenen Süre:** 2-3 dakika

**Sonuç:** https://syncarch.xyz yayında! 🚀

---

**Son Güncelleme:** 2025-12-06
**Versiyon:** 1.2.0 (Türk Piyasası Entegrasyonu)
**Durum:** ✅ Deployment için hazır

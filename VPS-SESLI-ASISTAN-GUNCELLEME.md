# VPS'e Sesli Asistan Güncellemesi

Güncellenmiş sesli asistan kodu VPS'e deploy edilmelidir.

## Otomatik Yöntem (Önerilen)

### Windows'ta:
```cmd
deploy-voice-fix.bat
```

### Linux/Mac veya Git Bash'te:
```bash
bash deploy-voice-fix.sh
```

Script otomatik olarak:
- Build dosyalarını paketler
- VPS'e yükler
- Nginx'i yeniden başlatır
- Cache'i temizler

---

## Manuel Yöntem

Eğer otomatik script çalışmazsa, manuel olarak şu adımları izleyin:

### 1. VPS'e Bağlanın
```bash
ssh root@31.97.78.86
```

### 2. Mevcut Sürümü Yedekleyin
```bash
cd /var/www/syncarch
cp -r html html.backup.$(date +%Y%m%d_%H%M%S)
```

### 3. Yerel Bilgisayarınızda (Yeni Terminal)

Projenin bulunduğu klasörde:

```bash
# Build dosyalarını paketleyin
tar -czf dist-update.tar.gz dist/

# VPS'e yükleyin
scp dist-update.tar.gz root@31.97.78.86:/tmp/
```

### 4. VPS'te Devam Edin

```bash
# Temp klasörüne gidin
cd /tmp

# Paketi açın
tar -xzf dist-update.tar.gz

# Eski dosyaları temizleyin
rm -rf /var/www/syncarch/html/*

# Yeni dosyaları kopyalayın
cp -r dist/* /var/www/syncarch/html/

# İzinleri düzeltin
chown -R www-data:www-data /var/www/syncarch/html
chmod -R 755 /var/www/syncarch/html

# Nginx'i yeniden başlatın
systemctl restart nginx

# Temizlik
rm -f /tmp/dist-update.tar.gz
rm -rf /tmp/dist
```

---

## Test Etme

1. **https://syncarch.xyz** adresine gidin

2. **Cache'i temizleyin**: CTRL+F5 (Windows) veya CMD+Shift+R (Mac)

3. **Tarayıcı konsolunu açın**: F12 tuşuna basın

4. **Mikrofon butonuna** tıklayın

5. **"İş ekle"** deyin

6. **Console'da şunları göreceksiniz**:
   ```
   Voice Assistant Result: {...}
   Transcription: "iş ekle"
   Command: {action: "add_job", ...}
   ```

7. **Eğer fallback kullanıldıysa**:
   ```
   Fallback activated: add_job
   ```

---

## Sorun Giderme

### Problem: "dist klasörü bulunamadı"
**Çözüm**:
```bash
npm run build
```

### Problem: SSH bağlantı hatası
**Çözüm**:
- VPS IP adresini kontrol edin: `31.97.78.86`
- SSH port'unun açık olduğundan emin olun
- Firewall ayarlarını kontrol edin

### Problem: Permission denied
**Çözüm**:
```bash
# VPS'te
sudo chown -R $USER:$USER /var/www/syncarch
```

### Problem: Nginx başlamıyor
**Çözüm**:
```bash
# Nginx loglarını kontrol edin
tail -f /var/log/nginx/error.log

# Nginx config'i test edin
nginx -t

# Nginx'i restart edin
systemctl restart nginx
```

### Problem: Sesli asistan hala çalışmıyor
**Çözüm**:
1. Tarayıcı console'unda hata var mı kontrol edin
2. Supabase edge function loglarını kontrol edin
3. OPENAI_API_KEY'in doğru olduğundan emin olun
4. Mikrofon izinlerini kontrol edin

---

## Yapılan Değişiklikler

### Frontend (VoiceAssistant.tsx)
- Console log'ları eklendi
- Transcription ve command detayları görünür

### Backend (Edge Function)
- Fallback mekanizması eklendi
- "iş ekle" komutunu her durumda yakalar
- Türkçe karakter sorunları düzeltildi
- JSON mode aktif

### Sonuç
Artık sesli asistan:
- GPT yanlış yorumlasa bile çalışır
- Fallback ile komutları yakalar
- Detaylı log'larla debug edilebilir

# SSL Kurulum Talimatları - syncarch.online

## VPS'de SSL Sertifikası Kurulumu (Let's Encrypt - Ücretsiz)

### 1. VPS'e SSH ile Bağlan
```bash
ssh root@31.97.78.86
```

### 2. Certbot Kurulumu (Ubuntu/Debian)
```bash
# Sistemi güncelle
sudo apt update && sudo apt upgrade -y

# Certbot ve Nginx plugini kur
sudo apt install certbot python3-certbot-nginx -y
```

### 3. SSL Sertifikası Al
```bash
# Otomatik Nginx konfigürasyonu ile
sudo certbot --nginx -d syncarch.online -d www.syncarch.online

# Veya sadece sertifika al (manuel kurulum için)
sudo certbot certonly --nginx -d syncarch.online -d www.syncarch.online
```

**Sorulan sorulara cevaplar:**
- Email: Geçerli email adresiniz (sertifika yenileme bildirimleri için)
- Terms of Service: A (Kabul et)
- Share email: N (İsteğe bağlı)
- Redirect: 2 (HTTPS'e yönlendir)

### 4. Nginx Konfigürasyonunu Güncelle

Proje dizinindeki `nginx-ssl.conf` dosyasını VPS'e kopyala:

```bash
# Yerel bilgisayardan
scp nginx-ssl.conf root@31.97.78.86:/etc/nginx/sites-available/syncarch.online

# VPS'de
sudo ln -s /etc/nginx/sites-available/syncarch.online /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default  # Varsayılan siteyi kaldır (opsiyonel)

# Nginx konfigürasyonunu test et
sudo nginx -t

# Nginx'i yeniden yükle
sudo systemctl reload nginx
```

### 5. Otomatik Yenileme Kontrolü

Let's Encrypt sertifikaları 90 günde bir yenilenmeli. Certbot bunu otomatik yapar:

```bash
# Test komutu (gerçekte yenilemez)
sudo certbot renew --dry-run

# Otomatik yenileme cron job'ı (zaten kurulu)
sudo systemctl status certbot.timer
```

### 6. Firewall Ayarları

HTTPS için 443 portunu aç:

```bash
# UFW kullanıyorsan
sudo ufw allow 443/tcp
sudo ufw allow 80/tcp
sudo ufw reload

# iptables kullanıyorsan
sudo iptables -A INPUT -p tcp --dport 443 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 80 -j ACCEPT
sudo iptables-save
```

## Apache Kullanıyorsanız

### 1. Certbot Kurulumu
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install certbot python3-certbot-apache -y
```

### 2. SSL Sertifikası Al
```bash
sudo certbot --apache -d syncarch.online -d www.syncarch.online
```

### 3. Apache'yi Yeniden Başlat
```bash
sudo systemctl reload apache2
```

### 4. .htaccess Kontrolü

Proje `public_html/.htaccess` dosyası zaten HTTPS yönlendirmesi içeriyor.

## Test ve Doğrulama

### 1. HTTPS Çalışıyor mu?
```bash
curl -I https://syncarch.online
```

Beklenen: `200 OK` ve `Strict-Transport-Security` header

### 2. HTTP → HTTPS Yönlendirmesi
```bash
curl -I http://syncarch.online
```

Beklenen: `301 Moved Permanently` ve `Location: https://...`

### 3. SSL Sertifika Geçerliliği
https://www.ssllabs.com/ssltest/analyze.html?d=syncarch.online

Beklenen: **A** veya **A+** rating

### 4. PWA Testi
- Mobil cihazda `https://syncarch.online` aç
- "Ana ekrana ekle" seçeneği görünmeli
- Tarayıcı adres çubuğunda **kilit simgesi** görünmeli

## Deployment Script Kullanımı

SSL kurulduktan sonra:

### Linux/Mac:
```bash
./deploy-vps.sh
```

### Windows:
```batch
deploy-vps.bat
```

## Supabase URL Güncelleme

SSL kurulduktan sonra Supabase'de URL'leri güncelle:

1. https://supabase.com/dashboard
2. Projenize girin
3. **Settings** → **Authentication**
4. **URL Configuration:**
   - Site URL: `https://syncarch.online`
   - Redirect URLs:
     - `https://syncarch.online`
     - `https://syncarch.online/**`
     - `https://www.syncarch.online`
     - `https://www.syncarch.online/**`
5. **Save** butonuna tıklayın

## Sorun Giderme

### Sorun 1: Certbot "Could not bind to port 80"
**Çözüm:** Nginx veya Apache durdur:
```bash
sudo systemctl stop nginx
sudo certbot certonly --standalone -d syncarch.online -d www.syncarch.online
sudo systemctl start nginx
```

### Sorun 2: SSL çalışmıyor
**Çözüm:** Nginx error log kontrol et:
```bash
sudo tail -f /var/log/nginx/error.log
```

### Sorun 3: Mixed Content Warning
**Çözüm:** Tüm kaynaklar HTTPS ile yüklenmeli. `.env` dosyasında SUPABASE URL'lerini kontrol et.

### Sorun 4: Sertifika yenileme başarısız
**Çözüm:** Port 80 açık olmalı:
```bash
sudo netstat -tulpn | grep :80
sudo ufw status
```

## Güvenlik Önerileri

- ✅ Always use HTTPS
- ✅ Otomatik HTTP → HTTPS yönlendirme
- ✅ HSTS (HTTP Strict Transport Security) aktif
- ✅ Secure headers (X-Frame-Options, X-XSS-Protection)
- ✅ 90 günde bir otomatik sertifika yenileme

## Yardım ve Destek

- Let's Encrypt Dokümanları: https://letsencrypt.org/docs/
- Certbot Dokümanları: https://certbot.eff.org/
- SSL Test: https://www.ssllabs.com/ssltest/

---

**Önemli:** SSL kurulumu tamamlandıktan sonra mutlaka tüm URL'lerde test yapın!

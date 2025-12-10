# Hostinger Deployment Guide - syncarch.com

## Hazırlanmış Dosyalar

Tüm production dosyaları `dist/` klasöründe hazır:
- `index.html` - Ana HTML dosyası
- `assets/` - CSS ve JS dosyaları
- `.htaccess` - Apache yapılandırma dosyası
- `_redirects` - SPA routing desteği

## Deployment Yöntemleri

### Yöntem 1: Hostinger File Manager (Önerilen - En Kolay)

1. **Hostinger Paneline Giriş**
   - https://hpanel.hostinger.com adresine gidin
   - Email ve şifrenizle giriş yapın

2. **File Manager'ı Açın**
   - Sol menüden **Hosting** seçin
   - **File Manager** butonuna tıklayın

3. **Doğru Klasöre Gidin**
   - `public_html` veya
   - `domains/syncarch.com/public_html` klasörüne gidin

4. **Mevcut Dosyaları Temizleyin (Varsa)**
   - Klasördeki tüm dosyaları seçin ve silin
   - `.htaccess` dosyası varsa onu da silin

5. **Yeni Dosyaları Yükleyin**
   - **Upload Files** butonuna tıklayın
   - `dist/` klasöründeki TÜM dosyaları seçin:
     - `index.html`
     - `.htaccess`
     - `_redirects`
     - `assets/` klasörü (tüm içeriğiyle)
   - Upload işlemi tamamlanana kadar bekleyin

6. **İzinleri Kontrol Edin**
   - Dosyalar: 644 (rw-r--r--)
   - Klasörler: 755 (rwxr-xr-x)
   - Genellikle otomatik olarak doğru ayarlanır

### Yöntem 2: FTP/SFTP (FileZilla)

**Bağlantı Bilgileri:**
```
Host: 31.97.78.86
Username: root (veya Hostinger'dan verilen kullanıcı)
Port: 21 (FTP) veya 22 (SFTP)
Protocol: FTP veya SFTP
Password: [Hostinger şifreniz]
```

**Adımlar:**
1. FileZilla'yı açın
2. Yukarıdaki bilgilerle bağlanın
3. Sağ tarafta (uzak sunucu) `/public_html` veya `/domains/syncarch.com/public_html` klasörüne gidin
4. Sol tarafta (yerel) `dist/` klasörüne gidin
5. `dist/` içindeki TÜM dosyaları sağ tarafa sürükleyip bırakın
6. Transfer tamamlanana kadar bekleyin

### Yöntem 3: SSH (Terminal)

**Gereksinim:** SSH şifreniz olmalı

```bash
# Proje klasörüne gidin
cd /tmp/cc-agent/60856901/project

# Dosyaları sunucuya yükleyin
scp -r dist/* root@31.97.78.86:/domains/syncarch.com/public_html/

# Veya rsync kullanın (daha hızlı)
rsync -avz --delete dist/ root@31.97.78.86:/domains/syncarch.com/public_html/
```

## Deployment Sonrası Yapılandırma

### 1. Domain Ayarları Kontrolü

Hostinger Panelinde:
1. **Domains** bölümüne gidin
2. **syncarch.com** domaininizi bulun
3. **Manage** butonuna tıklayın
4. **Website** sekmesinde:
   - **Document Root** doğru olmalı (genellikle `/public_html` veya `/domains/syncarch.com/public_html`)
5. **SSL** sekmesinde:
   - SSL sertifikası aktif olmalı (Let's Encrypt ücretsiz)
   - Yoksa **Install SSL** butonuna tıklayın

### 2. Supabase URL Yapılandırması

Supabase Dashboard'da (https://supabase.com/dashboard):

1. Projenize gidin
2. **Settings** → **Authentication** menüsüne gidin
3. **URL Configuration** bölümünde:
   - **Site URL:** `https://syncarch.com`
   - **Redirect URLs:** Şunları ekleyin:
     - `https://syncarch.com`
     - `https://syncarch.com/*`
     - `https://www.syncarch.com` (eğer www kullanıyorsanız)
     - `https://www.syncarch.com/*`

4. **Save** butonuna tıklayın

### 3. DNS Ayarları (Eğer domain yeni transfer edildiyse)

Hostinger veya domain registrar panelinde DNS kayıtlarını kontrol edin:

```
A Record:
  Name: @
  Value: 31.97.78.86
  TTL: 14400

A Record (www için):
  Name: www
  Value: 31.97.78.86
  TTL: 14400
```

## Test ve Doğrulama

Deployment tamamlandıktan sonra:

1. **Site Erişimi**
   - https://syncarch.com adresine gidin
   - Ana sayfa yüklenmeli

2. **Authentication Testi**
   - Yeni kullanıcı kaydı yapın
   - Giriş yapın
   - Çıkış yapın

3. **Routing Testi**
   - Farklı sayfalara gidin
   - Tarayıcıda geri/ileri butonlarını test edin
   - Sayfayı yenileyin (F5) - hata vermemeli

4. **Database Testi**
   - Yeni firma ekleyin
   - Yeni iş ekleyin
   - İşlem ekleyin
   - Verilerin kaydedildiğini kontrol edin

5. **SSL Kontrolü**
   - URL'de kilit simgesi görünmeli
   - https:// ile açılmalı
   - Sertifika geçerli olmalı

## Yaygın Sorunlar ve Çözümler

### Sorun 1: Sayfa Yenileme 404 Hatası
**Çözüm:** `.htaccess` dosyası yüklenmemiş veya çalışmıyor.
- File Manager'da `.htaccess` dosyasının varlığını kontrol edin
- Apache mod_rewrite modülünün aktif olduğundan emin olun

### Sorun 2: Supabase Bağlantı Hatası
**Çözüm:**
- `.env` dosyasındaki SUPABASE_URL ve SUPABASE_ANON_KEY değerlerini kontrol edin
- Build işleminin doğru tamamlandığından emin olun
- Supabase Dashboard'da projenin aktif olduğunu kontrol edin

### Sorun 3: Authentication Çalışmıyor
**Çözüm:**
- Supabase Dashboard → Settings → Authentication → URL Configuration
- Site URL ve Redirect URLs'leri doğru ayarlayın
- https://syncarch.com olarak güncelleyin

### Sorun 4: Dosyalar Güncellenmiyor
**Çözüm:**
- Tarayıcı cache'ini temizleyin (Ctrl+Shift+Delete)
- Hostinger panelinde cache'i temizleyin
- Hard refresh yapın (Ctrl+F5)

### Sorun 5: 500 Internal Server Error
**Çözüm:**
- `.htaccess` dosyasındaki syntax hatalarını kontrol edin
- Error logs'u Hostinger panelinden kontrol edin
- File permissions'ları kontrol edin (644/755)

## Güncelleme İşlemi

Gelecekte güncelleme yapmak için:

1. **Yeni build oluşturun:**
   ```bash
   npm run build
   ```

2. **Dosyaları yedekleyin** (Hostinger File Manager'da eski dosyaları zip'leyin)

3. **Yeni dosyaları yükleyin** (Yukarıdaki yöntemlerden birini kullanın)

4. **Cache'i temizleyin:**
   - Hostinger panelinde cache temizleme
   - Tarayıcı cache temizleme

5. **Test edin**

## İletişim ve Destek

- Hostinger Destek: https://www.hostinger.com/cpanel-login
- Supabase Destek: https://supabase.com/dashboard/support

## Güvenlik Notları

- ✅ `.env` dosyası build'e dahil edilmez (güvenli)
- ✅ Environment variables build sırasında gömülür
- ✅ `.htaccess` güvenlik başlıkları eklendi
- ✅ Supabase RLS politikaları aktif
- ✅ SSL sertifikası gerekli

---

**Önemli:** İlk deployment'tan sonra mutlaka tüm özellikleri test edin!

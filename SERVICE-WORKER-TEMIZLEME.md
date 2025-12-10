# Service Worker Cache Temizleme

Service Worker eski versiyonu cache'liyor. Yeni versiyon (v6) yüklendi!

## ADIM 1: Sayfayı Yenileyin

**Hard Refresh yapın:**
- Windows/Linux: `Ctrl + Shift + R` veya `Ctrl + F5`
- Mac: `Cmd + Shift + R`

## ADIM 2: Service Worker'ı Temizleyin

### Chrome / Edge:

1. **DevTools Açın:**
   - Windows/Linux: `F12` veya `Ctrl + Shift + I`
   - Mac: `Cmd + Option + I`

2. **Application Sekmesi:**
   - Üst menüden "Application" sekmesini seçin
   - Sol panelden "Service Workers" seçin

3. **Unregister:**
   - "Unregister" linkine tıklayın
   - "Update on reload" checkbox'ını işaretleyin

4. **Cache Temizle:**
   - Sol panelden "Cache Storage" açın
   - Tüm cache'leri (syncarch-v5, syncarch-v6 vs) sağ tıklayıp "Delete"

5. **Sayfayı Yenileyin:**
   - `Ctrl + Shift + R` veya `Cmd + Shift + R`

### Firefox:

1. **Developer Tools:**
   - `F12` veya `Ctrl + Shift + I`

2. **Storage Sekmesi:**
   - "Storage" sekmesini seçin
   - "Cache Storage" açın
   - Tüm cache'leri temizleyin

3. **Service Workers:**
   - about:debugging#/runtime/this-firefox
   - syncarch.xyz için "Unregister" tıklayın

4. **Sayfayı Yenileyin**

## ADIM 3: Alternatif Yöntem - Console

DevTools Console'a bu kodu yapıştırın:

```javascript
// Tüm cache'leri temizle
caches.keys().then(keys => {
  keys.forEach(key => {
    caches.delete(key);
    console.log('Cache silindi:', key);
  });
});

// Service Worker'ı güncelle
navigator.serviceWorker.getRegistrations().then(registrations => {
  registrations.forEach(registration => {
    registration.unregister();
    console.log('Service Worker kaldırıldı');
  });
});

// Sayfayı yenile
setTimeout(() => location.reload(true), 1000);
```

## ADIM 4: Manuel Temizleme

Eğer yukarıdaki yöntemler işe yaramazsa:

1. **Chrome Ayarlar:**
   - chrome://settings/siteData
   - syncarch.xyz'yi bulun ve sil

2. **Firefox Ayarlar:**
   - about:preferences#privacy
   - Cookies and Site Data > Manage Data
   - syncarch.xyz'yi bulun ve kaldır

## ADIM 5: Son Çare

Hala çalışmıyorsa:

1. Tarayıcıyı tamamen kapatın
2. Tarayıcı verilerini temizleyin
3. Tarayıcıyı yeniden başlatın
4. https://syncarch.xyz adresine gidin

## Deployment Bilgileri

- **Eski Cache:** syncarch-v5
- **Yeni Cache:** syncarch-v6
- **Deployment:** 09 Aralık 2025 - 22:09 UTC
- **Status:** Aktif

## Doğrulama

DevTools Console'da kontrol edin:

```javascript
// Service Worker versiyonunu kontrol et
caches.keys().then(keys => console.log('Cache keys:', keys));
```

Çıktıda "syncarch-v6" görmelisiniz.

## Mobil Cihazlar

**iOS Safari:**
- Ayarlar > Safari > Gelişmiş > Website Data > Tümünü Kaldır

**Android Chrome:**
- Ayarlar > Gizlilik > Tarama verilerini temizle
- Önbellek seçili olmalı

Yeni Service Worker otomatik olarak eski cache'i temizleyecek ve yeni versiyonu yükleyecektir.

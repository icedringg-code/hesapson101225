# Tarayıcı Cache Temizleme

Yeni versiyon başarıyla yüklendi! Eski versiyonu görüyorsanız, tarayıcı cache'ini temizlemeniz gerekiyor.

## Hızlı Çözüm: Hard Refresh

### Windows / Linux:
- **Chrome, Edge, Firefox:** `Ctrl + Shift + R` veya `Ctrl + F5`

### Mac:
- **Chrome, Edge:** `Cmd + Shift + R`
- **Safari:** `Cmd + Option + R`
- **Firefox:** `Cmd + Shift + R`

## Tam Cache Temizleme

### Chrome / Edge:
1. `Ctrl + Shift + Delete` (Windows) veya `Cmd + Shift + Delete` (Mac)
2. "Önbelleğe alınan resimler ve dosyalar" seçeneğini işaretleyin
3. Zaman aralığı: "Tüm zamanlar"
4. "Verileri temizle" düğmesine tıklayın

### Firefox:
1. `Ctrl + Shift + Delete` (Windows) veya `Cmd + Shift + Delete` (Mac)
2. "Önbellek" seçeneğini işaretleyin
3. "Şimdi temizle" düğmesine tıklayın

### Safari:
1. Safari menü > Tercihleri > Gelişmiş
2. "Menü çubuğunda Geliştir menüsünü göster" işaretleyin
3. Geliştir > Önbellekleri Boşalt
4. `Cmd + Option + E`

## Gizli Mod Test

Tarayıcınızı gizli/özel modda açın:
- **Chrome:** `Ctrl + Shift + N` (Windows) veya `Cmd + Shift + N` (Mac)
- **Firefox:** `Ctrl + Shift + P` (Windows) veya `Cmd + Shift + P` (Mac)
- **Safari:** `Cmd + Shift + N`

Gizli modda https://syncarch.xyz açın. Burada yeni versiyon görünüyorsa, normal modda cache temizlemeniz yeterli olacaktır.

## Deployment Bilgileri

- **URL:** https://syncarch.xyz
- **Son Güncelleme:** 09 Aralık 2025 - 22:01 UTC
- **Yeni Asset Hash:** index-Qgi6dpiJ.js
- **Status:** Aktif ve çalışıyor

## Sorun Devam Ederse

Eğer hala eski versiyon görünüyorsa:

1. Tarayıcıyı tamamen kapatıp yeniden açın
2. Service Worker'ı temizleyin:
   - Chrome DevTools (F12) > Application > Service Workers > Unregister
3. Mobil cihazda ise uygulamayı sil/yeniden yükle

Cache temizlendikten sonra yeni versiyon görünecektir.

# 💱 Otomatik Döviz Kuru ve Altın Fiyatı Çekme Rehberi

## Özellik Özeti

Artık işlem eklerken veya düzenlerken **Dolar** ve **HAS Altın** kurları otomatik olarak seçilen tarihe göre çekilecek ve otomatik olarak doldurulacak!

## 🎯 Nasıl Çalışır?

### Otomatik Kur Çekme

1. **İşlem Ekle** veya **İşlem Düzenle** modalını açın
2. **Para Birimi** olarak "Altın" veya "Dolar" seçin
3. **Tarih** seçin
4. Kur otomatik olarak çekilir ve alana doldurulur!

### Manuel Yenileme

Kur alanının sağında bulunan **yenileme** butonuna tıklayarak istediğiniz zaman güncel kuru tekrar çekebilirsiniz.

## 📊 Veri Kaynakları

Sistem **güvenilir ve sabit** kaynaklardan veri çeker:

### 1. TCMB (Türkiye Cumhuriyet Merkez Bankası)
- Resmi kaynak
- En güvenilir
- Dolar ve Euro kurları

### 2. Fallback API (TCMB çalışmazsa)
- exchangerate-api.com
- Global döviz kurları
- Altın fiyatları (USD bazlı)

## 🔧 Kurulum

### 1. Veritabanı Tablosunu Oluşturun

Supabase Dashboard'da:

1. **SQL Editor**'e gidin
2. `EXCHANGE_RATES_MIGRATION.sql` dosyasının içeriğini kopyalayın
3. SQL Editor'e yapıştırın
4. **RUN** butonuna tıklayın

```sql
-- exchange_rates tablosu oluşturulacak
-- RLS policies ayarlanacak
-- Index'ler eklenecek
```

### 2. Kodu Deploy Edin

```bash
# Web için build
npm run build

# Mobile için build
npm run mobile:build
```

### 3. Test Edin

1. Uygulamayı açın
2. Bir işe gidin
3. "İşlem Ekle" butonuna tıklayın
4. Para birimi olarak "Altın" veya "Dolar" seçin
5. Bir tarih seçin
6. Kur otomatik olarak doldurulmalı!

## 💾 Veri Saklama

### Önbellek Sistemi

Kurlar veritabanında saklanır:
- Her tarih için bir kez çekilir
- Tekrar aynı tarih seçildiğinde veritabanından okunur
- Network trafiği azalır
- Hız artar

### Veri Yapısı

```typescript
{
  date: "2024-12-05",
  usd_buy: 34.1234,    // USD alış
  usd_sell: 34.1567,   // USD satış
  eur_buy: 37.2345,    // EUR alış
  eur_sell: 37.2678,   // EUR satış
  gold_buy: 3245.50,   // Altın alış (gram)
  gold_sell: 3250.75   // Altın satış (gram)
}
```

## 🎨 Kullanıcı Deneyimi

### Görsel Göstergeler

1. **Kur çekiliyor...** - Yüklenme göstergesi
2. **Yenileme butonu** - Manuel yenileme için
3. **Spin animasyonu** - İşlem devam ederken

### Hata Yönetimi

- TCMB çalışmazsa fallback API'ye geçer
- API'ler çalışmazsa kullanıcı manuel girebilir
- Hata console'da gösterilir (geliştirme için)

## 📱 Platform Desteği

### Web (PWA)
✅ Tam destek

### iOS (Native)
✅ Tam destek

### Android (Native)
✅ Tam destek

## 🔐 Güvenlik

### RLS Policies

```sql
-- Herkes okuyabilir (authenticated)
SELECT: authenticated users can read

-- Sadece sistem yazabilir
INSERT/UPDATE: service_role only
```

### API Limitleri

- TCMB: Limit yok (resmi)
- Fallback API: ~100,000 request/ay (ücretsiz)

## 🚀 İleri Düzey Özellikler

### Özelleştirme

`src/services/exchangeRates.ts` dosyasını düzenleyerek:

1. Farklı API'ler ekleyebilirsiniz
2. Kur hesaplamalarını değiştirebilirsiniz
3. Önbellek süresini ayarlayabilirsiniz

### Ek Para Birimleri

Yeni para birimi eklemek için:

1. `exchangeRates.ts`'de yeni field'lar ekleyin
2. Migration'da yeni column'lar ekleyin
3. Modal'larda yeni option ekleyin

## 🐛 Sorun Giderme

### Kur çekilmiyor

1. **Network bağlantısını kontrol edin**
2. **Supabase bağlantısını kontrol edin**
3. **Console'da hata mesajlarına bakın**
4. **exchange_rates tablosunun oluşturulduğundan emin olun**

### Yanlış kur gösteriyor

1. **Tarihi kontrol edin** - Geçmiş tarihler farklı kurlar gösterir
2. **Manuel yenileme butonunu kullanın**
3. **Veritabanındaki veriyi silin** - Yeni çekilecek

```sql
-- Belirli bir tarihin verisini silmek için
DELETE FROM exchange_rates WHERE date = '2024-12-05';
```

### API çalışmıyor

Fallback API aktif olmalı. Eğer her iki API de çalışmazsa:

1. Manuel giriş yapılabilir
2. Daha sonra güncellenebilir

## 📚 API Dokümantasyonu

### TCMB API

**Endpoint:**
```
https://evds2.tcmb.gov.tr/service/evds/
```

**Seriler:**
- USD: `TP.DK.USD.A.YTL`
- EUR: `TP.DK.EUR.A.YTL`

### Fallback API

**Endpoint:**
```
https://api.exchangerate-api.com/v4/latest/USD
```

**Response:**
```json
{
  "rates": {
    "TRY": 34.15,
    "EUR": 0.92,
    ...
  }
}
```

## 📊 Performans

### İlk Yükleme
- Yeni tarih: ~2-3 saniye
- Önbellekli tarih: <100ms

### Veri Boyutu
- Request: ~2KB
- Response: ~5KB
- DB kayıt: ~100 bytes

## 🔄 Güncelleme Stratejisi

### Günlük Kurlar
- Sabah saat 10'da otomatik güncelleme (opsiyonel)
- Manuel yenileme ile istendiğinde

### Geçmiş Kurlar
- Önbellekte kalır
- Tekrar çekilmez (tarihi veri)

## ✅ Checklist

Kurulum sonrası kontrol edin:

- [ ] `exchange_rates` tablosu oluşturuldu
- [ ] RLS policies aktif
- [ ] İşlem eklerken kur otomatik çekiliyor
- [ ] İşlem düzenlerken kur otomatik çekiliyor
- [ ] Manuel yenileme butonu çalışıyor
- [ ] Önbellek çalışıyor (aynı tarih hızlı yükleniyor)
- [ ] Dolar kuru doğru
- [ ] Altın fiyatı doğru

## 🎉 Sonuç

Artık döviz kurlarını manuel girmek zorunda değilsiniz! Sistem her işlemde otomatik olarak güncel kurları çekecek ve önbelleğe alacak.

**Sorularınız mı var?**
- Kod: `src/services/exchangeRates.ts`
- Migration: `EXCHANGE_RATES_MIGRATION.sql`
- Modals: `src/components/*TransactionModal.tsx`

---

**Not**: Bu özellik internet bağlantısı gerektirir. Offline çalışma için manuel giriş yapılabilir.

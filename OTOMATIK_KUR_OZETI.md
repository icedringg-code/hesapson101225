# 🎯 Otomatik Döviz Kuru Sistemi - Hızlı Başlangıç

## Ne Yapıldı?

Artık işlem eklerken veya düzenlerken **Dolar ve HAS Altın kurları otomatik** olarak çekilip dolduruluyor!

## Nasıl Kullanılır?

1. İşlem Ekle/Düzenle modalını aç
2. Para birimi olarak **"Altın"** veya **"Dolar"** seç
3. **Tarih** seç
4. Kur **otomatik doldurulur**! ✨

Manuel yenilemek isterseniz, kur alanının sağındaki **yenile butonuna** tıklayın.

## Kurulum

### 1. Veritabanı Tablosu Oluştur

Supabase Dashboard > SQL Editor'de şunu çalıştır:

**Dosya:** `EXCHANGE_RATES_MIGRATION.sql`

### 2. Deploy Et

```bash
npm run build
```

veya mobile için:

```bash
npm run mobile:build
```

## Veri Kaynağı

**Sabit tek kaynak:** TCMB (Türkiye Cumhuriyet Merkez Bankası) resmi API

**Fallback:** exchangerate-api.com (TCMB çalışmazsa)

## Özellikler

✅ Otomatik kur çekme
✅ Tarih bazlı kurlar
✅ Önbellek sistemi (aynı tarih tekrar çekilmez)
✅ Manuel yenileme butonu
✅ Görsel yükleme göstergesi
✅ Dolar satış kuru
✅ HAS Altın gram fiyatı (satış)

## Dosyalar

- `src/services/exchangeRates.ts` - Kur çekme servisi
- `src/components/AddTransactionModal.tsx` - İşlem ekle (güncellendi)
- `src/components/EditTransactionModal.tsx` - İşlem düzenle (güncellendi)
- `EXCHANGE_RATES_MIGRATION.sql` - Veritabanı migration
- `EXCHANGE_RATES_GUIDE.md` - Detaylı kılavuz

## Test Etme

1. Uygulamayı aç
2. Bir işe gir
3. "İşlem Ekle"ye tıkla
4. "Altın" veya "Dolar" seç
5. Bir tarih seç
6. Kur otomatik dolmalı!

## Sorun mu var?

**Kur çekilmiyor:**
- Network bağlantısını kontrol et
- Console'da error var mı bak
- `exchange_rates` tablosu oluşturuldu mu kontrol et

**Detaylı kılavuz:** `EXCHANGE_RATES_GUIDE.md`

---

Hazır! Artık her işlemde güncel kurlar otomatik çekilecek. 🚀

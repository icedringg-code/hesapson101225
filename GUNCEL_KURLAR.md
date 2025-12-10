# Güncel Kurlar (API'den Çekildi)

## 📊 Bugünkü Kurlar
**Tarih:** 2025-12-05

| Para Birimi | Kur |
|-------------|-----|
| 💵 **USD/TRY** | **42.5140 TL** |
| 💶 **EUR/TRY** | **49.5074 TL** |
| 💰 **HAS Altın** | **5,715.91 TL/gr** ✅ |

---

## ✅ Altın Fiyatları Güncellendi

HAS altın fiyatları artık **gerçek Türk piyasasından** çekiliyor!

### API Kaynağı
- **Döviz:** Frankfurter API (Uluslararası)
- **Altın:** finans.truncgil.com (Türkiye piyasa verileri)

### Güncel SQL Komutu

Supabase Dashboard → SQL Editor'da çalıştırın:

```sql
-- Bugünün kurlarını kaydet
INSERT INTO exchange_rates (date, usd_buy, usd_sell, eur_buy, eur_sell, gold_buy, gold_sell)
VALUES (
  '2025-12-05',
  42.4290,  -- USD alış
  42.5140,  -- USD satış
  49.4084,  -- EUR alış
  49.5074,  -- EUR satış
  5715.13,  -- Altın alış (Gerçek piyasa)
  5715.91   -- Altın satış (Gerçek piyasa)
)
ON CONFLICT (date) DO UPDATE SET
  usd_buy = EXCLUDED.usd_buy,
  usd_sell = EXCLUDED.usd_sell,
  eur_buy = EXCLUDED.eur_buy,
  eur_sell = EXCLUDED.eur_sell,
  gold_buy = EXCLUDED.gold_buy,
  gold_sell = EXCLUDED.gold_sell;
```

---

## 📌 Özellikler

### Fallback Sistemi
Eğer Türk finans API'si yanıt vermezse:
1. Metals.live API'den spot fiyat çekilir
2. Çarpan `1.7` kullanılır (gerçekçi)
3. Son çare: Sabit spot fiyat ($2650/oz)

### Kod İyileştirmeleri
- ✅ Gerçek piyasa fiyatları (finans.truncgil.com)
- ✅ Üç kademeli fallback sistemi
- ✅ Alış ve satış fiyatları ayrı ayrı
- ✅ Doğru piyasa çarpanı (1.7x)

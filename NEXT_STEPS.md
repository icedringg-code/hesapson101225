# İş Takip Sistemi - Tam Özellikler İmplementasyon Rehberi

## Proje Durumu

✅ **Tamamlananlar:**
- Veritabanı migration'ı oluşturuldu ve uygulandı
- Authentication sistemi (email/password)
- Dashboard ana sayfa
- Job oluşturma/silme özellikleri
- İstatistik hesaplamaları (DOĞRU MANTIKLA: Çalışan alacakları = Gider)
- Service katmanı (jobs, companies, transactions, statistics)
- Responsive tasarım

## Eksik Olan Özellikler ve İmplementasyon

### 1. İş Detay Sayfası

Bu sayfada görüntülenecekler:
- İş bilgileri ve istatistikler
- İşveren listesi (tab)
- Çalışan listesi (tab)
- İşlemler listesi (tab)

**Oluşturulacak Dosyalar:**

#### `src/pages/JobDetailPage.tsx`
```typescript
import { useEffect, useState } from 'react';
import { ArrowLeft, Plus, FileSpreadsheet } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { getJob } from '../services/jobs';
import { getJobCompanies } from '../services/companies';
import { getJobTransactions } from '../services/transactions';
import { calculateJobStats } from '../services/statistics';

// Bu sayfada:
// 1. Job bilgilerini göster
// 2. Companies tabını göster (İşveren ve Çalışan ayrı ayrı)
// 3. Transactions tabını göster
// 4. Her tab için modal'lar (ekle/düzenle)
// 5. İstatistikler (gelir, gider, net bakiye)
```

### 2. İşlem Ekleme Modal'ı (ÖNEMLİ!)

Bu modal'ın üç farklı çalışma modu olmalı:

#### Mod 1: Çalışan için İşlem (Alacak Ekleme)
- Çalışan seçildiğinde
- Sadece "Alacak Tutarı" alanı gösterilir
- Gider alanı GİZLENİR
- Note: "Alacak" olarak kaydedilir
- Bu tutar TOPLAM GİDER'e eklenir ✅

#### Mod 2: İşveren için Gelir
- İşveren seçildiğinde
- "İşlem Tipi" radio butonları görünür
- "Gelir" seçilirse
- Note: "Gelir" olarak kaydedilir
- Bu tutar TOPLAM GELİR'e eklenir ✅

#### Mod 3: İşveren için Harcama
- İşveren seçildiğinde
- "İşlem Tipi" seçiminde "Harcama" seçilirse
- Note: "İşveren Harcaması" olarak kaydedilir
- Bu tutar TOPLAM GİDER'e eklenir ✅

#### Mod 4: İşverenden Çalışana Ödeme
- İşveren seçildiğinde
- "İşlem Tipi" seçiminde "Ödeme" seçilirse
- Çalışan seçim alanı görünür
- İKİ transaction kaydı oluşturulur:
  1. Çalışan için: income=tutar, note="Ödeme Alındı"
  2. İşveren için: expense=tutar, note="Ödeme Yapıldı"

**Oluşturulacak Dosya:**

#### `src/components/TransactionModal.tsx`
```typescript
import { useState, useEffect } from 'react';
import { Company } from '../types';
import {
  createEmployeeReceivable,
  createEmployerIncome,
  createEmployerExpense,
  createPaymentToEmployee
} from '../services/transactions';

// Yukarıdaki 4 modu destekleyen tam fonksiyonel modal
```

### 3. Excel Export İşlevselliği

**Kullanılacak Kütüphane:** xlsx (zaten package.json'da mevcut değil, eklenmeli)

```bash
npm install xlsx
```

**Oluşturulacak Dosya:**

#### `src/utils/excelExport.ts`
```typescript
import * as XLSX from 'xlsx';
import { Job, Company, Transaction } from '../types';

export function exportJobToExcel(
  job: Job,
  companies: Company[],
  transactions: Transaction[],
  stats: any
) {
  const wb = XLSX.utils.book_new();

  // Sheet 1: İş Bilgileri
  // Sheet 2: İşverenler
  // Sheet 3: Çalışanlar
  // Sheet 4: Tüm İşlemler
  // Sheet 5: Özet

  XLSX.writeFile(wb, `${job.name}_${new Date().toISOString().split('T')[0]}.xlsx`);
}
```

### 4. Şirket Detay Sayfası

Bir şirkete tıklandığında:
- Şirket bilgileri
- Şirkete ait tüm işlemler
- Şirketin yaptığı işlemler (performed_by_id)
- İstatistikler

**Oluşturulacak Dosya:**

#### `src/pages/CompanyDetailPage.tsx`

### 5. Routing Yapılandırması

**NOT:** Şu an routing yok. React Router kurulmalı.

```bash
npm install react-router-dom
```

**Güncellenecek Dosyalar:**

#### `src/main.tsx`
```typescript
import { BrowserRouter } from 'react-router-dom';

root.render(
  <BrowserRouter>
    <AuthProvider>
      <App />
    </AuthProvider>
  </BrowserRouter>
);
```

#### `src/App.tsx`
```typescript
import { Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import JobDetailPage from './pages/JobDetailPage';
import CompanyDetailPage from './pages/CompanyDetailPage';

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) return <LoadingScreen />;
  if (!user) return <AuthPage />;

  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/job/:id" element={<JobDetailPage />} />
      <Route path="/company/:id" element={<CompanyDetailPage />} />
    </Routes>
  );
}
```

### 6. İş Düzenleme Modal'ı

JobCard'da "Düzenle" butonuna işlev kazandırılmalı.

**Oluşturulacak Dosya:**

#### `src/components/EditJobModal.tsx`

### 7. Şirket Yönetimi

**Oluşturulacak Dosyalar:**
- `src/components/AddCompanyModal.tsx`
- `src/components/CompanyCard.tsx`

### 8. Gelişmiş İstatistikler

**Oluşturulacak Dosya:**

#### `src/components/JobSummaryCard.tsx`
- Ödeme durumu özeti
- Çalışan bazında alacaklar
- İşveren bazında gelir/gider

## İmplementasyon Sırası (Önerilen)

### Faz 1: Routing ve Navigation (1-2 saat)
1. React Router kur
2. App.tsx'i güncelle
3. JobCard'a onClick ekle (zaten eklendi ✅)
4. Navigation test et

### Faz 2: İş Detay Sayfası (3-4 saat)
1. JobDetailPage.tsx oluştur
2. Tab yapısını kur (İşverenler, Çalışanlar, İşlemler)
3. Her tab için veri gösterimi
4. Test et

### Faz 3: İşlem Modal'ı - KRİTİK! (4-5 saat)
1. TransactionModal.tsx oluştur
2. 4 farklı modu implement et:
   - Çalışan Alacak
   - İşveren Gelir
   - İşveren Harcama
   - İşverenden Çalışana Ödeme
3. Form validasyonları
4. Hint sistemini kur (dinamik açıklamalar)
5. Test et - ÇOK ÖNEMLİ!

### Faz 4: Şirket Yönetimi (2-3 saat)
1. AddCompanyModal.tsx
2. CompanyCard.tsx
3. İşveren/Çalışan ekleme
4. Test et

### Faz 5: Excel Export (2-3 saat)
1. xlsx kütüphanesini kur
2. excelExport.ts oluştur
3. Export butonunu ekle
4. Test et

### Faz 6: Şirket Detay Sayfası (2-3 saat)
1. CompanyDetailPage.tsx
2. İşlem listesi
3. İstatistikler
4. Test et

### Faz 7: Polish ve Bug Fixes (2-3 saat)
1. Loading state'leri
2. Error handling
3. Toast notifications
4. Confirm dialog'ları
5. UI iyileştirmeleri

**TOPLAM SÜRE: 16-23 saat**

## Kritik Noktalar

### ⚠️ İşlem Hesaplama Mantığı - DOĞRU VERSİYON

```typescript
// DOĞRU ✅
if (company.type === 'Çalışan' && transaction.note === 'Alacak') {
  totalExpense += transaction.income; // Çalışan alacağı = Bizim giderimiz
}

// YANLIŞ ❌
if (company.type === 'Çalışan' && transaction.note === 'Alacak') {
  totalIncome += transaction.income; // HAYIR! Bu gelir değil!
}
```

### ⚠️ Ödeme İşlemi - İKİ KAYIT

```typescript
// İşverenden çalışana ödeme yapıldığında:

// 1. Çalışan için kayıt
{
  company_id: employeeId,
  performed_by_id: employerId,
  income: amount,
  expense: 0,
  note: 'Ödeme Alındı'
}

// 2. İşveren için kayıt
{
  company_id: employerId,
  performed_by_id: employerId,
  income: 0,
  expense: amount,
  note: 'Ödeme Yapıldı'
}
```

## Test Senaryosu

İmplementasyon sonrası mutlaka test edilmeli:

1. ✅ İş oluştur
2. ✅ İşveren ekle
3. ✅ Çalışan ekle
4. ✅ Çalışana alacak ekle → Toplam Gider artmalı
5. ✅ İşverene gelir ekle → Toplam Gelir artmalı
6. ✅ İşverenden harcama ekle → Toplam Gider artmalı
7. ✅ İşverenden çalışana ödeme yap → Her iki tarafta da görünmeli
8. ✅ İstatistiklerin doğru hesaplandığını kontrol et
9. ✅ Excel export çalışmalı
10. ✅ Tüm sayfalar responsive olmalı

## Sonuç

Bu rehber, Google Apps Script sistemini tam olarak React'e taşımak için gereken tüm adımları içeriyor.

**Şu an proje durumu:**
- ✅ Altyapı hazır (database, auth, services)
- ✅ Ana sayfa çalışıyor
- ✅ Hesaplama mantığı DOĞRU
- ⏳ UI/UX bileşenleri implementasyonu gerekiyor

**Tahmini tamamlanma süresi:** 2-3 gün (fulltime çalışma)

Her adım için örnek kod ve detaylı açıklama hazırladım. İsterseniz bu rehberi takip ederek kalan özellikleri ekleyebilirsiniz.

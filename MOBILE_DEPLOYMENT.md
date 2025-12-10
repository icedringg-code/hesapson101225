# 📱 SyncArch Mobil Uygulama Deployment Kılavuzu

Bu kılavuz, SyncArch İş Takip uygulamanızı iOS (iPhone/iPad) ve Android cihazlarda native app olarak yayınlamak için gerekli tüm adımları içerir.

## 📋 İçindekiler

1. [Gereksinimler](#gereksinimler)
2. [Hızlı Başlangıç](#hızlı-başlangıç)
3. [iOS App Store Deployment](#ios-app-store-deployment)
4. [Android Play Store Deployment](#android-play-store-deployment)
5. [Sık Karşılaşılan Sorunlar](#sık-karşılaşılan-sorunlar)

---

## 🛠 Gereksinimler

### iOS Deployment İçin
- **macOS** (zorunlu - Xcode sadece macOS'ta çalışır)
- **Xcode 14+** ([App Store'dan indirebilirsiniz](https://apps.apple.com/us/app/xcode/id497799835))
- **CocoaPods** (`sudo gem install cocoapods`)
- **Apple Developer Account** ($99/yıl - [Kayıt ol](https://developer.apple.com))

### Android Deployment İçin
- **Android Studio** ([İndir](https://developer.android.com/studio))
- **JDK 11 veya üzeri**
- **Google Play Console Account** ($25 tek seferlik - [Kayıt ol](https://play.google.com/console))

### Her İki Platform İçin
- **Node.js 18+** ve **npm**
- Bu proje (zaten hazır!)

---

## 🚀 Hızlı Başlangıç

### 1. Proje Durumu Kontrolü

Capacitor zaten kurulu ve yapılandırılmış! iOS ve Android projeleri oluşturuldu.

```bash
# Proje yapısını kontrol edin
ls -la
# ios/ ve android/ klasörlerini görmelisiniz
```

### 2. Web Assets'i Güncelleme

Her değişiklikten sonra web assets'leri mobile platformlara kopyalamanız gerekir:

```bash
# Web uygulamasını build et ve her iki platforma sync et
npm run mobile:build

# Veya sadece iOS için
npm run cap:build:ios

# Veya sadece Android için
npm run cap:build:android
```

---

## 📱 iOS App Store Deployment

### Adım 1: Xcode'da Projeyi Açma

```bash
npm run cap:open:ios
```

Bu komut Xcode'u açacak ve projenizi yükleyecek.

### Adım 2: CocoaPods Kurulumu

İlk kez açıldığında terminal'den şunu çalıştırın:

```bash
cd ios/App
pod install
```

### Adım 3: Uygulama Bilgilerini Yapılandırma

Xcode'da:

1. **Sol panelden** `App` projesini seçin
2. **TARGETS** > **App** seçin
3. **General** sekmesinde:
   - **Display Name**: `SyncArch İş Takip`
   - **Bundle Identifier**: `com.syncarch.istakip` (benzersiz olmalı)
   - **Version**: `1.0.0`
   - **Build**: `1`

### Adım 4: Signing & Capabilities

1. **Signing & Capabilities** sekmesine gidin
2. **Team**: Apple Developer hesabınızı seçin
3. **Automatically manage signing** işaretli olsun
4. Xcode otomatik olarak provisioning profile oluşturacak

### Adım 5: App Icons Ekleme

1. `ios/App/App/Assets.xcassets/AppIcon.appiconset` klasörüne gidin
2. Gerekli icon boyutlarını ekleyin:
   - 1024x1024 (App Store)
   - 180x180 (iPhone 3x)
   - 120x120 (iPhone 2x)
   - 167x167 (iPad Pro)
   - 152x152 (iPad 2x)
   - 76x76 (iPad 1x)

**İpucu**: Online icon generator kullanabilirsiniz: https://appicon.co

### Adım 6: App Store Connect'te Uygulama Oluşturma

1. [App Store Connect](https://appstoreconnect.apple.com)'e gidin
2. **My Apps** > **+** > **New App**
3. Bilgileri doldurun:
   - **Platform**: iOS
   - **Name**: SyncArch İş Takip
   - **Primary Language**: Turkish
   - **Bundle ID**: `com.syncarch.istakip` (Xcode'dakiyle aynı)
   - **SKU**: İstediğiniz benzersiz bir kod

### Adım 7: Archive ve Upload

1. Xcode'da **Product** > **Destination** > **Any iOS Device**
2. **Product** > **Archive**
3. Archive tamamlandığında **Distribute App** butonuna tıklayın
4. **App Store Connect** seçin
5. **Upload** seçin
6. Varsayılan ayarlarla devam edin
7. Upload tamamlanana kadar bekleyin (5-15 dakika)

### Adım 8: TestFlight'ta Test Etme

1. App Store Connect'te uygulamanıza gidin
2. **TestFlight** sekmesine tıklayın
3. Build'iniz işlendikten sonra (10-30 dakika):
   - **Internal Testing** grubuna ekleyin
   - Test kullanıcılarını davet edin
4. iPhone'a TestFlight uygulamasını indirin ve test edin

### Adım 9: App Store'da Yayınlama

1. **App Store** sekmesine gidin
2. Gerekli bilgileri doldurun:
   - **App Privacy**: Gizlilik detayları
   - **Screenshots**: Her cihaz için ekran görüntüleri
   - **Description**: Uygulama açıklaması
   - **Keywords**: Arama kelimeleri
   - **Support URL**: Destek web sitesi
3. **Submit for Review** butonuna tıklayın
4. Apple'ın onayını bekleyin (1-2 gün)

---

## 🤖 Android Play Store Deployment

### Adım 1: Android Studio'da Projeyi Açma

```bash
npm run cap:open:android
```

Bu komut Android Studio'yu açacak ve projenizi yükleyecek.

### Adım 2: Gradle Sync

Android Studio otomatik olarak Gradle sync yapacak. Tamamlanmasını bekleyin.

### Adım 3: Uygulama Bilgilerini Yapılandırma

`android/app/build.gradle` dosyasını açın ve kontrol edin:

```gradle
android {
    namespace "com.syncarch.istakip"
    compileSdk 34

    defaultConfig {
        applicationId "com.syncarch.istakip"
        minSdk 22
        targetSdk 34
        versionCode 1
        versionName "1.0.0"
    }
}
```

### Adım 4: App Icons Ekleme

Android Studio'da:

1. **res** klasörüne sağ tıklayın
2. **New** > **Image Asset**
3. **Icon Type**: Launcher Icons (Adaptive and Legacy)
4. **Path**: Icon dosyanızı seçin (512x512 PNG önerilir)
5. **Next** > **Finish**

### Adım 5: Signing Key Oluşturma (Production için)

```bash
# Signing key oluştur
keytool -genkey -v -keystore syncarch-release-key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias syncarch

# Sorulacak bilgiler:
# - Keystore password: Güçlü bir şifre
# - Your name: İsminiz
# - Organization: Şirket adı
# - City, State, Country: Lokasyon bilgileri
```

**ÖNEMLİ**: `syncarch-release-key.jks` dosyasını GÜVENLİ bir yerde saklayın! Kaybederseniz uygulamayı güncelleyemezsiniz.

### Adım 6: Release Build Yapılandırması

`android/app/build.gradle` dosyasına ekleyin:

```gradle
android {
    ...
    signingConfigs {
        release {
            storeFile file("../../syncarch-release-key.jks")
            storePassword "KEYSTORE_PASSWORD"
            keyAlias "syncarch"
            keyPassword "KEY_PASSWORD"
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
}
```

### Adım 7: Release APK/AAB Oluşturma

```bash
cd android
./gradlew bundleRelease

# AAB dosyası burda oluşacak:
# android/app/build/outputs/bundle/release/app-release.aab
```

### Adım 8: Play Console'da Uygulama Oluşturma

1. [Google Play Console](https://play.google.com/console)'a gidin
2. **Create app**
3. Bilgileri doldurun:
   - **App name**: SyncArch İş Takip
   - **Default language**: Turkish
   - **App or game**: App
   - **Free or paid**: Free (veya Paid)
4. Politikaları kabul edin ve **Create app**

### Adım 9: App Bundle'ı Yükleme

1. Sol menüden **Release** > **Production** > **Create new release**
2. **Upload** butonuna tıklayın
3. `app-release.aab` dosyasını seçin
4. **Release name**: `1.0.0`
5. **Release notes**: İlk sürüm açıklaması

### Adım 10: Store Listing'i Tamamlama

**Store listing** sekmesinde:
- **App name**: SyncArch İş Takip
- **Short description**: Kısa açıklama (80 karakter)
- **Full description**: Detaylı açıklama
- **App icon**: 512x512 PNG
- **Feature graphic**: 1024x500 PNG
- **Screenshots**: En az 2, en fazla 8 adet (telefon, tablet)
- **App category**: Business
- **Contact details**: E-posta, web sitesi

### Adım 11: Content Rating

1. **Content rating** sekmesine gidin
2. **Start questionnaire**
3. Soruları cevaplayın
4. Rating'inizi alın

### Adım 12: Yayınlama

1. Tüm bölümleri tamamladıktan sonra **Send for review**
2. Google'ın onayını bekleyin (1-3 gün)
3. Onaylandıktan sonra uygulama Play Store'da yayında!

---

## 🎨 App Icons ve Splash Screens

### Icon Gereksinimleri

**iOS:**
- 1024x1024 (App Store)
- Şeffaf olmayan PNG
- Köşeler yuvarlatılmamış (iOS otomatik yuvarlatır)

**Android:**
- 512x512 (Play Store)
- Şeffaf PNG (adaptive icon için)
- Foreground + Background katmanları

### Otomatik Icon Generator Kullanımı

[Capacitor Asset Generator](https://github.com/capacitor-community/assets) kullanabilirsiniz:

1. `resources` klasörü oluşturun
2. `icon.png` (1024x1024) ve `splash.png` (2732x2732) ekleyin
3. Çalıştırın:

```bash
npx @capacitor/assets generate --iconBackgroundColor '#2563eb'
```

---

## 🔄 Uygulama Güncelleme

Uygulamanızı güncellemek için:

### 1. Versiyon Numarasını Artırma

**iOS** - Xcode'da:
- **Version**: `1.0.0` → `1.0.1`
- **Build**: `1` → `2`

**Android** - `build.gradle`:
```gradle
versionCode 2  // 1'den 2'ye
versionName "1.0.1"  // "1.0.0"dan "1.0.1"e
```

### 2. Kodu Güncelleme ve Build Etme

```bash
npm run mobile:build
```

### 3. Her Platform İçin Upload

- **iOS**: Xcode'da Archive > Upload (Adım 7)
- **Android**: `./gradlew bundleRelease` > Upload (Adım 9)

---

## 🐛 Sık Karşılaşılan Sorunlar

### iOS: "No signing identity found"

**Çözüm**: Apple Developer hesabınızı Xcode'a ekleyin:
- Xcode > Settings > Accounts > + > Apple ID

### iOS: CocoaPods hatası

**Çözüm**:
```bash
cd ios/App
pod deintegrate
pod install
```

### Android: Gradle build başarısız

**Çözüm**:
```bash
cd android
./gradlew clean
./gradlew build
```

### Supabase Bağlantı Hatası

**Çözüm**: `.env` dosyanızın native platformlarda okunduğundan emin olun. Capacitor yapılandırmasında environment variables'ları build time'da inject edin.

`vite.config.ts` dosyanızda:
```typescript
export default defineConfig({
  define: {
    'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(process.env.VITE_SUPABASE_URL),
    'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(process.env.VITE_SUPABASE_ANON_KEY),
  }
})
```

### Network Security (Android 9+)

Eğer HTTP bağlantı sorunu yaşarsanız, `android/app/src/main/AndroidManifest.xml`:

```xml
<application
    android:usesCleartextTraffic="true"
    ...>
```

---

## 📚 Ek Kaynaklar

### Resmi Dokümantasyon
- [Capacitor Docs](https://capacitorjs.com/docs)
- [iOS Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)
- [Android Design Guidelines](https://developer.android.com/design)

### App Store İnceleme Süreçleri
- [App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [Google Play Policy](https://support.google.com/googleplay/android-developer/answer/9859751)

### Topluluk Desteği
- [Capacitor Forum](https://forum.ionicframework.com/c/capacitor)
- [Stack Overflow - Capacitor Tag](https://stackoverflow.com/questions/tagged/capacitor)

---

## ✅ Checklist

### iOS Yayın Öncesi
- [ ] Apple Developer hesabı aktif
- [ ] Xcode kurulu ve güncel
- [ ] Bundle ID benzersiz
- [ ] App icons hazır (tüm boyutlar)
- [ ] Screenshots hazır (tüm cihazlar)
- [ ] Privacy policy hazır
- [ ] TestFlight'ta test edildi
- [ ] App Store listing tamamlandı

### Android Yayın Öncesi
- [ ] Google Play Console hesabı aktif
- [ ] Android Studio kurulu
- [ ] Signing key oluşturuldu ve güvenli saklandı
- [ ] App icons hazır
- [ ] Screenshots hazır (telefon ve tablet)
- [ ] Privacy policy hazır
- [ ] Content rating tamamlandı
- [ ] Store listing tamamlandı

---

## 🎉 Tebrikler!

Uygulamanız artık iOS ve Android'de yayında! Kullanıcılarınız App Store ve Play Store'dan indirebilir.

**Sorularınız mı var?**
- Capacitor documentation'a bakın: https://capacitorjs.com/docs
- Community forum'da sorun: https://forum.ionicframework.com

---

**Not**: Bu kılavuz sürekli güncellenmektedir. En son Capacitor ve platform değişiklikleri için resmi dokümantasyonu takip edin.

# 📱 SyncArch Mobil - Hızlı Başlangıç

## Temel Komutlar

```bash
# Web build + mobile sync (her değişiklikten sonra)
npm run mobile:build

# iOS Xcode'da aç
npm run cap:open:ios

# Android Studio'da aç
npm run cap:open:android

# Sadece iOS sync
npm run cap:sync:ios

# Sadece Android sync
npm run cap:sync:android
```

## İlk Kez Kurulum

### iOS (macOS gerekli)

1. CocoaPods kur:
```bash
sudo gem install cocoapods
```

2. Pods yükle:
```bash
cd ios/App
pod install
cd ../..
```

3. Xcode'da aç ve çalıştır:
```bash
npm run cap:open:ios
```

### Android

1. Android Studio'yu aç:
```bash
npm run cap:open:android
```

2. Gradle sync bitene kadar bekle

3. Run butonuna tıkla

## Geliştirme Akışı

1. **Web'de değişiklik yap** (src/ klasöründe)
2. **Build et ve sync et**:
   ```bash
   npm run mobile:build
   ```
3. **Native platformda test et**:
   - iOS: Xcode'da Run
   - Android: Android Studio'da Run

## App Store / Play Store Yayınlama

Detaylı adımlar için: **[MOBILE_DEPLOYMENT.md](./MOBILE_DEPLOYMENT.md)** dosyasına bakın.

### Hızlı Özet

**iOS:**
1. Xcode'da Archive oluştur
2. App Store Connect'e upload et
3. TestFlight'ta test et
4. Submit for review

**Android:**
1. Release AAB oluştur:
   ```bash
   cd android && ./gradlew bundleRelease
   ```
2. Play Console'a upload et
3. Store listing'i tamamla
4. Submit for review

## Önemli Dosyalar

- `capacitor.config.ts` - Ana Capacitor yapılandırması
- `android/app/build.gradle` - Android build ayarları
- `ios/App/App.xcodeproj` - iOS proje dosyası

## Sık Kullanılan Capacitor Plugins

Uygulama şu eklentileri kullanıyor:
- `@capacitor/app` - Lifecycle yönetimi
- `@capacitor/status-bar` - Status bar kontrolü
- `@capacitor/splash-screen` - Splash screen yönetimi
- `@capacitor/keyboard` - Klavye kontrolü

## Troubleshooting

### iOS: Build hatası
```bash
cd ios/App
pod deintegrate
pod install
```

### Android: Gradle hatası
```bash
cd android
./gradlew clean
./gradlew build
```

### Assets güncel değil
```bash
npm run mobile:build
```

## Kaynaklar

- [Detaylı Deployment Kılavuzu](./MOBILE_DEPLOYMENT.md)
- [Capacitor Docs](https://capacitorjs.com/docs)
- [iOS Guidelines](https://developer.apple.com/design/human-interface-guidelines/)
- [Android Guidelines](https://developer.android.com/design)

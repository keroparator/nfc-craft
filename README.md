# NFC Craft

Expo 56 ve React Native 0.85 ile Android ağırlıklı geliştirilen, son kullanıcıya yönelik NFC okuma/yazma uygulaması.

## Özellikler

- NFC-A kartlarının UID bilgisini gösterme.
- NDEF etiketlerine web adresi, vCard kişi bilgisi veya Bluetooth OOB verisi yazma.
- Bir etiketteki NDEF kayıtlarını başka bir etikete aktarma ve NDEF içeriğini temizleme.
- Kaydırılabilir Oku, Yaz ve Ayarlar sekmeleri; Türkçe/İngilizce ve açık/koyu/sistem teması.
- UMP onayından sonra Yaz menüsünde gösterilen tek bir uyarlanabilir AdMob banner'ı.

Kopyalama UID veya korumalı kart alanlarını klonlamaz. Bluetooth eşleşmesinin ve vCard açılmasının davranışı etiketi okuyan cihazın desteğine bağlıdır.

## Kurulum

Node.js 22 kullanılması önerilir (`.nvmrc`). Bağımlılıkların desteklediği en düşük sürüm Node.js 20.19.4'tür.

```sh
# nvm kullanıyorsan:
nvm install
nvm use

npm ci
```

## Telefonda kablosuz canlı test

Bu proje native NFC modülü kullanır. **Telefona bir kez bu projenin geliştirme APK'sı kurulmalıdır.** Expo Go, NFC modülünü içermez. Geliştirme APK'sı `expo-dev-client` içerir ve sonraki JavaScript değişikliklerini Wi-Fi üzerinden alır.

### İlk kurulum: geliştirme APK'sı

Mevcut Expo hesabına giriş yaptıktan sonra:

```sh
npx eas-cli@20.0.0 login
npx eas-cli@20.0.0 build --platform android --profile development
```

Derleme bitince EAS'in verdiği kurulum bağlantısını veya QR kodunu telefonda açıp APK'yı indir ve kur. Android gerekirse tarayıcıdan uygulama yükleme izni ister. Bu işlemde USB kablosu gerekmez.

Bu derleme EAS üzerinde yapılır; laptopta Android SDK/NDK bulunması gerekmez. `eas.json` içindeki `development` profili canlı test, `preview` profili bağımsız test, `production` profili mağaza derlemesi içindir.

### Günlük geliştirme

1. Telefonu ve laptopu aynı Wi-Fi ağına bağla.
2. Laptopta proje klasöründe `npm start` çalıştır.
3. Terminalde çıkan QR kodunu telefon kamerasıyla veya geliştirme istemcisinin QR okuyucusuyla okut. Kameranın özel uygulama bağlantısını tanımadığı durumda geliştirme istemcisinden tara.
4. Uygulama açıldıktan sonra kaynak dosyalarını kaydet; Fast Refresh değişiklikleri telefona aktarır.

```sh
npm start
# Yalnızca Metro önbelleği sorun çıkarırsa:
npm run start:clear
```

QR bağlantısı geliştirme istemcisini açmalıdır. Native paket veya `app.json` içindeki native ayar değişirse geliştirme APK'sını yeniden derleyip kur. Yalnızca JavaScript, stil veya çeviri değişikliklerinde yeniden APK üretmek gerekmez.

AdMob native paketi bu projeye eklendiği için mevcut geliştirme APK'sı bir kez yeniden üretilmelidir. `development` ve `preview` profilleri Google'ın resmi test App ID/ad unit ID değerlerini kullanır; gerçek reklam isteği göndermez.

Bağlantı kurulmazsa:

- Telefonda terminaldeki laptop IP'sinin `http://IP:8081/status` adresini aç; `packager-status:running` yanıtı gelmeli.
- VPN veya misafir Wi-Fi ağının cihazlar arası bağlantıyı engellemediğini kontrol et.
- Laptop güvenlik duvarında yerel ağdan TCP 8081 erişiminin açık olduğundan emin ol.
- Birden fazla ağ arayüzü varsa doğru Wi-Fi IP'siyle başlat: `REACT_NATIVE_PACKAGER_HOSTNAME=192.168.1.10 npm start` (örnek IP'yi değiştir).

## AdMob test ve production geçişi

Test reklamı yalnızca Yaz sekmesindeki işlem türü listesinin sonunda görünür. Bir yazma/kopyalama/silme formuna girildiğinde, sekmeden çıkıldığında veya NFC işlemi sürerken reklam kaldırılır. UMP onayı reklam SDK'sından önce çalışır; onay ya da reklam yüklemesi hata verirse NFC işlevleri çalışmaya devam eder.

Production'a geçerken kod değiştirilmez. AdMob'daki Android uygulama ve banner kimliklerini EAS'in `production` ortamına eklemek yeterlidir:

```sh
npx eas-cli@20.0.0 env:create --environment production --name ADMOB_ANDROID_APP_ID --value "ca-app-pub-XXXXXXXXXXXXXXXX~YYYYYYYYYY" --visibility plaintext
npx eas-cli@20.0.0 env:create --environment production --name EXPO_PUBLIC_ADMOB_ANDROID_BANNER_UNIT_ID --value "ca-app-pub-XXXXXXXXXXXXXXXX/YYYYYYYYYY" --visibility plaintext
npx eas-cli@20.0.0 build --platform android --profile production
```

App ID `~`, banner ad unit ID ise `/` içerir. Bunlar gizli anahtar değildir ve uygulama paketinde görünür. Production profili bu iki değer eksik veya biçim olarak geçersizse build'i durdurur; test kimliğiyle mağaza build'i üretmez. iOS üretimi için eşdeğer `ADMOB_IOS_APP_ID` ve `EXPO_PUBLIC_ADMOB_IOS_BANNER_UNIT_ID` değişkenleri gerekir.

Gerçek reklama geçmeden önce AdMob konsolunda uygulamayı/paket kimliğini eşleştir, Privacy & messaging altında UMP mesajını yayınla ve Play Console'da uygulamanın reklam içerdiğini beyan et. Native App ID değiştiği için production build mutlaka yeni bir native binary olmalıdır; yalnızca OTA update yeterli değildir.

## Kodun yerleşimi

```text
App.js                     Uygulama durumu ve sekmeler arası geçiş
src/components/            Ortak ekran bileşenleri
src/screens/               Okuma, yazma ve ayarlar ekranları
src/hooks/useNfc.js         NFC işlemleri, oturum kapatma ve işlem durumu
src/nfc/records.js          NDEF kayıtlarını kopyalama için kodlama
src/i18n/translations.js    Türkçe ve İngilizce metinler
src/theme/                 Renkler ve ortak stiller
assets/icon.png            Uygulama ikonu
app.json                   Native uygulama ve eklenti ayarları
app.config.js              Test/production AdMob App ID ve native eklenti ayarları
eas.json                  EAS derleme profilleri
```

`android/`, `ios/`, `.expo/`, `dist/` ve `node_modules/` üretilen yerel dosyalardır; Git'e eklenmez. Native ayarların kaynağı `app.json` ve config plugin'lerdir. Kalıcı değişiklikleri üretilen Gradle veya manifest dosyalarında yapma.

## Kontroller

```sh
npm run format:check
npm run check:dependencies
npm run check:bundle
```

`check:bundle` Android JavaScript/Hermes paketini `dist/` içine üretir; APK derlemesi veya gerçek NFC donanım testi değildir. Kod biçimini düzenlemek için `npm run format` kullan.

Yerel Android derlemesi gerekirse JDK 17 ve Expo 56'nın istediği Android SDK/NDK araçları kurulduktan sonra `npm run android` kullanılabilir. Sadece native dosyaları üretmek için `npm run prebuild:android` çalıştır. iOS yerel derlemesi macOS/Xcode gerektirir.

## Mevcut sınırlar ve sürüm notları

- Dil ve tema seçimleri henüz kalıcı saklanmıyor.
- UID okuma akışı NFC-A kullanıyor; iOS ve farklı kart teknolojileri cihaz üzerinde ayrıca doğrulanmalı.
- URL, vCard ve MAC doğrulaması temel düzeyde. NFC açık/destekleniyor kontrolü ve işlem sırasında kullanıcı iptali ayrıca geliştirilecek.
- Expo 56'nın yeni mimarisi için NFC kütüphanesi `4.0.0-beta.8` sürümüne sabitlendi. Kütüphanenin 3.x serisi yalnızca eski mimariyi destekliyor. Beta bağımlılığı değiştirilirken gerçek cihazda okuma/yazma/kopyalama yeniden kontrol edilmeli.
- Uygulama ve paket sürümü `0.0.10` olarak birleştirildi. Android paket kimliği, Expo slug'ı ve EAS proje bağlantısı korundu.

## Kaynaklar

- [Expo 56 sürüm belgeleri](https://docs.expo.dev/versions/v56.0.0/)
- [Expo 56 geliştirme istemcisi](https://docs.expo.dev/versions/v56.0.0/sdk/dev-client/)
- [Geliştirme sürümünü kullanma](https://docs.expo.dev/develop/development-builds/use-development-builds/)
- [Native dosyaların üretilmesi](https://docs.expo.dev/workflow/continuous-native-generation/)
- [NFC kütüphanesi ve mimari desteği](https://github.com/revtel/react-native-nfc-manager)

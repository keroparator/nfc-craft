# NFC Craft: Google Play ve Ölçülü Reklamlandırma Araştırma Raporu

**Hedef kitle:** Uygulama sahibi ve geliştirici  
**Tarih:** 8 Eylül 2026  
**Öncelik:** Android ve Google Play; iOS ikinci aşama  
**İncelenen proje:** Expo SDK 56, React Native 0.85, `react-native-nfc-manager` 4.0.0-beta.8

## Yönetici özeti

Bu uygulama için en doğru başlangıç modeli, **Google AdMob + tek bir uyarlanabilir banner yerleşimi**dir. İlk sürümde app-open, ödüllü, native veya sık interstitial reklam kullanılması önerilmez. NFC Craft kısa süreli ve görev odaklı bir yardımcı uygulama olduğu için kullanıcı, NFC okuma/yazma sırasında kesintiye karşı özellikle hassastır. Reklam geliri uğruna çekirdek işlemin kesilmesi hem kullanıcı kaybı hem de yanlışlıkla tıklama ve politika riski yaratır.

Önerilen ilk sürüm:

- Reklam ağı: Google AdMob.
- Format: Yaz ekranındaki işlem türü seçim listesinin sonunda, içerikten net biçimde ayrılmış tek bir inline/adaptive banner.
- Gösterilmeyecek yerler: uygulama açılışı, NFC taraması, yazma/kopyalama/silme işlemi, form doldurma, hata mesajı ve uygulamadan çıkış.
- Gizlilik: Google UMP onayı tamamlanmadan Mobile Ads SDK başlatılmamalı ve reklam istenmemeli; Ayarlar ekranında gerektiğinde görünür bir "Gizlilik seçenekleri" girişi bulunmalı.
- İkinci aşama: Yeterli kullanım verisi varsa, ancak başarılı bir işlemin tamamen bitmesinden sonra, ilk iki oturum hariç, en az 4 başarılı işlemde bir, 15 dakika bekleme ve günde en fazla 2 gösterim sınırıyla interstitial denenebilir. Bu sınırlar Google'ın asgari politikası değil, NFC Craft için önerilen daha sıkı ürün kurallarıdır.
- Gelir beklentisi: Kullanıcı ve ülke dağılımı bilinmeden güvenilir gelir tahmini yapılamaz. Günlük gelir kabaca `günlük reklam gösterimi x gerçekleşen eCPM / 1000` ile izlenmelidir.

Google Play açısından proje teknik olarak iyi bir temele sahip: Expo 56, Android API 36 hedefler ve 31 Ağustos 2026'dan itibaren geçerli Play gereksinimini karşılar. Ancak ilk yüklemeden önce mevcut `com.anonymous.nfc_writer` paket kimliği değiştirilmelidir; paket kimliği Play'de benzersiz ve kalıcıdır. Ayrıca gizlilik politikası, geliştirici sitesi, app-ads.txt, UMP, Play Data safety beyanı ve NFC'siz cihaz davranışı tamamlanmadan üretim yayını önerilmez. [Expo SDK 56 referansı](https://docs.expo.dev/versions/v56.0.0/) ve [Google Play hedef API gereksinimi](https://support.google.com/googleplay/android-developer/answer/11926878?hl=en).

## 1. Kapsam ve varsayımlar

Bu rapor aşağıdaki soruları yanıtlar:

1. Google Play'e yayın için güncel adımlar ve riskler nelerdir?
2. Expo 56 tabanlı React Native uygulamasına AdMob nasıl eklenmelidir?
3. Reklamlar NFC Craft içinde nerede gösterilmeli ve nerede kesinlikle gösterilmemelidir?
4. Gizlilik, onay, Data safety ve reklam politikaları nasıl ele alınmalıdır?
5. iOS ikinci aşaması için şimdiden hangi kararlar korunmalıdır?

Varsayımlar:

- Uygulamanın bir sunucusu, kullanıcı hesabı veya bulut veri saklaması yoktur.
- NFC etiketi UID'si, ad, telefon, e-posta ve MAC adresi yalnızca cihazda işlenip NFC etiketine yazılır; geliştirici sunucusuna gönderilmez.
- Uygulama çocuklar için özel tasarlanmamıştır. Gerçek hedef kitle farklıysa Play Console beyanı buna göre değişmelidir.
- İlk pazar Türkiye olsa da uygulama Avrupa Ekonomik Alanı, Birleşik Krallık veya İsviçre'de de dağıtılabilir; bu nedenle UMP akışı baştan kurulmalıdır.
- Rapor hukuki görüş değildir. Politika ve SDK belgeleri 8 Eylül 2026 tarihinde kontrol edilmiştir.

## 2. Mevcut uygulamanın fotoğrafı

Kod incelemesine göre NFC Craft üç ana sekmeden oluşur: Oku, Yaz ve Ayarlar. Yaz sekmesinde kopyalama, web sitesi, kişi kartı, Bluetooth OOB ve veri silme işlemleri vardır. Proje Expo SDK 56.0.3, React Native 0.85.3 ve EAS Build kullanır. `eas.json` içinde production profilinde otomatik sürüm artırma açıktır.

Mevcut yapı reklam entegrasyonu için uygundur, çünkü proje zaten native NFC modülü nedeniyle development build kullanmaktadır. Google Mobile Ads paketi de native kod içerir ve Expo Go'da çalışmaz; config plugin eklendikten sonra yeni development build kurulmalıdır. [React Native Google Mobile Ads kurulum belgesi](https://docs.page/invertase/react-native-google-mobile-ads) ve [Expo development build belgesi](https://docs.expo.dev/develop/development-builds/use-development-builds/).

### Mevcut yayın hazırlığı denetimi

| Konu | Durum | Değerlendirme ve eylem |
|---|---|---|
| Android hedef API | Hazır | Expo 56 compile/target API 36 kullanır; 2026 Play şartını karşılar. |
| AAB üretimi | Hazır temel | Production EAS profili varsayılan olarak AAB üretir. |
| Paket kimliği | Kritik | `com.anonymous.nfc_writer` mağazaya yüklenmeden önce markalı ve kalıcı bir kimlikle değiştirilmeli. |
| AdMob SDK | Eksik | Paket, config plugin, App ID, ad unit ve UMP henüz yok. |
| Gizlilik politikası | Eksik | Uygulama içinde ve Play Console'da erişilebilir URL gerekir. |
| Geliştirici sitesi/app-ads.txt | Eksik | Yeni AdMob uygulamalarının tam reklam sunumu için gereklidir. |
| NFC cihaz uygunluğu | Riskli | Kütüphane NFC özelliğini `required=false` bildiriyor; uygulama NFC'siz cihazda anlamlı iş yapamıyor. Filtreleme veya düzgün desteklenmiyor ekranı gerekir. |
| İzin denetimi | Gerekli | Son production AAB'nin birleşik manifesti kontrol edilmeli; yalnızca gerekli izinler bırakılmalı. |
| Mağaza görselleri | Eksik | 1024x1024 kaynak ikon var; Play ikon, feature graphic ve ekran görüntüleri hazırlanmalı. |
| iOS kimliği | Eksik | `ios.bundleIdentifier` tanımlı değil; iOS ikinci aşamasında eklenecek. |
| Gerçek cihaz testi | Kritik | NFC bağımlılığı beta sürüm; okuma/yazma/kopyalama/silme ve reklam birlikte fiziksel cihazlarda test edilmeli. |

Android paket adı Google Play'de kalıcı olduğundan, ilk AAB yüklemeden önce örneğin `com.sirketiniz.nfccraft` benzeri sahip olunan alan adı tabanlı bir kimlik seçilmelidir. Google Play, paket adlarının benzersiz ve yeniden kullanılamaz olduğunu belirtir. [Play Console uygulama kurulum belgesi](https://support.google.com/googleplay/android-developer/answer/9859152?rd=1).

## 3. Reklam formatı kararı

| Format | NFC Craft uygunluğu | Karar | Gerekçe |
|---|---|---|---|
| Inline/adaptive banner | Yüksek | İlk sürümde kullan | Küçük, öngörülebilir ve içerik akışına gömülebilir. |
| Anchored global banner | Orta/düşük | İlk sürümde kullanma | Alt navigasyona veya ana butonlara yakınlık yanlışlıkla tıklama riski yaratır; her ekranda görünmesi uygulamayı reklamlı hissettirir. |
| Interstitial | Orta | İkinci aşamada sınırlı test | Yalnızca tamamlanmış işlem sonrası doğal mola noktasında uygun olabilir. |
| App open | Düşük | Kullanma | Kısa görevli utility uygulamasında açılış süresini ve güveni bozar. |
| Rewarded | Düşük | Şimdilik kullanma | Ödüllendirilecek doğal, kalıcı bir özellik yok; yapay bir teşvik olur. |
| Rewarded interstitial | Çok düşük | Kullanma | Kullanıcının NFC görevine katkı sağlamaz. |
| Native ad | Düşük | İlk sürümde kullanma | Yaz ekranındaki seçenek kartlarını taklit etme ve aldatıcı görünme riski taşır; ayrıca daha fazla tasarım/politika yükü vardır. |
| Collapsible banner | Düşük | Kullanma | İlk açılışta büyük yüzey kaplayabilir; "az reklam" hedefiyle uyuşmaz. |

Google banner rehberi, reklamı navigasyon ve diğer tıklanabilir öğelerden ayırmayı, yükleme sırasında içerik kaymasını önlemek için sabit alan ayırmayı ve uyarlanabilir banner kullanmayı önerir. Bannerı alt navigasyon ile içerik arasına sıkıştırmak özellikle sakıncalıdır. [Banner rehberi](https://support.google.com/admob/answer/6128877?hl=en), [önerilen banner uygulamaları](https://support.google.com/admob/answer/6275335?hl=en) ve [sakıncalı banner uygulamaları](https://support.google.com/admob/answer/6275345?hl=en).

Google Play, beklenmedik tam ekran reklamları ve kullanıcının beklediği eylem başlamadan önce gösterilen interstitial reklamları yasaklar. AdMob da interstitial reklamların görev ortasında değil, doğal geçişlerde gösterilmesini ve tekrar tekrar gösterilmemesini ister. [Google Play Ads politikası](https://support.google.com/googleplay/android-developer/answer/9857753?hl=en) ve [AdMob interstitial rehberi](https://support.google.com/admob/answer/6201362?hl=en).

## 4. NFC Craft için yerleşim planı

### 4.1 İlk sürüm: tek reklam yüzeyi

Önerilen tek yüzey, **Yaz sekmesindeki işlem türü listesinin en altıdır**. Reklam son seçenek kartından sonra gelir; seçenek kartı gibi görünmez, kendi sabit alanı vardır ve içerikten boşluk/ince ayırıcı ile ayrılır. Böylece reklam hiçbir zaman ana buton ile alt navigasyon arasına sıkışmaz.

Kurallar:

- Ekranda en fazla bir reklam alanı.
- Reklam alanı baştan ayrılır; reklam geç yüklenince kartlar veya butonlar yer değiştirmez.
- Reklam yüklenmezse boş alan tamamen kapanabilir, fakat kapanma kullanıcı tıklaması sırasında içerik sıçraması yaratmamalıdır.
- Banner, işlem türü kartlarıyla aynı tasarımı kullanmaz ve uygulama özelliği gibi etiketlenmez.
- NFC işlemi başlatıldığında veya form ekranına geçildiğinde banner unmount edilir.
- Tab değişimlerinde 60 saniyeden daha sık yeni reklam isteği yapılmaz. Google, reklamların en az 60 saniye kalmasını ve kısa aralıklı yeniden isteklerden kaçınılmasını önerir. [AdMob uygulama rehberi](https://support.google.com/admob/answer/2936217?hl=en).

Bu yerleşimin dezavantajı, yalnızca Oku özelliğini kullanan kişinin reklam görmemesidir. Bu bilinçli bir ödünleşimdir: ilk sürümün amacı maksimum gelir değil, düşük riskli bir gelir tabanı kurmak ve gerçek kullanıcı davranışını ölçmektir.

### 4.2 İkinci aşama: başarı sonrası sınırlı interstitial deneyi

Interstitial ancak aşağıdaki koşulların tümü sağlanırsa düşünülebilir:

1. NFC işlemi tamamlanmış ve native NFC oturumu kapatılmış olmalı.
2. Kullanıcı sonuç ekranını görmüş ve "Tamam" diyerek akışı bitirmiş olmalı.
3. Reklam önceden yüklenmiş olmalı; hazır değilse kullanıcı bekletilmeden devam edilmeli.
4. İlk iki uygulama oturumunda gösterilmemeli.
5. En az 4 başarılı işlemde bir, en az 15 dakika arayla ve günde en fazla 2 kez gösterilmeli.
6. Hata, iptal veya başarısız NFC işleminden sonra kesinlikle gösterilmemeli.
7. Aynı olayda hem banner hem interstitial gösterilmemeli.

Mevcut uygulama başarıyı `Alert` ile gösteriyor. Interstitial doğrudan Alert kapanışında açılırsa kullanıcıya peş peşe modal yüzeyler gösterilir. Daha iyi çözüm, ayrı ve sakin bir sonuç durumu eklemek, reklamı ancak kullanıcı bu durumu kapatıp ana menüye dönerken değerlendirmektir.

### 4.3 Kesinlikle reklam gösterilmeyecek anlar

- Uygulama splash veya ilk açılış anı.
- "Kart Oku", "Veriyi Yaz", "Kartı Temizle", "Kopyala" ve "Yapıştır" butonuna basıldıktan sonra sonuç gelene kadar.
- NFC kartın telefona yaklaştırılması istenirken.
- Ad, telefon, e-posta, URL veya MAC adresi girilirken.
- Hata, iptal ve izin/donanım desteklenmiyor durumunda.
- Alt navigasyona bitişik veya onun üzerinde.
- Uygulama arka plandayken ya da kullanıcı uygulamadan çıkarken.

## 5. Expo 56 ve React Native ile teknik entegrasyon

### 5.1 Önerilen paket

Önerilen çözüm `react-native-google-mobile-ads` paketidir. Paket Expo config plugin, Google Mobile Ads formatları ve UMP için `AdsConsent` arayüzü sunar. 8 Eylül 2026 itibarıyla npm'de güncel sürüm 16.5.0 olarak görünmektedir. Sürüm proje içinde semver aralığıyla başıboş bırakılmamalı; development build ve fiziksel cihaz testinden sonra tam sürüm sabitlenmelidir. [npm paket sayfası](https://www.npmjs.com/package/react-native-google-mobile-ads?activeTab=code) ve [kütüphane dokümantasyonu](https://docs.page/invertase/react-native-google-mobile-ads).

Kurulum komutları:

```sh
npx expo install react-native-google-mobile-ads expo-build-properties
npx eas build --platform android --profile development
```

İkinci komut zorunludur; paket native kod içerdiği için mevcut development APK bu modülü içermez. Expo, native paket veya app config değiştiğinde development build'in yeniden oluşturulmasını ister. [Expo development build FAQ](https://docs.expo.dev/develop/development-builds/faq/).

### 5.2 AdMob kimlikleri

İki tür kimlik birbirine karıştırılmamalıdır:

- **App ID:** `ca-app-pub-...~...` biçimindedir ve native uygulama yapılandırmasına girer.
- **Ad unit ID:** `ca-app-pub-.../...` biçimindedir ve banner/interstitial bileşenine verilir.

Android ve iOS için App ID'ler ayrıdır. Android öncelikli ilk aşamada yalnızca Android App ID yapılandırılabilir; iOS build alınmadan önce iOS App ID ve `ios.bundleIdentifier` eklenir.

Örnek `app.json` parçası:

```json
{
  "expo": {
    "plugins": [
      [
        "react-native-google-mobile-ads",
        {
          "androidAppId": "ca-app-pub-xxxxxxxxxxxxxxxx~yyyyyyyyyy"
        }
      ],
      [
        "expo-build-properties",
        {
          "android": {
            "extraProguardRules": "-keep class com.google.android.gms.internal.consent_sdk.** { *; }"
          }
        }
      ]
    ]
  }
}
```

Bu parça mevcut NFC, expo-dev-client ve expo-system-ui plugin'leriyle birleştirilmelidir; onların yerine geçmez. AdMob App ID eksik veya geçersizken build ya da uygulama açılışı başarısız olabilir. Kimlikler sır değildir, ancak development ve production yapılandırmalarının karışmaması için merkezi bir config dosyasından yönetilmelidir.

### 5.3 Onaydan başlatmaya doğru sıra

Önerilen başlatma akışı:

```text
Uygulama açılır
  -> UMP consent bilgisi güncellenir
  -> gerekiyorsa Google'ın consent formu gösterilir
  -> canRequestAds kontrol edilir
      -> false: uygulama reklamsız çalışır
      -> true: Mobile Ads SDK bir kez initialize edilir
          -> izin verilen ekranlarda reklam yüklenir
```

İskelet mantık:

```js
await AdsConsent.gatherConsent();
const { canRequestAds } = await AdsConsent.getConsentInfo();

if (canRequestAds) {
  await mobileAds().initialize();
  // Bundan sonra banner/interstitial yüklenebilir.
}
```

UMP bilgisi her uygulama açılışında güncellenmeli; onay sonucu uygulamanın kendi kalıcı depolamasına kopyalanmamalıdır. Google, `canRequestAds()` kontrolünü güncel consent sorgusundan sonra yapmayı ve gerekli olduğunda kullanıcıya gizlilik seçeneklerini tekrar açma noktası sunmayı ister. [Google UMP Android belgesi](https://developers.google.com/admob/android/privacy) ve [React Native UMP belgesi](https://docs.page/invertase/react-native-google-mobile-ads/european-user-consent).

Hata stratejisi "fail open for app, fail closed for ads" olmalıdır: onay veya reklam SDK'sı hata verirse NFC işlevi kesilmez, yalnızca reklam gösterilmez.

### 5.4 Banner uygulaması

Development ve test sürümlerinde Google'ın test kimlikleri kullanılmalıdır:

```js
const unitId = __DEV__ ? TestIds.ADAPTIVE_BANNER : ANDROID_BANNER_UNIT_ID;

<BannerAd
  unitId={unitId}
  size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
/>
```

Kullanılan `TestIds` sabitinin adı kurulan paket sürümünün tip tanımlarından doğrulanmalıdır. Üretim reklam kimliğiyle geliştirici cihazında reklama tıklamak geçersiz trafik riski yaratır. Google, demo ad unit veya test cihazı kullanılmasını açıkça önerir. [Google test ads belgesi](https://developers.google.com/admob/android/test-ads) ve [kütüphane reklam gösterme belgesi](https://docs.page/invertase/react-native-google-mobile-ads/displaying-ads).

Banner bileşeni `adsReady && allowedPlacement && !nfc.loading` koşuluyla oluşturulmalıdır. Reklam isteğine NFC UID, kişi adı, telefon, e-posta, URL, MAC adresi veya etiket içeriği hiçbir zaman keyword, custom targeting ya da user ID olarak verilmemelidir.

### 5.5 Interstitial yöneticisi

Interstitial doğrudan ekran bileşenlerine dağılmamalı; tek bir `AdManager` veya hook şu sorumlulukları üstlenmelidir:

- UMP sonrası tek sefer SDK başlatma.
- Test/production ad unit seçimi.
- Reklamı önceden yükleme ve kapandıktan sonra yenisini hazırlama.
- Oturum sayısı, başarılı işlem sayısı, son gösterim zamanı ve günlük sayaç kontrolü.
- NFC işlemi aktifken gösterimi kilitleme.
- Reklam hazır değilse ana akışı geciktirmeme.
- `onAdFailedToLoad`, `onAdFailedToShow`, `onAdClosed` olaylarını güvenli ele alma.

Sayaçların uygulama yeniden açıldığında sıfırlanmaması için yerel kalıcı depolama kullanılabilir. Bu sayaçlarda kullanıcı kimliği veya NFC verisi tutulmasına gerek yoktur.

## 6. Gizlilik, UMP ve Play Data safety

### 6.1 UMP/CMP

EEA, Birleşik Krallık ve İsviçre'de kişiselleştirilmiş reklam sunan AdMob yayıncıları Google sertifikalı ve IAB TCF ile entegre bir CMP kullanmalıdır. AdMob içindeki Google Privacy & messaging çözümü bu amaçla kullanılabilir; uygulamada UMP SDK uygulanmadıkça mesaj gösterilmez. [Google CMP yayıncı gereksinimi](https://support.google.com/admob/answer/13554116?hl=en) ve [Google CMP çalışma şekli](https://support.google.com/admob/answer/16918505?hl=en).

Uygulamanın Ayarlar ekranında, UMP `privacyOptionsRequirementStatus` gerekli gösteriyorsa "Gizlilik seçenekleri" satırı görünür olmalı ve `showPrivacyOptionsForm()` çağırmalıdır. Consent iptal edilebilirliği Google'ın program gereksinimidir. [Consent iptal bağlantısı rehberi](https://support.google.com/admob/answer/10113915?hl=en-GB).

### 6.2 Data safety için başlangıç matrisi

Google Mobile Ads SDK 25.4.0 belgesine göre SDK varsayılan olarak reklam, analiz ve sahtekarlık önleme amaçlarıyla şu verileri toplar/paylaşır:

| Veri | Play Data safety karşılığı | Not |
|---|---|---|
| IP adresi | Yaklaşık konum olarak değerlendirilebilir | IP genel konum tahmininde kullanılabilir. |
| Uygulama etkileşimleri | App interactions | Açılış, dokunma ve video görüntüleme gibi etkileşimler. |
| Tanılama | Diagnostics | Başlatma süresi, takılma ve enerji kullanımı gibi bilgiler. |
| Reklam/App Set/cihaz tanımlayıcıları | Device or other IDs | Android reklam kimliği varsayılan akışta bulunabilir. |

Bu veriler TLS ile aktarılır. Nihai Data safety cevapları, kullanılan SDK sürümü, UMP seçimi, kişiselleştirme ve gelecekte eklenen diğer SDK'ların tamamına göre tekrar doğrulanmalıdır; formun doğruluğundan uygulama geliştiricisi sorumludur. [Google Mobile Ads Play data disclosure](https://developers.google.com/admob/android/privacy/play-data-disclosure) ve [Play Data safety rehberi](https://support.google.com/googleplay/android-developer/answer/10787469?hl=en).

Android 13 ve üzerini hedefleyen uygulamalarda Google Mobile Ads SDK'nın manifesti `com.google.android.gms.permission.AD_ID` iznini birleşik manifeste ekleyebilir. Play Console'daki Advertising ID beyanı, final AAB'nin manifestiyle tutarlı olmalıdır. [Google Play Advertising ID belgesi](https://support.google.com/googleplay/android-developer/answer/6048248?hl=en).

NFC UID'si ve forma girilen kişi bilgileri gerçekten yalnızca cihazda işlenip etikete yazılıyor ve geliştiriciye/üçüncü tarafa gönderilmiyorsa Play, salt cihaz içi erişimi "collected" saymaz. Bununla birlikte uygulama gizlilik politikasında bu yerel işleme açıkça anlatılmalıdır. Reklam SDK'sı eklendiğinde artık "uygulama hiçbir veri toplamaz/paylaşmaz" beyanı yapılamaz. [Play Data safety tanımları](https://support.google.com/googleplay/android-developer/answer/10787469?hl=en-GB_ALL).

### 6.3 Gizlilik politikasında bulunması gerekenler

- Yayıncı kişi/şirket adı ve NFC Craft uygulama adı.
- NFC erişiminin amacı; okunan/yazılan verilerin geliştirici sunucusuna gönderilmediği açıklaması.
- Google Mobile Ads SDK'nın veri kategorileri, kullanım amaçları ve Google bağlantıları.
- Kişiselleştirilmiş, kişiselleştirilmemiş, limited/technical ads olasılıkları.
- UMP üzerinden onay verme, reddetme ve Ayarlar'dan tercihi değiştirme yöntemi.
- Saklama ve silme yaklaşımı; uygulamada hesap olmadığı ve NFC verisinin sunucuda tutulmadığı bilgisi.
- İletişim e-postası, yürürlük tarihi ve politika değişiklikleri.
- Çocuklara yönelik olmadığı beyanı, bu gerçek ürün hedefiyle uyumluysa.

Google Play, her uygulamanın Play Console'da ve uygulamanın içinde erişilebilir kapsamlı bir gizlilik politikası sunmasını ister. [Google Play User Data politikası](https://support.google.com/googleplay/android-developer/answer/10144311?hl=en).

### 6.4 Çocuk hedef kitlesi

NFC Craft işlevsel bir araç olduğu için makul varsayım çocuklara özel tasarlanmadığıdır. Play Console'da yalnızca gerçekten hedeflenen yaş grupları seçilmelidir. Çocuklar hedef kitleye dahil edilirse neutral age screen, yalnızca Families self-certified ads SDK sürümleri, çocuklara kişiselleştirilmemiş reklam ve ek veri kısıtları gerekir. Bu nedenle "her yaşa uygun" seçimi masum bir genişletme değildir. [Google Play Families politikası](https://support.google.com/googleplay/android-developer/answer/9893335?hl=en) ve [hedef kitle rehberi](https://support.google.com/googleplay/android-developer/answer/9867159?hl=en-GB).

## 7. Google Play ve AdMob yayın sırası

### Aşama A: Kimlik ve hesaplar

1. Play Console geliştirici hesabı açılır; tek seferlik kayıt ücreti 25 USD'dir. Kişisel veya organizasyon hesap türü doğru seçilir ve kimlik/iletişim bilgileri doğrulanır. [Play Console başlangıç belgesi](https://support.google.com/googleplay/android-developer/answer/6112435?hl=en).
2. Yeni kişisel hesaplarda fiziksel, root edilmemiş Android 10+ cihazla Play Console mobil uygulaması üzerinden cihaz doğrulaması gerekebilir. [Cihaz doğrulama gereksinimi](https://support.google.com/googleplay/android-developer/answer/14316361?hl=en).
3. AdMob hesabı açılır; ödeme profili doğru ülke, kişi/şirket adı ve posta alabilen gerçek adresle tamamlanır. AdMob hesabı ve ödeme profili onayı bazen iki haftaya kadar sürebilir. [AdMob başlangıç rehberi](https://support.google.com/admob/answer/15948559?hl=en).

### Aşama B: Uygulama kimliği ve web altyapısı

1. Markalı Android paket kimliği kesinleştirilir ve ilk Play yüklemesinden önce `app.json` içinde değiştirilir.
2. Bir geliştirici alan adı/sitesi hazırlanır. Mağaza kaydındaki Developer website bu alan adını göstermelidir.
3. `https://alanadiniz.com/app-ads.txt` dosyası, AdMob'un verdiği publisher satırıyla yayınlanır. Yeni AdMob uygulamaları app-ads.txt ile doğrulanmadan ve app readiness incelemesinden geçmeden tam reklam sunamaz. [app-ads.txt doğrulama](https://support.google.com/admob/answer/14538460?hl=en) ve [app-ads.txt kurulum](https://support.google.com/admob/answer/9363762?hl=en).
4. Gizlilik politikası aynı sitede herkese açık HTTPS URL olarak yayınlanır.

### Aşama C: AdMob geliştirme kurulumu

1. AdMob'da uygulama önce "unpublished" olarak eklenir.
2. Android App ID ve yalnızca ilk banner için bir ad unit oluşturulur.
3. AdMob Privacy & messaging bölümünde European regulations mesajı hazırlanır.
4. Paket/config plugin eklenir; UMP ve banner uygulanır.
5. Yalnızca test ad unit'leri ve test cihazlarıyla development build test edilir.
6. Final production AAB'de App ID ve production ad unit seçimi doğrulanır.

### Aşama D: Play Console içeriği

1. Play Console'da uygulama oluşturulur, ücretsiz/ücretli kararı verilir ve Play App Signing kabul edilir.
2. Store listing hazırlanır: ad, kısa açıklama, tam açıklama, kategori, iletişim e-postası, web sitesi, 512x512 ikon, 1024x500 feature graphic ve gerçek uygulama ekran görüntüleri.
3. App content tamamlanır: privacy policy, Ads = Yes, app access, target audience, content rating, Data safety ve Advertising ID beyanı.
4. Google Play'deki reklam ve uygulama yaş derecelendirmesiyle AdMob'daki maximum ad content rating uyumlu tutulur.

Google Play mağaza adı 30, kısa açıklama 80 ve tam açıklama 4000 karakterle sınırlıdır. Play ikonu 512x512 ve feature graphic zorunludur. [Play uygulama kurulum rehberi](https://support.google.com/googleplay/android-developer/answer/9859152?rd=1) ve [görsel varlık gereksinimleri](https://support.google.com/googleplay/android-developer/answer/9866151?hl=en).

### Aşama E: Test ve üretim

1. Production AAB oluşturulur:

```sh
npx eas build --platform android --profile production
```

2. İlk sürüm internal testing kanalına yüklenir. EAS Submit bunu yapabilir:

```sh
npx eas submit --platform android --profile production
```

3. Kişisel Play hesabı 13 Kasım 2023'ten sonra açıldıysa en az 12 test kullanıcısı kapalı teste katılmış olarak kesintisiz en az 14 gün kalmalıdır; sonra production erişimine başvurulur. [Yeni kişisel hesap test gereksinimi](https://support.google.com/googleplay/android-developer/answer/14151465?hl=en).
4. Production yayını tamamlanınca AdMob'da uygulama Google Play kaydına bağlanır, app-ads.txt doğrulaması istenir ve app readiness incelemesi beklenir. İnceleme genellikle birkaç gün sürer, ancak uzayabilir ve bu sırada reklam sunumu sınırlı olabilir. [AdMob app readiness](https://support.google.com/admob/answer/10564477?hl=en-GB).

EAS production profili varsayılan olarak Play'e uygun AAB üretir; APK doğrudan cihaz kurulumu içindir ve yeni Play uygulaması yayınlamak için kullanılmaz. [Expo AAB/APK belgesi](https://docs.expo.dev/build-reference/apk/) ve [EAS Android submit belgesi](https://docs.expo.dev/submit/android/).

## 8. Yayın öncesi test planı

### 8.1 Fonksiyon matrisi

En az şu kombinasyonlar fiziksel cihazda test edilmelidir:

- Android 7/8 seviyesinde desteklenen en eski cihaz, Android 13 ve Android 16.
- NFC var/açık, NFC var/kapalı ve NFC yok.
- İnternet var, yavaş, uçak modu ve reklam no-fill.
- EEA test coğrafyası, consent kabul, reddetme ve tekrar değiştirme.
- Açık/koyu/sistem tema; Türkçe/İngilizce.
- UID okuma, URL yazma, vCard, Bluetooth OOB, silme, kopyalama adım 1/2.
- Kart erken çekme, kilitli/uyumsuz/boş etiket ve kullanıcı iptali.
- Reklam yüklenirken sekme değiştirme, uygulamayı arka plana alma ve geri dönme.
- Her reklam kapanışı sonrası dokunmatik alanların ve NFC akışının çalışmaya devam etmesi.

### 8.2 Politika ve teknik QA

- Development ve closed testte production reklamına geliştirici tarafından tıklanmaz; test ads kullanılır.
- Final AAB'nin birleşik manifesti Play App Bundle Explorer veya APK Analyzer ile kontrol edilir.
- `NFC`, `INTERNET` ve gerekiyorsa `AD_ID` dışındaki izinler gerekçelendirilir; gereksiz olanlar Expo 56 `android.blockedPermissions` ile kaldırılır. [Expo 56 app config](https://docs.expo.dev/versions/v56.0.0/config/app/).
- Final build'de debug/dev launcher, test ad unit ve örnek AdMob App ID kalmadığı doğrulanır.
- Consent reddedildiğinde uygulama çalışır ve UMP'nin izin verdiği ad sunum modu dışında istek yapılmaz.
- Reklam alanı içerik üstüne binmez, içeriği sonradan kaydırmaz ve navigasyona bitişik değildir.
- Play Console Data safety, gizlilik politikası ve gerçek ağ trafiği tutarlıdır.

### 8.3 Başarı ölçütleri

İlk 2-4 haftada aşağıdaki metrikler izlenmelidir:

| Metrik | Amaç |
|---|---|
| NFC işlem başarı oranı | Reklam entegrasyonu çekirdek işlevi bozdu mu? |
| Crash/ANR oranı | Native reklam SDK ve NFC modülü birlikte kararlı mı? |
| Ads show/fill rate | Envanter gerçekten doluyor mu? |
| Impressions/session | Kullanıcı reklam bombardımanına maruz kalıyor mu? |
| Yanlışlıkla tıklama sinyalleri/CTR sıçraması | Yerleşim riskli mi? |
| D1/D7 retention ve oturum süresi | Reklam kullanıcı kaybettiriyor mu? |
| Gelir / 1000 oturum | Bannerın ürün değerine göre getirisi nedir? |

Başlangıç hedefi reklam gösterimini büyütmek değil, retention ve NFC başarı oranını koruyarak gelir elde etmektir. Yüksek CTR otomatik olarak iyi sonuç değildir; banner navigasyona yakınsa yanlışlıkla tıklamanın belirtisi olabilir.

## 9. iOS ikinci aşaması

iOS yayınında aşağıdaki ek işler gerekir:

- Benzersiz `ios.bundleIdentifier` ve ayrı iOS AdMob App ID.
- Apple Developer Program üyeliği; Expo belgeleri yıllık 99 USD üyelik gerektiğini belirtir. [Expo mağaza build rehberi](https://docs.expo.dev/deploy/build-project/).
- App Store Connect privacy policy URL ve App Privacy beyanında üçüncü taraf reklam SDK'sının verileri.
- Kullanıcıları uygulamalar/siteler arasında takip etmek veya IDFA'ya erişmek için AppTrackingTransparency izni; reddeden kullanıcı uygulamanın çekirdek özelliklerini kullanmaya devam etmelidir.
- `NSUserTrackingUsageDescription`, UMP/ATT sırası, SKAdNetwork girdileri ve kullanılan SDK'nın güncel privacy manifesti.
- Apple'ın güncel yaş derecelendirme soruları ve Xcode 26/iOS 26 SDK yükleme gereksinimi.

Apple, üçüncü taraf SDK'ların veri pratiklerinin App Privacy beyanına dahil edilmesini ister ve takip için ATT izni şarttır. [Apple App Privacy yönetimi](https://developer.apple.com/help/app-store-connect/manage-app-information/manage-app-privacy/), [Apple kullanıcı gizliliği ve ATT](https://developer.apple.com/app-store/user-privacy-and-data-use/) ve [Apple güncel yükleme gereksinimleri](https://developer.apple.com/news/upcoming-requirements/).

Expo 56'nın minimum iOS sürümü 16.4 ve Xcode gereksinimi 26.4+ olduğundan eski iPhone desteği sınırlıdır. Android reklam entegrasyonu yapılırken iOS App ID olmadan iOS build denenmemeli; iOS için ayrı cihaz/TestFlight QA planlanmalıdır.

## 10. Önerilen iş sırası

### P0 - Mağaza ve reklam temelini hazırla

1. Kalıcı Android paket kimliğine karar ver.
2. Play Console ve AdMob hesaplarını, ödeme ve kimlik bilgilerini doğru biçimde oluştur.
3. Geliştirici sitesi, gizlilik politikası ve app-ads.txt altyapısını hazırla.
4. NFC'siz/NFC kapalı cihaz davranışını düzelt; Android'de NFC gerekliliğini filtreleme veya açıklayıcı ekran yaklaşımıyla netleştir.
5. `react-native-google-mobile-ads` 16.5.0 için ayrı bir development build spike'ı yap; banner + UMP + NFC birlikte test edildikten sonra sürümü sabitle.

### P1 - İlk mağaza sürümü

1. Yaz seçim ekranına tek adaptive banner ekle.
2. Ayarlar'a Gizlilik Politikası ve gerektiğinde Gizlilik Seçenekleri girişlerini ekle.
3. Data safety/Ads/Advertising ID/target audience/content rating beyanlarını tamamla.
4. TR ve EN mağaza metinleri, ikon, feature graphic ve ekran görüntülerini hazırla.
5. Internal test, kapalı test ve gerçek cihaz test matrisini tamamla.

### P2 - Ölçüme dayalı optimizasyon

1. 2-4 hafta banner verisi topla.
2. Retention ve NFC başarı oranı etkilenmiyorsa başarı sonrası, sert sıklık sınırlı interstitial A/B testi yap.
3. Gelir düşük, rahatsızlık yüksekse interstitialı iptal et; uygulamayı reklamsız kullanma için tek seferlik satın alma seçeneğini ayrıca değerlendir.
4. iOS App Store hazırlığını başlat.

## 11. Son karar

NFC Craft için "çok reklam" değil, **işlem güvenini bozmayan doğru reklam anı** değerlidir. İlk Play Store sürümünde tek inline/adaptive banner yeterlidir. Tam ekran reklamı ilk günden eklemek, özellikle NFC kartı eldeyken kullanıcıyı kesmek, ürün karakterine aykırıdır ve politika riskini artırır.

En önemli yayın bağımlılıkları reklam kodundan önce gelir: kalıcı paket adı, geliştirici sitesi, gizlilik politikası, app-ads.txt, UMP ve doğru Play beyanları. Bunlar tamamlandığında Expo 56 + EAS mevcut yapısı Play Store için teknik olarak uygun bir temel sağlar.

## Kaynak seçkisi

- Expo. "Expo SDK reference - 56.0.0", son güncelleme 29 Temmuz 2026. https://docs.expo.dev/versions/v56.0.0/
- Expo. "app.json / app.config.js - SDK 56". https://docs.expo.dev/versions/v56.0.0/config/app/
- Expo. "Submit to the Google Play Store with EAS Submit", son güncelleme 21 Temmuz 2026. https://docs.expo.dev/submit/android/
- Invertase. "React Native Google Mobile Ads". https://docs.page/invertase/react-native-google-mobile-ads
- Invertase. "European User Consent". https://docs.page/invertase/react-native-google-mobile-ads/european-user-consent
- Google for Developers. "Set up UMP SDK - Android", erişim 8 Eylül 2026. https://developers.google.com/admob/android/privacy
- Google for Developers. "Google Play data disclosure", son güncelleme 3 Eylül 2026. https://developers.google.com/admob/android/privacy/play-data-disclosure
- Google Play. "Target API level requirements", erişim 8 Eylül 2026. https://support.google.com/googleplay/android-developer/answer/11926878?hl=en
- Google Play. "Ads", erişim 8 Eylül 2026. https://support.google.com/googleplay/android-developer/answer/9857753?hl=en
- Google Play. "App testing requirements for new personal developer accounts", erişim 8 Eylül 2026. https://support.google.com/googleplay/android-developer/answer/14151465?hl=en
- Google AdMob. "Verify your app with app-ads.txt", erişim 8 Eylül 2026. https://support.google.com/admob/answer/14538460?hl=en
- Google AdMob. "Banner ad guidance", erişim 8 Eylül 2026. https://support.google.com/admob/answer/6128877?hl=en
- Google AdMob. "Disallowed interstitial implementations", erişim 8 Eylül 2026. https://support.google.com/admob/answer/6201362?hl=en
- Apple. "App Review Guidelines", erişim 8 Eylül 2026. https://developer.apple.com/app-store/review/guidelines/
- Apple. "Manage app privacy", erişim 8 Eylül 2026. https://developer.apple.com/help/app-store-connect/manage-app-information/manage-app-privacy/

## Araştırma sınırlamaları

- AdMob eCPM, fill rate ve gelir; ülke, kullanıcı profili, reklam formatı, mevsim ve açık artırma talebine göre değişir. Bu nedenle dışarıdan bir gelir rakamı uydurulmamıştır.
- Play Console ve AdMob ekranları hesap türüne, ülkeye ve kademeli ürün değişikliklerine göre farklı görünebilir.
- Data safety önerisi, mevcut kod ve Google Mobile Ads SDK'nın yayınlanmış veri açıklamasına dayanır; final AAB ve gerçek ağ trafiğiyle doğrulanmalıdır.
- Uygulamanın mağaza hesabı, AdMob hesabı, site alan adı ve gerçek kullanıcı verisi görülmemiştir.

<!-- CLAIM_LEDGER_START -->
## İç claim-to-source defteri

| İddia | Kaynak | Yayıncı/tarih | Güven | Not |
|---|---|---|---|---|
| Expo 56 target API 36 kullanır | https://docs.expo.dev/versions/v56.0.0/ | Expo, 29.07.2026 | Yüksek | Sürümle birebir eşleşiyor. |
| 31.08.2026 sonrası yeni uygulamalar API 36 hedeflemeli | https://support.google.com/googleplay/android-developer/answer/11926878 | Google Play, erişim 08.09.2026 | Yüksek | Güncel politika. |
| Yeni kişisel hesap: 12 tester/14 gün | https://support.google.com/googleplay/android-developer/answer/14151465 | Google Play, erişim 08.09.2026 | Yüksek | Hesap tarihine bağlı koşul raporda korunuyor. |
| AdMob Expo Go'da çalışmaz, rebuild gerekir | https://docs.page/invertase/react-native-google-mobile-ads | Invertase, erişim 08.09.2026 | Yüksek | Paket birincil dokümanı. |
| UMP her açılışta güncellenmeli, canRequestAds kontrol edilmeli | https://developers.google.com/admob/android/privacy | Google, 2026 | Yüksek | Native birincil doküman ve wrapper dokümanı uyumlu. |
| App-ads.txt yeni AdMob uygulamalarında doğrulama için zorunlu | https://support.google.com/admob/answer/14538460 | Google AdMob, erişim 08.09.2026 | Yüksek | Ocak 2025 sonrası gereksinim. |
| GMA SDK veri kategorileri | https://developers.google.com/admob/android/privacy/play-data-disclosure | Google, 03.09.2026 | Yüksek | GMA 25.4.0 kapsamı; wrapper 16.5.0 native SDK sürümü finalde doğrulanmalı. |
| Banner navigasyondan ayrılmalı ve sabit alan kullanmalı | https://support.google.com/admob/answer/6275335 | Google AdMob, erişim 08.09.2026 | Yüksek | Yerleşim kararının temel kaynağı. |
| Beklenmedik interstitial yasak | https://support.google.com/googleplay/android-developer/answer/9857753 | Google Play, erişim 08.09.2026 | Yüksek | Play ve AdMob belgeleri birbiriyle uyumlu. |
| NFC yerel verisi off-device gönderilmiyorsa collected sayılmaz | https://support.google.com/googleplay/android-developer/answer/10787469 | Google Play, erişim 08.09.2026 | Yüksek | Reklam SDK verileri ayrı beyan edilmelidir. |
| iOS ATT gerekir | https://developer.apple.com/app-store/user-privacy-and-data-use/ | Apple, erişim 08.09.2026 | Yüksek | Takip/IDFA koşuluyla ifade edildi. |

Araştırma sonlandırma nedeni: Teknik entegrasyon, Play yayın akışı, reklam yerleşimi, UMP/Data safety, app-ads.txt ve iOS hazırlığı için bütün kritik iddialar birincil kaynaklarla desteklendi; kalan belirsizlikler yalnızca hesap/ülke/gerçek trafik ve final build'e bağlıdır.

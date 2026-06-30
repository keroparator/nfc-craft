// =================================================================================
// NFC CRAFT — ANA UYGULAMA DOSYASI
// =================================================================================
// Bu dosya tek bir ekrandan oluşan bir NFC okuma/yazma uygulamasını içerir.
// Dosyanın genel akışı yukarıdan aşağıya şu şekildedir:
//   1) Dış kütüphane importları ve NFC donanımının başlatılması
//   2) Açık/Koyu tema renk paletleri (lightColors / darkColors)
//   3) Çeviri sözlüğü (translations) — Türkçe ve İngilizce metinler
//   4) App bileşeni: state tanımları, NFC işlemleri, ekran (render) fonksiyonları
//   5) Tema ile birlikte değişen StyleSheet (getStyles fonksiyonu)
// Bir şey ararken bu sıralamayı takip edebilirsin.
// =================================================================================

import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
  ScrollView,
  SafeAreaView,
  Platform,
  StatusBar,
  useColorScheme,
} from 'react-native';
import NfcManager, { NfcTech, Ndef } from 'react-native-nfc-manager';

// Uygulama açılır açılmaz NFC donanım katmanını ayağa kaldırıyoruz.
NfcManager.start();

// =================================================================================
// TEMA RENKLERİ
// =================================================================================
// Sabit bir COLORS objesi yerine, telefonun sistem temasına (açık/koyu) göre
// seçilecek iki ayrı renk paleti tanımlıyoruz. Bileşen içinde useColorScheme()
// ile hangi paletin kullanılacağına karar veriyoruz.

const lightColors = {
  background: '#f8f9ff',
  surface: '#ffffff',
  surfaceVariant: '#d3e4fe',
  surfaceContainerLowest: '#ffffff',
  onSurface: '#0b1c30',
  onSurfaceVariant: '#434655',
  primary: '#004ac6',
  onPrimary: '#ffffff',
  primaryContainer: '#2563eb',
  onPrimaryContainer: '#eeefff',
  outlineVariant: '#c3c6d7',
  error: '#ba1a1a',
};

const darkColors = {
  background: '#0b1420',
  surface: '#11233a',
  surfaceVariant: '#1f3a5f',
  surfaceContainerLowest: '#16263c',
  onSurface: '#eef1f8',
  onSurfaceVariant: '#aab2c5',
  primary: '#7da9ff',
  onPrimary: '#06182f',
  primaryContainer: '#2563eb',
  onPrimaryContainer: '#eeefff',
  outlineVariant: '#33415a',
  error: '#ff6b6b',
};

// =================================================================================
// ÇEVİRİ SÖZLÜĞÜ
// =================================================================================
// Arayüzdeki ve Alert kutularındaki tüm metinler burada anahtar (key) bazlı olarak
// tutulur. Dinamik bir değer (örn. kart UID'si) gereken metinler fonksiyon olarak
// tanımlanır; diğerleri düz string'dir. Bileşen içindeki t() yardımcı fonksiyonu
// aktif dile göre doğru metni döndürür.

const translations = {
  tr: {
    readTabTitle: 'NFC Oku',
    writeTabTitle: 'NFC Yaz',
    statusLabel: 'DURUM',

    waitingForScan: 'Tarama için bekleniyor...',
    readingMode: 'Okuma modunda, kartı yaklaştırın...',
    cardCapturedTitle: 'Kart Yakalandı!',
    cardCapturedMsg: (uid) => `UID: ${uid}`,
    readCancelled: 'Okuma iptal edildi.',
    scanPrompt: 'NFC taramasını başlatmak için tıklayın.',
    readButton: 'Kart Oku',

    writeOptionsPrompt: 'Yazmak istediğiniz verinin tipini seçin.',
    copyTitle: '📋 Kopyala',
    copyDesc: 'Bir karttaki veriyi okuyup başka bir karta birebir kopyalar.',
    websiteTitle: '🌐 Web Sitesi',
    websiteDesc: 'Okutulduğunda otomatik olarak web sitesine gider.',
    contactTitle: '👤 Kişi Kartı',
    contactDesc: 'Okutulduğunda kişiyi rehbere kaydeder.',
    bluetoothTitle: '🎧 Bluetooth',
    bluetoothDesc: 'Okutulduğunda bluetooth cihazınızı otomatik olarak eşler.',
    eraseTitle: '🗑️ Veri Sil',
    eraseDesc: 'Kartın içindeki mevcut tüm NDEF verilerini temizler.',

    eraseHeaderTitle: 'Veri Silme',
    copyHeaderTitle: 'Kart Kopyalama',
    dataEntryHeaderTitle: 'Veri Girişi',

    eraseButton: 'Kartı Temizle',
    writeButton: 'Veriyi Yaz',
    copyStep1Button: 'Kartı Oku ve Kopyala',
    copyStep2Button: 'Hafızadakini Yapıştır',
    cancelButton: 'İptal',

    websiteLabel: 'Web Sitesi Linki',
    nameLabel: 'Ad Soyad',
    phoneLabel: 'Telefon Numarası',
    emailLabel: 'E-posta Adresi',
    macLabel: 'MAC Adresi',
    placeholderEmail: 'ornek@mail.com',

    eraseInfo: 'Kartın içeriğini kalıcı olarak silmek için telefonu karta yaklaştırıp aşağıdaki butona basın.',
    copyStep1Info: 'Adım 1: Kopyalamak istediğiniz veriyi içeren kartı telefonunuza yaklaştırın ve aşağıdaki butona basın. Veri okunarak hafızaya alınacaktır.',
    copyStep2Info: 'Adım 2: Veri başarıyla hafızaya alındı! Şimdi verinin yazılacağı yeni kartı telefonunuza yaklaştırın ve aşağıdaki butona basarak veriyi yapıştırın.',

    errorTitle: 'Hata',
    urlEmptyError: 'Link alanı boş bırakılamaz!',
    contactRequiredError: 'İsim ve Telefon alanları zorunludur!',
    macInvalidError: 'Geçerli bir MAC adresi girin (örn: 00:11:22:33:44:55)',
    writeGenericError: 'Kartı erken çekmiş olabilirsin veya bu kart desteklenmiyor.',
    noDataError: 'Bu kartta kopyalanabilecek bir veri (NDEF) bulunamadı veya kart boş.',
    copyReadError: 'Kart okunamadı veya erken çektiniz. Kartın NDEF formatlı olduğundan emin olun.',
    encodeError: 'Kopyalanan veri yazılabilir formata dönüştürülemedi. Lütfen tekrar kopyalamayı deneyin.',
    copyWriteError: 'Yazma başarısız. Kartı erken çekmiş olabilirsin veya kart kilitli olabilir.',

    successTitle: 'Başarılı!',
    eraseSuccessMsg: 'Kart başarıyla temizlendi.',
    writeSuccessMsg: 'Veri karta başarıyla yazıldı.',
    copySavedTitle: 'Hafızaya Alındı!',
    copySavedMsg: 'Veri kopyalandı. Şimdi verinin yazılacağı (yapıştırılacağı) kartı yaklaştırın.',
    copyWriteSuccessMsg: 'Hafızadaki veri yeni karta başarıyla yazıldı.',

    eraseModeStatus: 'Silme modunda, kartı yaklaştırın...',
    writeModeStatus: 'Yazma modunda, kartı yaklaştırın...',
    eraseSuccessStatus: 'Silme Başarılı!',
    writeSuccessStatus: 'Yazma Başarılı!',
    eraseFailStatus: 'Silme başarısız.',
    writeFailStatus: 'Yazma başarısız.',
    copyStep1ReadingStatus: 'Kaynak kartı okumak için yaklaştırın...',
    copyDataWaitingStatus: 'Veri hafızada bekliyor.',
    noDataStatus: 'Veri bulunamadı.',
    copyReadFailStatus: 'Okuma başarısız.',
    copyStep2WritingStatus: 'Hedef kartı yazmak için yaklaştırın...',
    copyCompleteStatus: 'Kopyalama Tamamlandı!',

    navRead: 'Oku',
    navWrite: 'Yaz',
  },

  en: {
    readTabTitle: 'NFC Read',
    writeTabTitle: 'NFC Write',
    statusLabel: 'STATUS',

    waitingForScan: 'Waiting for scan...',
    readingMode: 'Reading mode, bring the card closer...',
    cardCapturedTitle: 'Card Captured!',
    cardCapturedMsg: (uid) => `UID: ${uid}`,
    readCancelled: 'Reading cancelled.',
    scanPrompt: 'Tap the button to start the NFC scan.',
    readButton: 'Scan Card',

    writeOptionsPrompt: 'Select the type of data you want to write.',
    copyTitle: '📋 Copy',
    copyDesc: 'Reads data from one card and copies it identically to another card.',
    websiteTitle: '🌐 Website',
    websiteDesc: 'Automatically opens the website when scanned.',
    contactTitle: '👤 Contact Card',
    contactDesc: 'Saves the contact to the address book when scanned.',
    bluetoothTitle: '🎧 Bluetooth',
    bluetoothDesc: 'Automatically pairs your bluetooth device when scanned.',
    eraseTitle: '🗑️ Erase Data',
    eraseDesc: 'Clears all existing NDEF data currently on the card.',

    eraseHeaderTitle: 'Erase Data',
    copyHeaderTitle: 'Card Copying',
    dataEntryHeaderTitle: 'Data Entry',

    eraseButton: 'Clear Card',
    writeButton: 'Write Data',
    copyStep1Button: 'Read and Copy Card',
    copyStep2Button: 'Paste From Memory',
    cancelButton: 'Cancel',

    websiteLabel: 'Website Link',
    nameLabel: 'Full Name',
    phoneLabel: 'Phone Number',
    emailLabel: 'Email Address',
    macLabel: 'MAC Address',
    placeholderEmail: 'example@mail.com',

    eraseInfo: 'Bring the phone close to the card and press the button below to permanently erase its content.',
    copyStep1Info: 'Step 1: Bring the card containing the data you want to copy close to your phone and press the button below. The data will be read and stored in memory.',
    copyStep2Info: 'Step 2: The data was stored successfully! Now bring the new card you want to write to close to your phone and press the button below to paste the data.',

    errorTitle: 'Error',
    urlEmptyError: 'The link field cannot be left empty!',
    contactRequiredError: 'Name and phone number fields are required!',
    macInvalidError: 'Enter a valid MAC address (e.g. 00:11:22:33:44:55)',
    writeGenericError: 'You may have removed the card too soon, or this card is not supported.',
    noDataError: 'No copyable data (NDEF) was found on this card, or the card is empty.',
    copyReadError: 'The card could not be read or was removed too soon. Make sure the card is NDEF formatted.',
    encodeError: 'The copied data could not be converted to a writable format. Please try copying again.',
    copyWriteError: 'Writing failed. You may have removed the card too soon, or it might be locked.',

    successTitle: 'Success!',
    eraseSuccessMsg: 'The card was cleared successfully.',
    writeSuccessMsg: 'The data was written to the card successfully.',
    copySavedTitle: 'Saved to Memory!',
    copySavedMsg: 'The data was copied. Now bring the card you want to write (paste) it to close to your phone.',
    copyWriteSuccessMsg: 'The data in memory was written to the new card successfully.',

    eraseModeStatus: 'Erase mode, bring the card closer...',
    writeModeStatus: 'Write mode, bring the card closer...',
    eraseSuccessStatus: 'Erase successful!',
    writeSuccessStatus: 'Write successful!',
    eraseFailStatus: 'Erase failed.',
    writeFailStatus: 'Write failed.',
    copyStep1ReadingStatus: 'Bring the source card closer to read it...',
    copyDataWaitingStatus: 'Data is waiting in memory.',
    noDataStatus: 'No data found.',
    copyReadFailStatus: 'Reading failed.',
    copyStep2WritingStatus: 'Bring the target card closer to write it...',
    copyCompleteStatus: 'Copy complete!',

    navRead: 'Read',
    navWrite: 'Write',
  },
};

// =================================================================================
// ANA BİLEŞEN
// =================================================================================
export default function App() {
  // --- TEMA: telefonun sistem ayarına göre açık/koyu palet seçimi ---
  const colorScheme = useColorScheme();
  const colors = colorScheme === 'dark' ? darkColors : lightColors;
  // colors değişmediği sürece StyleSheet'i tekrar tekrar oluşturmuyoruz.
  const styles = useMemo(() => getStyles(colors), [colors]);

  // --- DİL: aktif dil state'i ve metin okuma yardımcı fonksiyonu ---
  const [language, setLanguage] = useState('tr');
  const t = (key, ...args) => {
    const entry = translations[language][key];
    return typeof entry === 'function' ? entry(...args) : entry;
  };
  const toggleLanguage = () => setLanguage((prev) => (prev === 'tr' ? 'en' : 'tr'));

  // --- NFC OKUMA / YAZMA AKIŞINA AİT TEMEL STATE'LER ---
  const [loading, setLoading] = useState(false);
  const [cardId, setCardId] = useState(translations.tr.waitingForScan);
  const [writeMode, setWriteMode] = useState('NONE'); // NONE | WEBSITE | CONTACT | BLUETOOTH | ERASE | COPY
  const [url, setUrl] = useState('https://google.com');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [macAddress, setMacAddress] = useState('');

  // --- ALT MENÜ (BOTTOM NAV) STATE'İ ---
  const [activeTab, setActiveTab] = useState('READ'); // READ | WRITE

  // --- KART KOPYALAMA AKIŞINA AİT STATE'LER ---
  const [copyStep, setCopyStep] = useState(1); // 1: kaynağı oku, 2: hedefe yaz
  const [copiedRecords, setCopiedRecords] = useState(null);

  // ===============================================================================
  // NFC İŞLEMLERİ
  // ===============================================================================

  // Tek bir kartı okuyup UID'sini ekrana basan en temel okuma fonksiyonu.
  async function startNfcScan() {
    try {
      setLoading(true);
      setCardId(t('readingMode'));
      await NfcManager.requestTechnology([NfcTech.NfcA]);
      const tag = await NfcManager.getTag();
      setCardId(tag.id);
      Alert.alert(t('cardCapturedTitle'), t('cardCapturedMsg', tag.id));
    } catch (ex) {
      console.warn(ex);
      setCardId(t('readCancelled'));
    } finally {
      NfcManager.cancelTechnologyRequest();
      setLoading(false);
    }
  }

  // writeMode değerine göre karta NDEF verisi yazar veya kartı temizler.
  async function writeNfcData() {
    let bytes = null;

    try {
      setLoading(true);
      setCardId(writeMode === 'ERASE' ? t('eraseModeStatus') : t('writeModeStatus'));

      if (writeMode === 'WEBSITE') {
        if (!url) {
          Alert.alert(t('errorTitle'), t('urlEmptyError'));
          setLoading(false);
          return;
        }
        await NfcManager.requestTechnology([NfcTech.Ndef]);
        bytes = Ndef.encodeMessage([Ndef.uriRecord(url)]);

      } else if (writeMode === 'CONTACT') {
        if (!name || !phone) {
          Alert.alert(t('errorTitle'), t('contactRequiredError'));
          setLoading(false);
          return;
        }
        const vCardData = `BEGIN:VCARD\nVERSION:3.0\nN:;${name};;;\nFN:${name}\nTEL;CELL:${phone}\nEMAIL:${email}\nEND:VCARD`;
        await NfcManager.requestTechnology([NfcTech.Ndef]);
        bytes = Ndef.encodeMessage([
          Ndef.mimeMediaRecord('text/vcard', vCardData),
        ]);

      } else if (writeMode === 'BLUETOOTH') {
        if (!macAddress || !macAddress.includes(':')) {
          Alert.alert(t('errorTitle'), t('macInvalidError'));
          setLoading(false);
          return;
        }
        await NfcManager.requestTechnology([NfcTech.Ndef]);

        const macBytes = macAddress.split(':').reverse().map((hex) => parseInt(hex, 16));
        const payload = [0x08, 0x00, ...macBytes];

        bytes = Ndef.encodeMessage([
          Ndef.mimeMediaRecord('application/vnd.bluetooth.ep.oob', payload),
        ]);

      } else if (writeMode === 'ERASE') {
        await NfcManager.requestTechnology([NfcTech.Ndef]);
        // Boş bir NDEF mesajı yazarak kartı pratikte sıfırlamış oluyoruz.
        bytes = [0xd0, 0x00, 0x00];
      }

      if (bytes !== null) {
        await NfcManager.ndefHandler.writeNdefMessage(bytes);
        Alert.alert(t('successTitle'), writeMode === 'ERASE' ? t('eraseSuccessMsg') : t('writeSuccessMsg'));
        setCardId(writeMode === 'ERASE' ? t('eraseSuccessStatus') : t('writeSuccessStatus'));
        setWriteMode('NONE');
      }
    } catch (ex) {
      console.warn('NFC İşlem Hatası:', ex);
      Alert.alert(t('errorTitle'), t('writeGenericError'));
      setCardId(writeMode === 'ERASE' ? t('eraseFailStatus') : t('writeFailStatus'));
    } finally {
      NfcManager.cancelTechnologyRequest();
      setLoading(false);
    }
  }

  // Kopyalama akışının 1. adımı: kaynak karttaki NDEF verisini okuyup hafızaya alır.
  async function handleCopyStep1() {
    try {
      setLoading(true);
      setCardId(t('copyStep1ReadingStatus'));
      await NfcManager.requestTechnology([NfcTech.Ndef]);
      const tag = await NfcManager.getTag();

      if (tag && tag.ndefMessage && tag.ndefMessage.length > 0) {
        setCopiedRecords(tag.ndefMessage);
        Alert.alert(t('copySavedTitle'), t('copySavedMsg'));
        setCopyStep(2);
        setCardId(t('copyDataWaitingStatus'));
      } else {
        Alert.alert(t('errorTitle'), t('noDataError'));
        setCardId(t('noDataStatus'));
      }
    } catch (ex) {
      console.warn('Kopyalama (Okuma) Hatası:', ex);
      Alert.alert(t('errorTitle'), t('copyReadError'));
      setCardId(t('copyReadFailStatus'));
    } finally {
      NfcManager.cancelTechnologyRequest();
      setLoading(false);
    }
  }

  // Kopyalama akışının 2. adımı: hafızadaki veriyi hedef karta yazar.
  async function handleCopyStep2() {
    try {
      setLoading(true);
      setCardId(t('copyStep2WritingStatus'));
      await NfcManager.requestTechnology([NfcTech.Ndef]);

      if (copiedRecords) {
        let bytes = null;
        try {
          // tag.ndefMessage Uint8Array dönebilir, Ndef.encodeMessage ise saf Array
          // bekler; bu yüzden her alanı normal diziye çeviriyoruz.
          const formattedRecords = copiedRecords.map((record) => ({
            tnf: record.tnf,
            type: record.type ? Array.from(record.type) : [],
            id: record.id ? Array.from(record.id) : [],
            payload: record.payload ? Array.from(record.payload) : [],
          }));

          bytes = Ndef.encodeMessage(formattedRecords);
        } catch (e) {
          console.warn('Veri Encode Hatası:', e);
          Alert.alert(t('errorTitle'), t('encodeError'));
          setLoading(false);
          NfcManager.cancelTechnologyRequest();
          return;
        }

        await NfcManager.ndefHandler.writeNdefMessage(bytes);
        Alert.alert(t('successTitle'), t('copyWriteSuccessMsg'));
        setCardId(t('copyCompleteStatus'));

        // İşlem bitince hafızayı sıfırlayıp menüye dönüyoruz.
        setCopiedRecords(null);
        setCopyStep(1);
        setWriteMode('NONE');
      }
    } catch (ex) {
      console.warn('Kopyalama (Yazma) Hatası:', ex);
      Alert.alert(t('errorTitle'), t('copyWriteError'));
      setCardId(t('writeFailStatus'));
    } finally {
      NfcManager.cancelTechnologyRequest();
      setLoading(false);
    }
  }

  // ===============================================================================
  // EKRAN (RENDER) YARDIMCILARI
  // ===============================================================================
  // Her ekranı ayrı bir fonksiyona bölerek ana return bloğunu sade tutuyoruz.

  // Sayfa başlığı ile birlikte sağ üstte dil değiştirme butonunu gösteren ortak başlık.
  const renderHeader = (title) => (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>{title}</Text>
      <TouchableOpacity style={styles.langToggle} onPress={toggleLanguage}>
        <Text style={styles.langToggleText}>{language === 'tr' ? 'EN' : 'TR'}</Text>
      </TouchableOpacity>
    </View>
  );

  // "Oku" sekmesi: tek dokunuşla NFC taraması başlatan basit ekran.
  const renderReadTab = () => (
    <View style={styles.tabContainer}>
      {renderHeader(t('readTabTitle'))}
      <View style={styles.readContent}>
        <View style={styles.nfcIconPlaceholder}>
          <Text style={{ fontSize: 64 }}>📡</Text>
        </View>
        <Text style={styles.descriptionText}>{t('scanPrompt')}</Text>

        <TouchableOpacity style={styles.primaryButton} onPress={startNfcScan} disabled={loading}>
          {loading ? <ActivityIndicator color={colors.onPrimary} /> : <Text style={styles.primaryButtonText}>{t('readButton')}</Text>}
        </TouchableOpacity>

        <View style={styles.statusCard}>
          <Text style={styles.statusLabel}>{t('statusLabel')}</Text>
          <Text style={styles.statusValue}>{cardId}</Text>
        </View>
      </View>
    </View>
  );

  // "Yaz" sekmesinin ana menüsü: yazılabilecek veri tiplerinin listesi.
  const renderWriteOptions = () => (
    <View style={styles.tabContainer}>
      {renderHeader(t('writeTabTitle'))}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.descriptionText}>{t('writeOptionsPrompt')}</Text>

        <TouchableOpacity
          style={styles.optionCard}
          onPress={() => {
            setWriteMode('COPY');
            setCopyStep(1);
            setCopiedRecords(null);
          }}
        >
          <View style={styles.optionTextContainer}>
            <Text style={styles.optionTitle}>{t('copyTitle')}</Text>
            <Text style={styles.optionDesc}>{t('copyDesc')}</Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.optionCard} onPress={() => setWriteMode('WEBSITE')}>
          <View style={styles.optionTextContainer}>
            <Text style={styles.optionTitle}>{t('websiteTitle')}</Text>
            <Text style={styles.optionDesc}>{t('websiteDesc')}</Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.optionCard} onPress={() => setWriteMode('CONTACT')}>
          <View style={styles.optionTextContainer}>
            <Text style={styles.optionTitle}>{t('contactTitle')}</Text>
            <Text style={styles.optionDesc}>{t('contactDesc')}</Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.optionCard} onPress={() => setWriteMode('BLUETOOTH')}>
          <View style={styles.optionTextContainer}>
            <Text style={styles.optionTitle}>{t('bluetoothTitle')}</Text>
            <Text style={styles.optionDesc}>{t('bluetoothDesc')}</Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.optionCard} onPress={() => setWriteMode('ERASE')}>
          <View style={styles.optionTextContainer}>
            <Text style={[styles.optionTitle, { color: colors.error }]}>{t('eraseTitle')}</Text>
            <Text style={styles.optionDesc}>{t('eraseDesc')}</Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );

  // Seçilen veri tipine göre formu ve "yaz / kopyala / sil" butonunu gösteren ekran.
  const renderWriteForm = () => {
    let onPressAction = writeNfcData;
    let buttonText = writeMode === 'ERASE' ? t('eraseButton') : t('writeButton');

    if (writeMode === 'COPY') {
      onPressAction = copyStep === 1 ? handleCopyStep1 : handleCopyStep2;
      buttonText = copyStep === 1 ? t('copyStep1Button') : t('copyStep2Button');
    }

    const headerTitle =
      writeMode === 'ERASE' ? t('eraseHeaderTitle') :
      writeMode === 'COPY' ? t('copyHeaderTitle') :
      t('dataEntryHeaderTitle');

    return (
      <View style={styles.tabContainer}>
        {renderHeader(headerTitle)}
        <ScrollView contentContainerStyle={styles.scrollContent}>

          <View style={styles.statusCard}>
            <Text style={styles.statusLabel}>{t('statusLabel')}</Text>
            <Text style={styles.statusValue}>{cardId}</Text>
          </View>

          {writeMode === 'WEBSITE' && (
            <View>
              <Text style={styles.inputLabel}>{t('websiteLabel')}</Text>
              <TextInput
                style={styles.input}
                onChangeText={setUrl}
                value={url}
                placeholder="https://example.com"
                placeholderTextColor={colors.onSurfaceVariant}
                autoCapitalize="none"
              />
            </View>
          )}

          {writeMode === 'CONTACT' && (
            <View>
              <Text style={styles.inputLabel}>{t('nameLabel')}</Text>
              <TextInput style={styles.input} onChangeText={setName} value={name} placeholder="John Doe" placeholderTextColor={colors.onSurfaceVariant} />
              <Text style={styles.inputLabel}>{t('phoneLabel')}</Text>
              <TextInput
                style={styles.input}
                onChangeText={setPhone}
                value={phone}
                placeholder="+90 555 555 5555"
                keyboardType="phone-pad"
                placeholderTextColor={colors.onSurfaceVariant}
              />
              <Text style={styles.inputLabel}>{t('emailLabel')}</Text>
              <TextInput
                style={styles.input}
                onChangeText={setEmail}
                value={email}
                placeholder={t('placeholderEmail')}
                keyboardType="email-address"
                placeholderTextColor={colors.onSurfaceVariant}
                autoCapitalize="none"
              />
            </View>
          )}

          {writeMode === 'BLUETOOTH' && (
            <View>
              <Text style={styles.inputLabel}>{t('macLabel')}</Text>
              <TextInput
                style={styles.input}
                onChangeText={setMacAddress}
                value={macAddress}
                placeholder="A1:B2:C3:D4:E5:F6"
                placeholderTextColor={colors.onSurfaceVariant}
                autoCapitalize="characters"
              />
            </View>
          )}

          {writeMode === 'ERASE' && (
            <View style={{ marginVertical: 16 }}>
              <Text style={styles.descriptionText}>{t('eraseInfo')}</Text>
            </View>
          )}

          {writeMode === 'COPY' && (
            <View style={{ marginVertical: 16 }}>
              <Text style={styles.descriptionText}>
                {copyStep === 1 ? t('copyStep1Info') : t('copyStep2Info')}
              </Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.primaryButton, writeMode === 'ERASE' && { backgroundColor: colors.error }]}
            onPress={onPressAction}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={colors.onPrimary} />
            ) : (
              <Text style={styles.primaryButtonText}>{buttonText}</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.ghostButton}
            onPress={() => {
              setWriteMode('NONE');
              setCopiedRecords(null);
              setCopyStep(1);
            }}
            disabled={loading}
          >
            <Text style={styles.ghostButtonText}>{t('cancelButton')}</Text>
          </TouchableOpacity>

        </ScrollView>
      </View>
    );
  };

  // ===============================================================================
  // ANA YERLEŞİM (LAYOUT)
  // ===============================================================================
  // Ekranın iskeleti: üstte aktif sekmenin içeriği, altta sabit gezinme çubuğu.
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} />
      <View style={styles.container}>

        <View style={styles.contentArea}>
          {activeTab === 'READ'
            ? renderReadTab()
            : (writeMode === 'NONE' ? renderWriteOptions() : renderWriteForm())}
        </View>

        <View style={styles.bottomNav}>
          <TouchableOpacity
            style={[styles.navItem, activeTab === 'READ' && styles.navItemActive]}
            onPress={() => {
              setActiveTab('READ');
              setWriteMode('NONE');
            }}
          >
            <Text style={[styles.navIcon, activeTab === 'READ' && styles.navIconActive]}>📡</Text>
            <Text style={[styles.navText, activeTab === 'READ' && styles.navTextActive]}>{t('navRead')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navItem, activeTab === 'WRITE' && styles.navItemActive]}
            onPress={() => setActiveTab('WRITE')}
          >
            <Text style={[styles.navIcon, activeTab === 'WRITE' && styles.navIconActive]}>✍️</Text>
            <Text style={[styles.navText, activeTab === 'WRITE' && styles.navTextActive]}>{t('navWrite')}</Text>
          </TouchableOpacity>
        </View>

      </View>
    </SafeAreaView>
  );
}

// =================================================================================
// STİLLER
// =================================================================================
// StyleSheet artık sabit bir COLORS objesine değil, parametre olarak gelen aktif
// temaya (colors) bağlı. Bileşen içinde useMemo ile sadece tema değiştiğinde
// yeniden hesaplanır.
function getStyles(colors) {
  return StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.surface,
      paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    },
    container: { flex: 1, backgroundColor: colors.background },
    contentArea: { flex: 1 },
    tabContainer: { flex: 1 },
    scrollContent: { padding: 16, paddingBottom: 40 },

    header: {
      height: 56,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.outlineVariant,
    },
    headerTitle: { fontSize: 22, fontWeight: '600', color: colors.primary },
    langToggle: {
      borderWidth: 1,
      borderColor: colors.outlineVariant,
      borderRadius: 8,
      paddingHorizontal: 10,
      paddingVertical: 4,
    },
    langToggleText: { fontSize: 12, fontWeight: '700', color: colors.primary },

    readContent: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
    nfcIconPlaceholder: {
      width: 140,
      height: 140,
      borderRadius: 70,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.outlineVariant,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 32,
    },
    descriptionText: { fontSize: 16, color: colors.onSurfaceVariant, textAlign: 'center', marginBottom: 24, lineHeight: 24 },

    primaryButton: {
      width: '100%',
      backgroundColor: colors.primary,
      paddingVertical: 16,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
      marginTop: 8,
    },
    primaryButtonText: { color: colors.onPrimary, fontSize: 18, fontWeight: '600' },

    ghostButton: { width: '100%', paddingVertical: 16, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginTop: 12 },
    ghostButtonText: { color: colors.onSurfaceVariant, fontSize: 16, fontWeight: '600' },

    statusCard: {
      width: '100%',
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.outlineVariant,
      borderRadius: 12,
      padding: 16,
      marginTop: 32,
      flexDirection: 'column',
    },
    statusLabel: { fontSize: 12, fontWeight: '500', color: colors.onSurfaceVariant, marginBottom: 4 },
    statusValue: { fontSize: 14, fontWeight: '600', color: colors.onSurface },

    optionCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surfaceContainerLowest,
      borderWidth: 1,
      borderColor: colors.outlineVariant,
      borderRadius: 16,
      padding: 20,
      marginBottom: 16,
    },
    optionTextContainer: { flex: 1 },
    optionTitle: { fontSize: 18, fontWeight: '600', color: colors.onSurface, marginBottom: 4 },
    optionDesc: { fontSize: 14, color: colors.onSurfaceVariant, lineHeight: 20 },
    chevron: { fontSize: 24, color: colors.primary, paddingLeft: 16 },

    inputLabel: { fontSize: 14, fontWeight: '500', color: colors.onSurfaceVariant, marginBottom: 8, marginTop: 16 },
    input: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.outlineVariant,
      borderRadius: 8,
      padding: 16,
      fontSize: 16,
      color: colors.onSurface,
    },

    bottomNav: {
      flexDirection: 'row',
      backgroundColor: colors.surfaceContainerLowest,
      borderTopWidth: 1,
      borderTopColor: colors.outlineVariant,
      paddingVertical: 8,
      paddingBottom: 16,
    },
    navItem: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 8, marginHorizontal: 16, borderRadius: 12 },
    navItemActive: { backgroundColor: colors.surfaceVariant },
    navIcon: { fontSize: 24, opacity: 0.6 },
    navIconActive: { opacity: 1 },
    navText: { fontSize: 12, fontWeight: '500', color: colors.onSurfaceVariant, marginTop: 4 },
    navTextActive: { color: colors.primary, fontWeight: '700' },
  });
}
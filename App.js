import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert, ActivityIndicator, TextInput, ScrollView } from 'react-native';
import NfcManager, { NfcTech, Ndef } from 'react-native-nfc-manager';

// NFC Donanım katmanını ayağa kaldırıyoruz
NfcManager.start();

export default function App() {
  const [loading, setLoading] = useState(false);
  const [cardId, setCardId] = useState('Kart bekleniyor...');
  
  // Mod Yönetimi: 'NONE' (Seçim), 'WEBSITE' (Web Giriş), 'CONTACT' (Kişi Giriş)
  const [writeMode, setWriteMode] = useState('NONE'); 

  // Web Sitesi Modu Durumu
  const [url, setUrl] = useState('https://google.com');

  // Kişi Bilgisi (Contact) Modu Durumları
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  // --- KART OKUMA MEKANİZMASI ---
  async function startNfcScan() {
    try {
      setLoading(true);
      setCardId('Okuma modunda, kartı yaklaştırın...');
      await NfcManager.requestTechnology([NfcTech.NfcA]);
      const tag = await NfcManager.getTag();
      setCardId(tag.id);
      Alert.alert('Kart Yakalandı!', `UID: ${tag.id}`);
    } catch (ex) {
      console.warn(ex);
      setCardId('Okuma iptal edildi.');
    } finally {
      NfcManager.cancelTechnologyRequest();
      setLoading(false);
    }
  }

  // --- KARTA NDEF VERİSİ YAZMA MEKANİZMASI ---
  async function writeNfcData() {
    let bytes = null;

    try {
      setLoading(true);
      setCardId('Yazma modunda, kartı yaklaştırın...');

      // Hangi mod seçildiyse ona göre veriyi NDEF formatında byte dizisine çeviriyoruz
      if (writeMode === 'WEBSITE') {
        if (!url) { 
          Alert.alert('Hata', 'Link alanı boş bırakılamaz!'); 
          setLoading(false); 
          return; 
        }
        await NfcManager.requestTechnology([NfcTech.Ndef]);
        bytes = Ndef.encodeMessage([Ndef.uriRecord(url)]);

      } else if (writeMode === 'CONTACT') {
        if (!name || !phone) { 
          Alert.alert('Hata', 'İsim ve Telefon alanları zorunludur!'); 
          setLoading(false); 
          return; 
        }

        // vCard Yapısını Oluşturuyoruz (Uluslararası Rehber Standartı)
        const vCardData = `BEGIN:VCARD\nVERSION:3.0\nN:;${name};;;\nFN:${name}\nTEL;CELL:${phone}\nEMAIL:${email}\nEND:VCARD`;
        
        await NfcManager.requestTechnology([NfcTech.Ndef]);
        bytes = Ndef.encodeMessage([
          Ndef.mimeMediaRecord('text/vcard', vCardData)
        ]);
      }

      // Veri başarıyla byte formatına döndüyse donanıma yazma emri veriyoruz
      if (bytes) {
        await NfcManager.ndefHandler.writeNdefMessage(bytes);
        Alert.alert('Başarılı!', 'Veri karta başarıyla işlendi kanka!');
        setCardId('Yazma Başarılı!');
        setWriteMode('NONE'); // İşlem bitince ana menüye dön
      }
    } catch (ex) {
      console.warn("NFC Yazma Hatası:", ex);
      Alert.alert('Yazma Hatası', 'Kartı erken çekmiş olabilirsin veya bu kart yazılabilir değil.');
      setCardId('Yazma başarısız.');
    } finally {
      NfcManager.cancelTechnologyRequest();
      setLoading(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>NFC Tools Studio</Text>
      
      <View style={styles.cardBox}>
        <Text style={styles.label}>Durum / Okunan ID:</Text>
        <Text style={styles.uidText}>{cardId}</Text>
      </View>

      {/* --- ANA SEÇİM MENÜSÜ --- */}
      {writeMode === 'NONE' && (
        <View style={styles.fullWidth}>
          <TouchableOpacity style={[styles.button, styles.readButton]} onPress={startNfcScan} disabled={loading}>
            <Text style={styles.buttonText}>SADECE KART OKU</Text>
          </TouchableOpacity>

          <View style={styles.divider} />
          <Text style={styles.sectionTitle}>Yazma Modu Seçin:</Text>

          <TouchableOpacity style={[styles.button, styles.writeButton]} onPress={() => setWriteMode('WEBSITE')}>
            <Text style={styles.buttonText}>🌐 WEB SİTESİ YAZ</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.button, styles.contactButton]} onPress={() => setWriteMode('CONTACT')}>
            <Text style={styles.buttonText}>👤 KİŞİ KARTI (CONTACT) YAZ</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* --- WEB SİTESİ INPUT EKRANI --- */}
      {writeMode === 'WEBSITE' && (
        <View style={styles.fullWidth}>
          <Text style={styles.sectionTitle}>Web Sitesi Linkini Girin:</Text>
          <TextInput
            style={styles.input}
            onChangeText={setUrl}
            value={url}
            placeholder="https://example.com"
            placeholderTextColor="#666"
          />
          <TouchableOpacity style={[styles.button, styles.saveButton]} onPress={writeNfcData} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>KARTA YAZMA MODUNU AÇ</Text>}
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelButton} onPress={() => setWriteMode('NONE')}>
            <Text style={styles.cancelText}>Geri Dön</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* --- KİŞİ KARTI INPUT EKRANI --- */}
      {writeMode === 'CONTACT' && (
        <View style={styles.fullWidth}>
          <Text style={styles.sectionTitle}>Kişi Bilgilerini Doldurun:</Text>
          
          <TextInput style={styles.input} onChangeText={setName} value={name} placeholder="Ad Soyad" placeholderTextColor="#666" />
          <TextInput style={styles.input} onChangeText={setPhone} value={phone} placeholder="Telefon Numarası" keyboardType="phone-pad" placeholderTextColor="#666" />
          <TextInput style={styles.input} onChangeText={setEmail} value={email} placeholder="E-posta Adresi" keyboardType="email-address" placeholderTextColor="#666" />

          <TouchableOpacity style={[styles.button, styles.saveButton]} onPress={writeNfcData} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>KARTA KİŞİYİ YAZ</Text>}
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelButton} onPress={() => setWriteMode('NONE')}>
            <Text style={styles.cancelText}>Geri Dön</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1e1e24', padding: 20 },
  title: { fontSize: 26, fontWeight: 'bold', color: '#fff', marginBottom: 25 },
  fullWidth: { width: '100%' },
  cardBox: { backgroundColor: '#2a2a35', padding: 15, borderRadius: 12, width: '100%', alignItems: 'center', marginBottom: 25, borderLeftWidth: 5, borderLeftColor: '#007AFF' },
  label: { color: '#aaa', fontSize: 13, marginBottom: 5 },
  uidText: { color: '#00ffcc', fontSize: 16, fontWeight: 'mono', textAlign: 'center' },
  sectionTitle: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginBottom: 15, textAlign: 'left' },
  divider: { height: 1, backgroundColor: '#444', width: '100%', marginVertical: 20 },
  input: { backgroundColor: '#2a2a35', color: '#fff', width: '100%', padding: 12, borderRadius: 8, marginBottom: 12, fontSize: 15, borderWidth: 1, borderColor: '#444' },
  button: { width: '100%', paddingVertical: 14, borderRadius: 30, elevation: 3, alignItems: 'center', marginBottom: 12 },
  readButton: { backgroundColor: '#34c759' },
  writeButton: { backgroundColor: '#007AFF' },
  contactButton: { backgroundColor: '#af52de' },
  saveButton: { backgroundColor: '#ff9500', marginTop: 10 },
  buttonText: { color: '#fff', fontSize: 15, fontWeight: 'bold' },
  cancelButton: { 
    width: '100%', 
    alignItems: 'center',
    marginTop: 15 
  },
  cancelText: { color: '#ff3b30', fontSize: 15, fontWeight: 'bold' }
});
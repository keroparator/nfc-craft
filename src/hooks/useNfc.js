import { useRef, useState } from 'react';
import { Alert } from 'react-native';
import NfcManager, { NfcTech, Ndef } from 'react-native-nfc-manager';
import { encodeCopiedRecords } from '../nfc/records';

export default function useNfc({ t, form, writeMode, setWriteMode }) {
  const { url, name, phone, email, macAddress } = form;
  const [loading, setLoading] = useState(false);
  const [statusKey, setStatusKey] = useState('waitingForScan');
  const [statusExtra, setStatusExtra] = useState(null);
  const [copyStep, setCopyStep] = useState(1);
  const [copiedRecords, setCopiedRecords] = useState(null);
  const busyRef = useRef(false);
  const sessionRequestedRef = useRef(false);

  function resetStatus() {
    setStatusKey('waitingForScan');
    setStatusExtra(null);
  }

  function resetCopy() {
    setCopyStep(1);
    setCopiedRecords(null);
  }

  function beginOperation() {
    if (busyRef.current) return false;
    busyRef.current = true;
    setLoading(true);
    return true;
  }

  async function requestTechnology(technology) {
    await NfcManager.start();
    sessionRequestedRef.current = true;
    await NfcManager.requestTechnology(technology);
  }

  async function finishOperation() {
    try {
      if (sessionRequestedRef.current) {
        await NfcManager.cancelTechnologyRequest();
      }
    } catch (error) {
      console.warn('NFC cleanup failed:', error);
    } finally {
      sessionRequestedRef.current = false;
      busyRef.current = false;
      setLoading(false);
    }
  }

  async function startNfcScan() {
    if (!beginOperation()) return;
    try {
      setStatusKey('readingMode');
      setStatusExtra(null);
      await requestTechnology([NfcTech.NfcA]);
      const tag = await NfcManager.getTag();
      setStatusExtra(tag.id);
      Alert.alert(t('cardCapturedTitle'), t('cardCapturedMsg', tag.id));
    } catch (ex) {
      console.warn(ex);
      setStatusKey('readCancelled');
      setStatusExtra(null);
    } finally {
      await finishOperation();
    }
  }

  async function writeNfcData() {
    let bytes = null;
    if (!beginOperation()) return;
    try {
      setStatusExtra(null);
      setStatusKey(writeMode === 'ERASE' ? 'eraseModeStatus' : 'writeModeStatus');

      if (writeMode === 'WEBSITE') {
        if (!url) {
          Alert.alert(t('errorTitle'), t('urlEmptyError'));
          return;
        }
        await requestTechnology([NfcTech.Ndef]);
        bytes = Ndef.encodeMessage([Ndef.uriRecord(url)]);
      } else if (writeMode === 'CONTACT') {
        if (!name || !phone) {
          Alert.alert(t('errorTitle'), t('contactRequiredError'));
          return;
        }
        const vCardData = `BEGIN:VCARD\nVERSION:3.0\nN:;${name};;;\nFN:${name}\nTEL;CELL:${phone}\nEMAIL:${email}\nEND:VCARD`;
        await requestTechnology([NfcTech.Ndef]);
        bytes = Ndef.encodeMessage([Ndef.mimeMediaRecord('text/vcard', vCardData)]);
      } else if (writeMode === 'BLUETOOTH') {
        if (!macAddress || !macAddress.includes(':')) {
          Alert.alert(t('errorTitle'), t('macInvalidError'));
          return;
        }
        await requestTechnology([NfcTech.Ndef]);
        const macBytes = macAddress
          .split(':')
          .reverse()
          .map((hex) => parseInt(hex, 16));
        bytes = Ndef.encodeMessage([
          Ndef.mimeMediaRecord('application/vnd.bluetooth.ep.oob', [0x08, 0x00, ...macBytes]),
        ]);
      } else if (writeMode === 'ERASE') {
        await requestTechnology([NfcTech.Ndef]);
        bytes = [0xd0, 0x00, 0x00];
      }

      if (bytes !== null) {
        await NfcManager.ndefHandler.writeNdefMessage(bytes);
        Alert.alert(
          t('successTitle'),
          writeMode === 'ERASE' ? t('eraseSuccessMsg') : t('writeSuccessMsg'),
        );
        setStatusKey(writeMode === 'ERASE' ? 'eraseSuccessStatus' : 'writeSuccessStatus');
        setWriteMode('NONE');
      }
    } catch (ex) {
      console.warn('NFC Hata:', ex);
      Alert.alert(t('errorTitle'), t('writeGenericError'));
      setStatusKey(writeMode === 'ERASE' ? 'eraseFailStatus' : 'writeFailStatus');
    } finally {
      await finishOperation();
    }
  }

  async function handleCopyStep1() {
    if (!beginOperation()) return;
    try {
      setStatusExtra(null);
      setStatusKey('copyStep1ReadingStatus');
      await requestTechnology([NfcTech.Ndef]);
      const tag = await NfcManager.getTag();

      if (tag && tag.ndefMessage && tag.ndefMessage.length > 0) {
        setCopiedRecords(tag.ndefMessage);
        Alert.alert(t('copySavedTitle'), t('copySavedMsg'));
        setCopyStep(2);
        setStatusKey('copyDataWaitingStatus');
      } else {
        Alert.alert(t('errorTitle'), t('noDataError'));
        setStatusKey('noDataStatus');
      }
    } catch (ex) {
      console.warn('Kopyalama Okuma Hata:', ex);
      Alert.alert(t('errorTitle'), t('copyReadError'));
      setStatusKey('copyReadFailStatus');
    } finally {
      await finishOperation();
    }
  }

  async function handleCopyStep2() {
    if (!beginOperation()) return;
    try {
      setStatusExtra(null);
      setStatusKey('copyStep2WritingStatus');
      await requestTechnology([NfcTech.Ndef]);

      if (copiedRecords) {
        let bytes = null;
        try {
          bytes = encodeCopiedRecords(copiedRecords);
        } catch (e) {
          console.warn('Encode Hata:', e);
          Alert.alert(t('errorTitle'), t('encodeError'));
          return;
        }

        await NfcManager.ndefHandler.writeNdefMessage(bytes);
        Alert.alert(t('successTitle'), t('copyWriteSuccessMsg'));
        setStatusKey('copyCompleteStatus');
        setCopiedRecords(null);
        setCopyStep(1);
        setWriteMode('NONE');
      }
    } catch (ex) {
      console.warn('Kopyalama Yazma Hata:', ex);
      Alert.alert(t('errorTitle'), t('copyWriteError'));
      setStatusKey('writeFailStatus');
    } finally {
      await finishOperation();
    }
  }

  return {
    loading,
    statusText: statusExtra ?? t(statusKey),
    copyStep,
    resetStatus,
    resetCopy,
    startNfcScan,
    writeNfcData,
    handleCopyStep1,
    handleCopyStep2,
  };
}

import React from 'react';
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import ScreenHeader from '../components/ScreenHeader';

export default function WriteScreen({
  t,
  styles,
  colors,
  nfc,
  form,
  setForm,
  writeMode,
  setWriteMode,
}) {
  const { url, name, phone, email, macAddress } = form;
  const {
    loading,
    statusText,
    copyStep,
    resetCopy,
    writeNfcData,
    handleCopyStep1,
    handleCopyStep2,
  } = nfc;

  const renderWriteOptions = () => {
    const options = [
      {
        mode: 'COPY',
        emoji: '📋',
        titleKey: 'copyTitle',
        descKey: 'copyDesc',
        onPress: () => {
          setWriteMode('COPY');
          resetCopy();
        },
      },
      {
        mode: 'WEBSITE',
        emoji: '🌐',
        titleKey: 'websiteTitle',
        descKey: 'websiteDesc',
        onPress: () => setWriteMode('WEBSITE'),
      },
      {
        mode: 'CONTACT',
        emoji: '👤',
        titleKey: 'contactTitle',
        descKey: 'contactDesc',
        onPress: () => setWriteMode('CONTACT'),
      },
      {
        mode: 'BLUETOOTH',
        emoji: '🎧',
        titleKey: 'bluetoothTitle',
        descKey: 'bluetoothDesc',
        onPress: () => setWriteMode('BLUETOOTH'),
      },
      {
        mode: 'ERASE',
        emoji: '🗑️',
        titleKey: 'eraseTitle',
        descKey: 'eraseDesc',
        onPress: () => setWriteMode('ERASE'),
      },
    ];

    return (
      <View style={styles.tabContainer}>
        <ScreenHeader title={t('writeTabTitle')} styles={styles} />
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.descriptionText}>{t('writeOptionsPrompt')}</Text>
          {options.map(({ mode, emoji, titleKey, descKey, onPress }) => (
            <TouchableOpacity key={mode} style={styles.optionCard} onPress={onPress}>
              <View style={styles.optionTextContainer}>
                <Text style={[styles.optionTitle, mode === 'ERASE' && { color: colors.error }]}>
                  {emoji} {t(titleKey)}
                </Text>
                <Text style={styles.optionDesc}>{t(descKey)}</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  const renderWriteForm = () => {
    let onPressAction = writeNfcData;
    let buttonText = writeMode === 'ERASE' ? t('eraseButton') : t('writeButton');

    if (writeMode === 'COPY') {
      onPressAction = copyStep === 1 ? handleCopyStep1 : handleCopyStep2;
      buttonText = copyStep === 1 ? t('copyStep1Button') : t('copyStep2Button');
    }

    const headerTitle =
      writeMode === 'ERASE'
        ? t('eraseHeaderTitle')
        : writeMode === 'COPY'
          ? t('copyHeaderTitle')
          : t('dataEntryHeaderTitle');

    return (
      <View style={styles.tabContainer}>
        <ScreenHeader title={headerTitle} styles={styles} />
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.statusCard}>
            <Text style={styles.statusLabel}>{t('statusLabel')}</Text>
            <Text style={styles.statusValue}>{statusText}</Text>
          </View>

          {writeMode === 'WEBSITE' && (
            <View>
              <Text style={styles.inputLabel}>{t('websiteLabel')}</Text>
              <TextInput
                style={styles.input}
                onChangeText={(value) => setForm((current) => ({ ...current, url: value }))}
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
              <TextInput
                style={styles.input}
                onChangeText={(value) => setForm((current) => ({ ...current, name: value }))}
                value={name}
                placeholder="John Doe"
                placeholderTextColor={colors.onSurfaceVariant}
              />
              <Text style={styles.inputLabel}>{t('phoneLabel')}</Text>
              <TextInput
                style={styles.input}
                onChangeText={(value) => setForm((current) => ({ ...current, phone: value }))}
                value={phone}
                placeholder="+1 555 555 5555"
                keyboardType="phone-pad"
                placeholderTextColor={colors.onSurfaceVariant}
              />
              <Text style={styles.inputLabel}>{t('emailLabel')}</Text>
              <TextInput
                style={styles.input}
                onChangeText={(value) => setForm((current) => ({ ...current, email: value }))}
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
                onChangeText={(value) => setForm((current) => ({ ...current, macAddress: value }))}
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
            style={[
              styles.primaryButton,
              writeMode === 'ERASE' && { backgroundColor: colors.error },
            ]}
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
              resetCopy();
            }}
            disabled={loading}
          >
            <Text style={styles.ghostButtonText}>{t('cancelButton')}</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  };

  return writeMode === 'NONE' ? renderWriteOptions() : renderWriteForm();
}

import React from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';
import ScreenHeader from '../components/ScreenHeader';

export default function ReadScreen({ t, styles, colors, nfc }) {
  const { loading, statusText, startNfcScan } = nfc;
  return (
    <View style={styles.tabContainer}>
      <ScreenHeader title={t('readTabTitle')} styles={styles} />
      <View style={styles.readContent}>
        <View style={styles.nfcIconPlaceholder}>
          <Text style={{ fontSize: 64 }}>📡</Text>
        </View>
        <Text style={styles.descriptionText}>{t('scanPrompt')}</Text>
        <TouchableOpacity style={styles.primaryButton} onPress={startNfcScan} disabled={loading}>
          {loading ? (
            <ActivityIndicator color={colors.onPrimary} />
          ) : (
            <Text style={styles.primaryButtonText}>{t('readButton')}</Text>
          )}
        </TouchableOpacity>
        <View style={styles.statusCard}>
          <Text style={styles.statusLabel}>{t('statusLabel')}</Text>
          <Text style={styles.statusValue}>{statusText}</Text>
        </View>
      </View>
    </View>
  );
}

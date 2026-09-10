import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import ScreenHeader from '../components/ScreenHeader';

function OptionButton({ label, selected, onPress, styles }) {
  return (
    <TouchableOpacity
      style={[styles.settingsOption, selected && styles.settingsOptionSelected]}
      onPress={onPress}
    >
      <Text style={[styles.settingsOptionText, selected && styles.settingsOptionTextSelected]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

export default function SettingsScreen({
  t,
  styles,
  language,
  setLanguage,
  themeOverride,
  setThemeOverride,
}) {
  return (
    <View style={styles.tabContainer}>
      <ScreenHeader title={t('settingsTabTitle')} styles={styles} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.settingsSection}>
          <Text style={styles.settingsSectionTitle}>{t('settingsLanguageSection')}</Text>
          <View style={styles.settingsRow}>
            <OptionButton
              styles={styles}
              label={t('langEnglish')}
              selected={language === 'en'}
              onPress={() => setLanguage('en')}
            />
            <OptionButton
              styles={styles}
              label={t('langTurkish')}
              selected={language === 'tr'}
              onPress={() => setLanguage('tr')}
            />
          </View>
        </View>

        <View style={styles.settingsSection}>
          <Text style={styles.settingsSectionTitle}>{t('settingsThemeSection')}</Text>
          <View style={styles.settingsRow}>
            <OptionButton
              styles={styles}
              label={t('themeSystem')}
              selected={themeOverride === null}
              onPress={() => setThemeOverride(null)}
            />
            <OptionButton
              styles={styles}
              label={t('themeLight')}
              selected={themeOverride === 'light'}
              onPress={() => setThemeOverride('light')}
            />
            <OptionButton
              styles={styles}
              label={t('themeDark')}
              selected={themeOverride === 'dark'}
              onPress={() => setThemeOverride('dark')}
            />
          </View>
          <Text style={styles.settingsNote}>{t('settingsThemeNote')}</Text>
        </View>
      </ScrollView>
    </View>
  );
}

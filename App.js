import React, { useMemo, useRef, useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
  useWindowDimensions,
} from 'react-native';
import AdaptiveBannerAd from './src/components/AdaptiveBannerAd';
import useNfc from './src/hooks/useNfc';
import useMobileAds from './src/hooks/useMobileAds';
import { translations } from './src/i18n/translations';
import ReadScreen from './src/screens/ReadScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import WriteScreen from './src/screens/WriteScreen';
import { darkColors, lightColors } from './src/theme/colors';
import getStyles from './src/theme/styles';

const TABS = [
  { tab: 'READ', icon: '📡', labelKey: 'navRead' },
  { tab: 'WRITE', icon: '✍️', labelKey: 'navWrite' },
  { tab: 'SETTINGS', icon: '⚙️', labelKey: 'navSettings' },
];

export default function App() {
  const systemColorScheme = useColorScheme();
  const [themeOverride, setThemeOverride] = useState(null);
  const effectiveScheme = themeOverride ?? systemColorScheme;
  const colors = effectiveScheme === 'dark' ? darkColors : lightColors;
  const styles = useMemo(() => getStyles(colors), [colors]);
  const [language, setLanguage] = useState('en');
  const t = (key, ...args) => {
    const entry = translations[language][key];
    return typeof entry === 'function' ? entry(...args) : entry;
  };

  const [activeTab, setActiveTab] = useState('READ');
  const [writeMode, setWriteMode] = useState('NONE');
  const [form, setForm] = useState({
    url: 'https://google.com',
    name: '',
    phone: '',
    email: '',
    macAddress: '',
  });
  const nfc = useNfc({ t, form, writeMode, setWriteMode });
  const ads = useMobileAds();
  const { width } = useWindowDimensions();
  const scrollViewRef = useRef(null);

  function selectTab(tab) {
    setActiveTab(tab);
    if (tab !== 'WRITE') setWriteMode('NONE');
    nfc.resetStatus();
  }

  function handleScrollEnd(event) {
    const index = Math.round(event.nativeEvent.contentOffset.x / width);
    const newTab = TABS[index]?.tab;
    if (newTab && activeTab !== newTab) selectTab(newTab);
  }

  function handleTabPress(tab) {
    const index = TABS.findIndex((item) => item.tab === tab);
    scrollViewRef.current?.scrollTo({ x: index * width, animated: true });
    selectTab(tab);
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle={effectiveScheme === 'dark' ? 'light-content' : 'dark-content'} />
      <View style={styles.container}>
        <View style={styles.contentArea}>
          <ScrollView
            ref={scrollViewRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={handleScrollEnd}
            bounces={false}
          >
            <View style={{ width, flex: 1 }}>
              <ReadScreen t={t} styles={styles} colors={colors} nfc={nfc} />
            </View>
            <View style={{ width, flex: 1 }}>
              <WriteScreen
                t={t}
                styles={styles}
                colors={colors}
                nfc={nfc}
                form={form}
                setForm={setForm}
                writeMode={writeMode}
                setWriteMode={setWriteMode}
              />
            </View>
            <View style={{ width, flex: 1 }}>
              <SettingsScreen
                t={t}
                styles={styles}
                language={language}
                setLanguage={setLanguage}
                themeOverride={themeOverride}
                setThemeOverride={setThemeOverride}
                privacyOptionsRequired={ads.privacyOptionsRequired}
                showPrivacyOptions={ads.showPrivacyOptions}
              />
            </View>
          </ScrollView>
        </View>
        {ads.ready && <AdaptiveBannerAd styles={styles} t={t} />}
        <View style={styles.bottomNav}>
          {TABS.map(({ tab, icon, labelKey }) => (
            <TouchableOpacity
              key={tab}
              style={[styles.navItem, activeTab === tab && styles.navItemActive]}
              onPress={() => handleTabPress(tab)}
            >
              <Text style={[styles.navIcon, activeTab === tab && styles.navIconActive]}>
                {icon}
              </Text>
              <Text style={[styles.navText, activeTab === tab && styles.navTextActive]}>
                {t(labelKey)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}

import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';
import { bannerAdUnitId, isAdMobTestMode } from '../ads/config';

const MIN_REQUEST_INTERVAL_MS = 60_000;
let lastBannerRequestAt = 0;

export default function AdaptiveBannerAd({ visible, styles, t }) {
  const [canRequest, setCanRequest] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setCanRequest(false);

    if (!visible) return undefined;

    const elapsed = Date.now() - lastBannerRequestAt;
    const delay = Math.max(0, MIN_REQUEST_INTERVAL_MS - elapsed);
    const timer = setTimeout(() => {
      lastBannerRequestAt = Date.now();
      setFailed(false);
      setCanRequest(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [visible]);

  if (!visible || !canRequest || failed || !bannerAdUnitId) return null;

  return (
    <View style={styles.adContainer} accessibilityLabel={t('adAccessibilityLabel')}>
      <Text style={styles.adLabel}>{t(isAdMobTestMode ? 'testAdLabel' : 'adLabel')}</Text>
      <BannerAd
        unitId={bannerAdUnitId}
        size={BannerAdSize.LARGE_ANCHORED_ADAPTIVE_BANNER}
        onAdFailedToLoad={(error) => {
          console.warn('AdMob banner failed to load:', error);
          setFailed(true);
        }}
      />
    </View>
  );
}

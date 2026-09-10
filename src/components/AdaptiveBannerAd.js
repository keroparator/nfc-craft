import React, { useEffect, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';
import { bannerAdUnitId, isAdMobTestMode } from '../ads/config';

const RETRY_DELAY_MS = 60_000;

export default function AdaptiveBannerAd({ styles, t }) {
  const [requestKey, setRequestKey] = useState(0);
  const retryTimerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
    };
  }, []);

  if (!bannerAdUnitId) return null;

  return (
    <View style={styles.adContainer} accessibilityLabel={t('adAccessibilityLabel')}>
      <Text style={styles.adLabel}>{t(isAdMobTestMode ? 'testAdLabel' : 'adLabel')}</Text>
      <BannerAd
        key={requestKey}
        unitId={bannerAdUnitId}
        size={BannerAdSize.LARGE_ANCHORED_ADAPTIVE_BANNER}
        onAdFailedToLoad={(error) => {
          console.warn('AdMob banner failed to load:', error);

          if (retryTimerRef.current) return;
          retryTimerRef.current = setTimeout(() => {
            retryTimerRef.current = null;
            setRequestKey((current) => current + 1);
          }, RETRY_DELAY_MS);
        }}
      />
    </View>
  );
}

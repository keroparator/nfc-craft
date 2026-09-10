import { Platform } from 'react-native';
import { TestIds } from 'react-native-google-mobile-ads';

export const isAdMobTestMode = process.env.EXPO_PUBLIC_ADMOB_MODE !== 'production';

const productionBannerUnitId = Platform.select({
  android: process.env.EXPO_PUBLIC_ADMOB_ANDROID_BANNER_UNIT_ID,
  ios: process.env.EXPO_PUBLIC_ADMOB_IOS_BANNER_UNIT_ID,
});

export const bannerAdUnitId = isAdMobTestMode ? TestIds.ADAPTIVE_BANNER : productionBannerUnitId;

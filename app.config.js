const { expo: baseExpoConfig } = require('./app.json');

const TEST_APP_IDS = {
  android: 'ca-app-pub-3940256099942544~3347511713',
  ios: 'ca-app-pub-3940256099942544~1458002511',
};

const ADMOB_APP_ID_PATTERN = /^ca-app-pub-\d{16}~\d{10}$/;
const ADMOB_AD_UNIT_ID_PATTERN = /^ca-app-pub-\d{16}\/\d{10}$/;

function getPluginName(plugin) {
  return Array.isArray(plugin) ? plugin[0] : plugin;
}

function requireProductionId(value, variableName, pattern) {
  if (!value) {
    throw new Error(`${variableName} is required for production builds.`);
  }

  if (!pattern.test(value)) {
    throw new Error(`${variableName} is not a valid AdMob ID.`);
  }

  return value;
}

module.exports = () => {
  const isProduction = process.env.EXPO_PUBLIC_ADMOB_MODE === 'production';
  const buildPlatform = process.env.EAS_BUILD_PLATFORM ?? 'android';
  const androidAppId = process.env.ADMOB_ANDROID_APP_ID;
  const iosAppId = process.env.ADMOB_IOS_APP_ID;
  const androidBannerUnitId = process.env.EXPO_PUBLIC_ADMOB_ANDROID_BANNER_UNIT_ID;
  const iosBannerUnitId = process.env.EXPO_PUBLIC_ADMOB_IOS_BANNER_UNIT_ID;

  if (isProduction && buildPlatform === 'android') {
    requireProductionId(androidAppId, 'ADMOB_ANDROID_APP_ID', ADMOB_APP_ID_PATTERN);
    requireProductionId(
      androidBannerUnitId,
      'EXPO_PUBLIC_ADMOB_ANDROID_BANNER_UNIT_ID',
      ADMOB_AD_UNIT_ID_PATTERN,
    );
  }

  if (isProduction && buildPlatform === 'ios') {
    requireProductionId(iosAppId, 'ADMOB_IOS_APP_ID', ADMOB_APP_ID_PATTERN);
    requireProductionId(
      iosBannerUnitId,
      'EXPO_PUBLIC_ADMOB_IOS_BANNER_UNIT_ID',
      ADMOB_AD_UNIT_ID_PATTERN,
    );
  }

  const basePlugins = baseExpoConfig.plugins.filter((plugin) => {
    const name = getPluginName(plugin);
    return name !== 'react-native-google-mobile-ads' && name !== 'expo-build-properties';
  });

  return {
    ...baseExpoConfig,
    plugins: [
      ...basePlugins,
      [
        'react-native-google-mobile-ads',
        {
          androidAppId: androidAppId || TEST_APP_IDS.android,
          iosAppId: iosAppId || TEST_APP_IDS.ios,
          delayAppMeasurementInit: true,
          optimizeInitialization: true,
          optimizeAdLoading: true,
        },
      ],
      [
        'expo-build-properties',
        {
          android: {
            extraProguardRules: '-keep class com.google.android.gms.internal.consent_sdk.** { *; }',
          },
        },
      ],
    ],
  };
};

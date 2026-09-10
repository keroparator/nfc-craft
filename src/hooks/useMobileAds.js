import { useCallback, useEffect, useRef, useState } from 'react';
import mobileAds, {
  AdsConsent,
  AdsConsentPrivacyOptionsRequirementStatus,
} from 'react-native-google-mobile-ads';

export default function useMobileAds() {
  const [ready, setReady] = useState(false);
  const [privacyOptionsRequired, setPrivacyOptionsRequired] = useState(false);
  const initializationStartedRef = useRef(false);
  const mountedRef = useRef(true);

  const updatePrivacyOptionsRequirement = useCallback((consentInfo) => {
    if (!mountedRef.current) return;

    setPrivacyOptionsRequired(
      consentInfo.privacyOptionsRequirementStatus ===
        AdsConsentPrivacyOptionsRequirementStatus.REQUIRED,
    );
  }, []);

  const initializeIfAllowed = useCallback(async (consentInfo) => {
    if (!consentInfo.canRequestAds || initializationStartedRef.current) return;

    initializationStartedRef.current = true;

    try {
      await mobileAds().initialize();
      if (mountedRef.current) setReady(true);
    } catch (error) {
      initializationStartedRef.current = false;
      console.warn('Google Mobile Ads initialization failed:', error);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;

    async function initializeAfterConsent() {
      let consentInfo;

      try {
        consentInfo = await AdsConsent.gatherConsent();
      } catch (error) {
        console.warn('AdMob consent gathering failed:', error);

        try {
          consentInfo = await AdsConsent.getConsentInfo();
        } catch (consentInfoError) {
          console.warn('AdMob consent status could not be read:', consentInfoError);
          return;
        }
      }

      if (!mountedRef.current) return;
      updatePrivacyOptionsRequirement(consentInfo);
      await initializeIfAllowed(consentInfo);
    }

    initializeAfterConsent();

    return () => {
      mountedRef.current = false;
    };
  }, [initializeIfAllowed, updatePrivacyOptionsRequirement]);

  const showPrivacyOptions = useCallback(async () => {
    try {
      const consentInfo = await AdsConsent.showPrivacyOptionsForm();
      updatePrivacyOptionsRequirement(consentInfo);
      await initializeIfAllowed(consentInfo);
      return true;
    } catch (error) {
      console.warn('AdMob privacy options form failed:', error);
      return false;
    }
  }, [initializeIfAllowed, updatePrivacyOptionsRequirement]);

  return { ready, privacyOptionsRequired, showPrivacyOptions };
}

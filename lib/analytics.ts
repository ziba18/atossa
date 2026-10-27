// Onboarding funnel analytics (Mixpanel). Only event names and step metadata are sent —
// never symptoms, notes, names, emails or anything from a capture. No-ops without
// EXPO_PUBLIC_MIXPANEL_TOKEN (and in the design-preview web mode), and never throws.
// JS mode (useNative=false) so it also runs in Expo Go.
// Opt-in (PECR): nothing is created, stored or sent until setAnalyticsConsent(true); default is off.
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Mixpanel } from 'mixpanel-react-native';

const token = process.env.EXPO_PUBLIC_MIXPANEL_TOKEN;
const enabled = !!token && Platform.OS !== 'web';

const CONSENT_KEY = 'atossa_analytics_consent';
let consent = false;
let client: Mixpanel | null = null;

// Restore a saved choice. Events before this resolves are dropped, which errs on the side of not tracking.
AsyncStorage.getItem(CONSENT_KEY).then((v) => { consent = v === '1'; }).catch(() => {});

/** Record the user's analytics choice. Turning it off also clears the stored Mixpanel identity. */
export function setAnalyticsConsent(allowed: boolean): void {
  consent = allowed;
  AsyncStorage.setItem(CONSENT_KEY, allowed ? '1' : '0').catch(() => {});
  if (!allowed && client) {
    try { client.optOutTracking(); client.reset(); } catch {}
    client = null;
  }
}

function getClient(): Mixpanel | null {
  if (!enabled || !consent) return null;
  if (!client) {
    client = new Mixpanel(token!, false, false, AsyncStorage);
    client.init().then(() => client?.optInTracking()).catch(() => {});
    // No city/country from the IP address, so no location data is collected.
    client.setUseIpAddressForGeolocation(false);
  }
  return client;
}

export type AnalyticsEvent =
  | 'Welcome Viewed'
  | 'Signup Completed'
  | 'Onboarding Step Completed'
  | 'Onboarding Completed'
  | 'Period Start Logged';

export function track(event: AnalyticsEvent, props?: Record<string, string | number | boolean>): void {
  try {
    getClient()?.track(event, props);
  } catch {}
}

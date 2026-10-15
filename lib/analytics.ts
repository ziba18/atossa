// Onboarding funnel analytics (Mixpanel). Only event names and step metadata are sent —
// never symptoms, notes, names, emails or anything from a capture. No-ops without
// EXPO_PUBLIC_MIXPANEL_TOKEN (and in the design-preview web mode), and never throws.
// JS mode (useNative=false) so it also runs in Expo Go.
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Mixpanel } from 'mixpanel-react-native';

const token = process.env.EXPO_PUBLIC_MIXPANEL_TOKEN;
const enabled = !!token && Platform.OS !== 'web';

let client: Mixpanel | null = null;

function getClient(): Mixpanel | null {
  if (!enabled) return null;
  if (!client) {
    client = new Mixpanel(token!, false, false, AsyncStorage);
    client.init().catch(() => {});
  }
  return client;
}

export type AnalyticsEvent =
  | 'Welcome Viewed'
  | 'Signup Completed'
  | 'Onboarding Step Completed'
  | 'Onboarding Completed';

export function track(event: AnalyticsEvent, props?: Record<string, string | number | boolean>): void {
  try {
    getClient()?.track(event, props);
  } catch {}
}

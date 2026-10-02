// The handler itself is installed from index.ts, before anything else loads.
import { clearFatalError, getFatalError, subscribeFatalError } from '../lib/crashGuard';
import { Stack, useRouter, type ErrorBoundaryProps } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Platform, View, useWindowDimensions } from 'react-native';
import '../hooks/useAuth';
import { cancelPredictedCycleReminders } from '../lib/notifications';
import { UI } from '../constants/atossaUI';
import { ErrorScreen, ToastHost } from '../components/atossa/kit';
import { useFonts } from 'expo-font';
// Per-weight imports so only the fonts we use are bundled. Inter 400/500/600 for all UI;
// Instrument Serif ITALIC only (Sam's words, Today hero, summary title) — never a weight.
import { Inter_400Regular } from '@expo-google-fonts/inter/400Regular';
import { Inter_500Medium } from '@expo-google-fonts/inter/500Medium';
import { Inter_600SemiBold } from '@expo-google-fonts/inter/600SemiBold';
import { InstrumentSerif_400Regular_Italic } from '@expo-google-fonts/instrument-serif/400Regular_Italic';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useSyncExternalStore } from 'react';

SplashScreen.preventAutoHideAsync().catch(() => {});

// Older builds scheduled "period coming" / "ovulation" reminders from a
// cycle prediction. The app no longer predicts anything, so clear any that
// are still queued on the device.
if (Platform.OS !== 'web') cancelPredictedCycleReminders().catch(() => {});

// Importing useAuth (above) runs the module-level startAuthInit() side effect that
// begins the session restore. `app/index.tsx` reads auth state and routes accordingly,
// so the root layout doesn't subscribe to auth changes.
function AppShell() {
  const { width } = useWindowDimensions();
  const router = useRouter();
  const fatalError = useSyncExternalStore(subscribeFatalError, getFatalError);

  // Route taps on the daily log reminder straight to Today (where capture starts),
  // whether the app was already open (listener) or launched cold from the
  // notification (getLastNotificationResponseAsync). Not on web (design preview only).
  useEffect(() => {
    if (Platform.OS === 'web') return;
    const handleResponse = (response: Notifications.NotificationResponse) => {
      if (response.notification.request.content.data?.type === 'daily_log_reminder') {
        router.push('/(tabs)/today' as any);
      }
    };

    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) handleResponse(response);
    });
    const sub = Notifications.addNotificationResponseReceivedListener(handleResponse);
    return () => sub.remove();
  }, [router]);

  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    InstrumentSerif_400Regular_Italic,
  });

  // Hide the splash as soon as the fonts are ready. The auth session continues
  // resolving in the background — `app/index.tsx` shows a loading screen until
  // `isInitialized` flips, so the user sees the app respond rather than a frozen splash.
  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync().catch(() => {});
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;
  if (fatalError) return <ErrorScreen error={fatalError} onRetry={clearFatalError} />;

  const isTablet = width >= UI.maxContentWidth;

  return (
    <>
      <StatusBar style="dark" />
      {isTablet ? (
        <View style={{ flex: 1, alignItems: 'center', backgroundColor: UI.colors.background }}>
          <View style={{ flex: 1, width: UI.maxContentWidth }}>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="(auth)" />
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="+not-found" />
            </Stack>
          </View>
        </View>
      ) : (
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="+not-found" />
        </Stack>
      )}
      {/* Above every screen; sits just over the tab bar. */}
      <ToastHost />
    </>
  );
}

// Catches errors thrown while rendering any screen (see lib/crashGuard.ts for the rest).
export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  return <ErrorScreen error={error} onRetry={retry} />;
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AppShell />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

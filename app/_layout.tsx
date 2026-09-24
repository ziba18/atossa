import { Stack, useRouter } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, useWindowDimensions, LogBox } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';

// expo-notifications logs two warnings on every launch in Expo Go (SDK 53+
// dropped push support there). They don't apply to dev/production builds.
// Mute them only when actually running inside Expo Go.
if (Constants.executionEnvironment === ExecutionEnvironment.StoreClient) {
  LogBox.ignoreLogs([
    'expo-notifications: Android Push notifications',
    '`expo-notifications` functionality is not fully supported in Expo Go',
  ]);
}
import '../hooks/useAuth';
import { cancelPredictedCycleReminders } from '../lib/notifications';
import { UI } from '../constants/atossaUI';
import { useFonts } from 'expo-font';
// Per-weight imports so only the fonts we use are bundled.
import { InstrumentSerif_400Regular } from '@expo-google-fonts/instrument-serif/400Regular';
import { WorkSans_400Regular } from '@expo-google-fonts/work-sans/400Regular';
import { WorkSans_600SemiBold } from '@expo-google-fonts/work-sans/600SemiBold';
import { WorkSans_700Bold } from '@expo-google-fonts/work-sans/700Bold';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

SplashScreen.preventAutoHideAsync().catch(() => {});

// Older builds scheduled "period coming" / "ovulation" reminders from a
// cycle prediction. The app no longer predicts anything, so clear any that
// are still queued on the device.
cancelPredictedCycleReminders().catch(() => {});

// Importing useAuth (above) runs the module-level startAuthInit() side effect that
// begins the session restore. `app/index.tsx` reads auth state and routes accordingly,
// so the root layout doesn't subscribe to auth changes.
function AppShell() {
  const { width } = useWindowDimensions();
  const router = useRouter();

  // Route taps on the daily log reminder straight to the chat/log screen,
  // whether the app was already open (listener) or launched cold from the
  // notification (getLastNotificationResponseAsync).
  useEffect(() => {
    const handleResponse = (response: Notifications.NotificationResponse) => {
      if (response.notification.request.content.data?.type === 'daily_log_reminder') {
        router.push('/(tabs)/chat' as any);
      }
    };

    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) handleResponse(response);
    });
    const sub = Notifications.addNotificationResponseReceivedListener(handleResponse);
    return () => sub.remove();
  }, [router]);

  const [fontsLoaded] = useFonts({
    InstrumentSerif_400Regular,
    WorkSans_400Regular,
    WorkSans_600SemiBold,
    WorkSans_700Bold,
  });

  // Hide the splash as soon as the fonts are ready. The auth session continues
  // resolving in the background — `app/index.tsx` shows a loading screen until
  // `isInitialized` flips, so the user sees the app respond rather than a frozen splash.
  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync().catch(() => {});
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

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
    </>
  );
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

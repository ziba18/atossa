import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, useWindowDimensions } from 'react-native';
import { useAuth } from '../hooks/useAuth';
import { useUIStore } from '../stores/uiStore';
import { ThemeProvider } from '../contexts/ThemeContext';
import { useFonts } from 'expo-font';
import {
  Jost_400Regular,
  Jost_500Medium,
  Jost_600SemiBold,
} from '@expo-google-fonts/jost';
import { CormorantGaramond_600SemiBold } from '@expo-google-fonts/cormorant-garamond';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { MAX_CONTENT_WIDTH } from '../constants/theme';

SplashScreen.preventAutoHideAsync().catch(() => {});

function AppShell() {
  // Importing useAuth runs the module-level startAuthInit() side effect that
  // begins the session restore. We don't subscribe here — `app/index.tsx`
  // reads auth state and routes accordingly, so the root layout doesn't need
  // to re-render on every auth change.
  const isDark = useUIStore((s) => s.isDarkMode);
  const hydrated = useUIStore((s) => s.hydrated);
  const { width } = useWindowDimensions();

  const [fontsLoaded] = useFonts({
    Jost_400Regular,
    Jost_500Medium,
    Jost_600SemiBold,
    CormorantGaramond_600SemiBold,
  });

  // Hide the splash as soon as the visual prerequisites (fonts + theme) are
  // ready. The auth session continues resolving in the background — `app/index.tsx`
  // shows a loading spinner until `isInitialized` flips, so the user sees the
  // app respond rather than a frozen splash.
  useEffect(() => {
    if (fontsLoaded && hydrated) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, hydrated]);

  if (!fontsLoaded || !hydrated) return null;

  const isTablet = width >= MAX_CONTENT_WIDTH;

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      {isTablet ? (
        <View style={{ flex: 1, alignItems: 'center', backgroundColor: isDark ? '#1E1C2E' : '#FAF8F2' }}>
          <View style={{ flex: 1, width: MAX_CONTENT_WIDTH }}>
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
          <Stack.Screen name="(viewer)" />
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
        <ThemeProvider>
          <AppShell />
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

import { Stack } from 'expo-router';
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
import { useAuth } from '../hooks/useAuth';
import { useUIStore } from '../stores/uiStore';
import { ThemeProvider } from '../contexts/ThemeContext';
import { initAIModels } from '../algorithms/aiModel';
import { useFonts } from 'expo-font';
import {
  Fraunces_300Light,
  Fraunces_300Light_Italic,
  Fraunces_400Regular,
  Fraunces_400Regular_Italic,
  Fraunces_500Medium,
  Fraunces_500Medium_Italic,
} from '@expo-google-fonts/fraunces';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { MAX_CONTENT_WIDTH } from '../constants/theme';

SplashScreen.preventAutoHideAsync().catch(() => {});

// Load the on-device AI models eagerly at module load. initAIModels()
// catches and swallows all errors, so a missing or stub .tflite simply
// leaves the predictor in "fall back to EWMA" mode without blocking app
// startup.
initAIModels().catch(() => {});

function AppShell() {
  // Importing useAuth runs the module-level startAuthInit() side effect that
  // begins the session restore. We don't subscribe here — `app/index.tsx`
  // reads auth state and routes accordingly, so the root layout doesn't need
  // to re-render on every auth change.
  const isDark = useUIStore((s) => s.isDarkMode);
  const hydrated = useUIStore((s) => s.hydrated);
  const { width } = useWindowDimensions();

  const [fontsLoaded] = useFonts({
    // Fraunces — modern variable serif used throughout the app. Light + Regular
    // for body and labels (soft warm vibe), Medium for emphasis, italics for
    // hero/display text. Heavier weights (SemiBold+) intentionally not loaded
    // to keep the whole typography palette soft.
    Fraunces_300Light,
    Fraunces_300Light_Italic,
    Fraunces_400Regular,
    Fraunces_400Regular_Italic,
    Fraunces_500Medium,
    Fraunces_500Medium_Italic,
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

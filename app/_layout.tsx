import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, useWindowDimensions } from 'react-native';
import { useAuth } from '../hooks/useAuth';
import { useUIStore } from '../stores/uiStore';
import { useAuthStore } from '../stores/authStore';
import { ThemeProvider } from '../contexts/ThemeContext';
import { useFonts } from 'expo-font';
import {
  Jost_400Regular,
  Jost_500Medium,
  Jost_600SemiBold,
} from '@expo-google-fonts/jost';
import {
  CormorantGaramond_600SemiBold,
  CormorantGaramond_600SemiBold_Italic,
} from '@expo-google-fonts/cormorant-garamond';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

SplashScreen.preventAutoHideAsync().catch(() => {});

const MAX_CONTENT_WIDTH = 600;

function AppShell() {
  const { isInitialized } = useAuth();
  const isDarkFromStore = useUIStore((s) => s.isDarkMode);
  const profile = useAuthStore((s) => s.profile);
  const isDark = profile?.dark_mode ?? isDarkFromStore;
  const { width } = useWindowDimensions();

  const [fontsLoaded] = useFonts({
    Jost_400Regular,
    Jost_500Medium,
    Jost_600SemiBold,
    CormorantGaramond_600SemiBold,
    CormorantGaramond_600SemiBold_Italic,
  });

  useEffect(() => {
    if (isInitialized && fontsLoaded) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [isInitialized, fontsLoaded]);

  if (!isInitialized || !fontsLoaded) return null;

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
              <Stack.Screen name="(viewer)" />
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

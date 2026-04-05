import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useAuth } from '../hooks/useAuth';
import { useUIStore } from '../stores/uiStore';
export default function RootLayout() {
  const { isInitialized } = useAuth();
  const isDark = useUIStore((s) => s.isDarkMode);

  if (!isInitialized) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="(viewer)" />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

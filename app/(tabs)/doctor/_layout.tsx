import { Stack } from 'expo-router';
import { colors } from '../../../constants/atossaUI';

export default function Layout() {
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.canvas } }}>
      <Stack.Screen name="index" />
      {/* Show on screen: the route only hosts a full-screen Modal (show.tsx), which covers the tab
          bar on every platform and brings its own slide-up — so no stack animation here. */}
      <Stack.Screen name="show" options={{ animation: 'none', contentStyle: { backgroundColor: colors.surface } }} />
    </Stack>
  );
}

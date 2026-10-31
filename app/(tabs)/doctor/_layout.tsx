import { Stack } from 'expo-router';
import { colors } from '../../../constants/atossaUI';
import { HelpNowStrip } from '../../../components/atossa/HelpNowStrip';

export default function Layout() {
  // 'Help now' link on every screen of this tab (Safety C101)
  return (
    <HelpNowStrip background={colors.surface}>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.surface } }}>
        <Stack.Screen name="index" />
        {/* Show on screen: the route only hosts a full-screen Modal (show.tsx), which covers the tab
            bar on every platform and brings its own slide-up — so no stack animation here. */}
        <Stack.Screen name="show" options={{ animation: 'none', contentStyle: { backgroundColor: colors.surface } }} />
      </Stack>
    </HelpNowStrip>
  );
}

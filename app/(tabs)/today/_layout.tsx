import { Stack } from 'expo-router';
import { colors } from '../../../constants/atossaUI';
import { HelpNowStrip } from '../../../components/atossa/HelpNowStrip';

export default function Layout() {
  // 'Help now' link on every screen of this tab (Safety C101)
  return (
    <HelpNowStrip>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.canvas } }} />
    </HelpNowStrip>
  );
}

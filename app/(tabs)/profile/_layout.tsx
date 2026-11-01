import { Stack } from 'expo-router';
import { colors } from '../../../constants/atossaUI';
import { HelpNowStrip } from '../../../components/atossa/HelpNowStrip';

export default function ProfileLayout() {
  // 'Help now' link on every screen of this tab (Safety C101)
  return (
    <HelpNowStrip>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.canvas } }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="edit-profile" />
        <Stack.Screen name="settings" />
        <Stack.Screen name="friends" />
        <Stack.Screen name="help-now" />
        <Stack.Screen name="records/[kind]/index" />
        <Stack.Screen name="records/[kind]/[id]" />
      </Stack>
    </HelpNowStrip>
  );
}

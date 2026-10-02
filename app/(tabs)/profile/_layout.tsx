import { Stack } from 'expo-router';
import { colors } from '../../../constants/atossaUI';

export default function ProfileLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.canvas } }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="edit-profile" />
      <Stack.Screen name="settings" />
      <Stack.Screen name="friends" />
      <Stack.Screen name="records/[kind]/index" />
      <Stack.Screen name="records/[kind]/[id]" />
    </Stack>
  );
}

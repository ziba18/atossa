import { Stack } from 'expo-router';

export default function ProfileLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="edit-profile" />
      <Stack.Screen name="settings" />
      <Stack.Screen name="emergency-contacts" />
      <Stack.Screen name="connected-accounts" />
      <Stack.Screen name="add-connection" />
      <Stack.Screen name="health-integrations" />
      <Stack.Screen name="subscription" />
      <Stack.Screen name="donate" />
    </Stack>
  );
}

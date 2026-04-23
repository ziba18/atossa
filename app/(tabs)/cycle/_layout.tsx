import { Stack } from 'expo-router';

export default function CycleLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" options={{ animation: 'none' }} />
      <Stack.Screen name="log-period" options={{ animation: 'slide_from_right', gestureEnabled: true }} />
      <Stack.Screen name="calendar" options={{ animation: 'slide_from_right', gestureEnabled: true }} />
    </Stack>
  );
}

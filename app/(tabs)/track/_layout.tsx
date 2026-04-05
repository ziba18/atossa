import { Stack } from 'expo-router';

export default function TrackLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="log-period" />
      <Stack.Screen name="log-symptoms" />
      <Stack.Screen name="log-metrics" />
      <Stack.Screen name="history" />
    </Stack>
  );
}

import { Stack } from 'expo-router';

export default function EducationLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" options={{ animation: 'none' }} />
      <Stack.Screen name="article/[slug]" options={{ animation: 'slide_from_right', gestureEnabled: true }} />
      <Stack.Screen name="video/[id]" options={{ animation: 'slide_from_right', gestureEnabled: true }} />
      <Stack.Screen name="category/[name]" options={{ animation: 'slide_from_right', gestureEnabled: true }} />
    </Stack>
  );
}

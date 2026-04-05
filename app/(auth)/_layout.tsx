import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="welcome" />
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="forgot-password" />
      <Stack.Screen name="onboarding/step1-basics" />
      <Stack.Screen name="onboarding/step2-last-period" />
      <Stack.Screen name="onboarding/step3-symptoms" />
      <Stack.Screen name="onboarding/step4-notifications" />
      <Stack.Screen name="onboarding/step5-connected" />
    </Stack>
  );
}

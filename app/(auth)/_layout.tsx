import { useEffect } from 'react';
import { AppState } from 'react-native';
import { Stack } from 'expo-router';
import { warmBackend } from '../../lib/api';

export default function AuthLayout() {
  // Wake the backend when the auth screens open and whenever the app returns from the
  // background, so the login tap doesn't pay for a cold start.
  useEffect(() => {
    warmBackend();
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') warmBackend();
    });
    return () => sub.remove();
  }, []);

  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="welcome" />
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="forgot-password" />
      <Stack.Screen name="onboarding/name" />
      <Stack.Screen name="onboarding/step1-basics" />
      <Stack.Screen name="onboarding/step2-last-period" />
      <Stack.Screen name="onboarding/step3-symptoms" />
      <Stack.Screen name="onboarding/step4-notifications" />
      <Stack.Screen name="onboarding/step5-connected" />
    </Stack>
  );
}

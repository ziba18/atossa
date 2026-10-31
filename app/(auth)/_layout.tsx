import { useEffect } from 'react';
import { AppState } from 'react-native';
import { Stack, useSegments } from 'expo-router';
import { warmBackend } from '../../lib/api';

export default function AuthLayout() {
  // The public Help now page must make no network call to our API, so it never wakes the backend.
  const onHelp = (useSegments() as string[]).includes('help-now');
  // Wake the backend when the auth screens open and whenever the app returns from the
  // background, so the login tap doesn't pay for a cold start.
  useEffect(() => {
    if (onHelp) return;
    warmBackend();
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') warmBackend();
    });
    return () => sub.remove();
  }, [onHelp]);

  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="welcome" />
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="forgot-password" />
      <Stack.Screen name="help-now" />
      <Stack.Screen name="onboarding/consent" />
      <Stack.Screen name="onboarding/name" />
      <Stack.Screen name="onboarding/basics" />
      <Stack.Screen name="onboarding/areas" />
      <Stack.Screen name="onboarding/onset" />
      <Stack.Screen name="onboarding/reminders" />
    </Stack>
  );
}

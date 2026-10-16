import { isRunningInExpoGo } from 'expo';

// expo-notifications warns twice as soon as it is imported in Expo Go: once
// that it is "not fully supported" and once that Android *push* was removed.
// Atossa only schedules local reminders, which Expo Go on iOS still runs, so
// both are noise there. Drop exactly those two messages, and only in Expo Go.
// Must be imported before expo-notifications (see index.ts).
const EXPO_GO_NOISE = [
  '`expo-notifications` functionality is not fully supported in Expo Go',
  'expo-notifications: Android Push notifications (remote notifications)',
];

if (isRunningInExpoGo()) {
  const warn = console.warn;
  console.warn = (...args: unknown[]) => {
    const first = args[0];
    if (typeof first === 'string' && EXPO_GO_NOISE.some((m) => first.startsWith(m))) return;
    warn(...args);
  };
}

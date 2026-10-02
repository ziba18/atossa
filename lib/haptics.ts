// Haptics per the spec (iOS convention): selection on chip / segment toggles, a light
// impact on record start/stop, success on save and PDF created, nothing on errors.
// No-ops on web, and never throws.
import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

const enabled = Platform.OS !== 'web';

export const haptics = {
  selection(): void {
    if (enabled) Haptics.selectionAsync().catch(() => {});
  },
  light(): void {
    if (enabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  },
  success(): void {
    if (enabled) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  },
};

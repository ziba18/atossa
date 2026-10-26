import { useCallback } from 'react';
import { Platform } from 'react-native';
import { useFocusEffect } from 'expo-router';

/** Web only: sets the browser tab title while this screen is focused ("Timeline · Atossa"). No-op on phones. */
export function usePageTitle(title: string) {
  useFocusEffect(
    useCallback(() => {
      if (Platform.OS !== 'web' || typeof document === 'undefined') return;
      document.title = `${title} · Atossa`;
    }, [title]),
  );
}

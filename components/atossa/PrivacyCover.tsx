import React, { useEffect, useState } from 'react';
import { AppState, Platform, StyleSheet, Text, View } from 'react-native';
import { colors } from '../../constants/atossaUI';

/**
 * Plain cover over the whole app while it is not the active app, so the iOS app-switcher snapshot
 * (and Control Centre / notification peeks) never shows symptom notes. JS only, nothing stored.
 */
export function PrivacyCover() {
  const [covered, setCovered] = useState(false);

  useEffect(() => {
    if (Platform.OS === 'web') return;
    const sub = AppState.addEventListener('change', (state) => setCovered(state !== 'active'));
    return () => sub.remove();
  }, []);

  if (!covered) return null;
  return (
    <View style={styles.cover} pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Text style={styles.name}>Atossa</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  cover: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: colors.canvas, alignItems: 'center', justifyContent: 'center', zIndex: 9999 },
  name: { fontSize: 22, fontWeight: '600', color: colors.ink },
});

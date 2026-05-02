import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useUIStore } from '../../stores/uiStore';

export function AuroraBackground() {
  const isDark = useUIStore((s) => s.isDarkMode);
  // The pastel blobs glow nicely on cream but read as garish blotches on the
  // dark surface, so swap to lower-opacity tints when dark mode is active.
  const blob1 = isDark ? 'rgba(141,201,143,0.10)' : 'rgba(141,201,143,0.42)';
  const blob2 = isDark ? 'rgba(237,202,202,0.10)' : 'rgba(237,202,202,0.38)';
  const blob3 = isDark ? 'rgba(187,207,232,0.10)' : 'rgba(187,207,232,0.36)';

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <View style={[styles.blob, {
        top: -110, left: -90,
        width: 360, height: 360,
        backgroundColor: blob1,
      }]} />
      <View style={[styles.blob, {
        top: -80, right: -110,
        width: 380, height: 380,
        backgroundColor: blob2,
      }]} />
      <View style={[styles.blob, {
        bottom: -80, left: '20%',
        width: 310, height: 310,
        backgroundColor: blob3,
      }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  blob: {
    position: 'absolute',
    borderRadius: 9999,
  },
});

import React from 'react';
import { View, StyleSheet } from 'react-native';

export function AuroraBackground() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <View style={[styles.blob, {
        top: -110, left: -90,
        width: 360, height: 360,
        backgroundColor: 'rgba(141,201,143,0.42)',
      }]} />
      <View style={[styles.blob, {
        top: -80, right: -110,
        width: 380, height: 380,
        backgroundColor: 'rgba(237,202,202,0.38)',
      }]} />
      <View style={[styles.blob, {
        bottom: -80, left: '20%',
        width: 310, height: 310,
        backgroundColor: 'rgba(187,207,232,0.36)',
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

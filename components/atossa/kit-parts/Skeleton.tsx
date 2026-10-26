// Loading placeholder: card-shaped bars that breathe (opacity 0.55 ↔ 1). Static under Reduce
// Motion. Announced once as "Loading" and hidden from screen readers otherwise.
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { colors, radii, space } from '../../../constants/atossaUI';
import { useReduceMotion } from './Sheet';

export function SkeletonCards({ count = 2, label = 'Loading' }: { count?: number; label?: string }) {
  const reduceMotion = useReduceMotion();
  const pulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (reduceMotion) { pulse.setValue(1); return; }
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 0.55, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [reduceMotion, pulse]);

  return (
    <View accessible accessibilityRole="progressbar" accessibilityLabel={label} style={{ gap: space.sm }}>
      {Array.from({ length: count }, (_, i) => (
        <Animated.View key={i} style={[styles.card, { opacity: pulse }]}>
          <View style={[styles.bar, { width: '38%', height: 12 }]} />
          <View style={[styles.bar, { width: '92%' }]} />
          <View style={[styles.bar, { width: '70%' }]} />
        </Animated.View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface, borderRadius: radii.card, borderWidth: 1, borderColor: colors.hairline,
    padding: space.md, gap: space.sm,
  },
  bar: { height: 14, borderRadius: 7, backgroundColor: colors.sunken },
});

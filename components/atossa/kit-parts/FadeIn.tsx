// Entrance: fade + 8pt rise, staggered by `index` (cap 6 so long lists don't lag). Plays once on
// mount; instant under Reduce Motion.
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, type StyleProp, type ViewStyle } from 'react-native';
import { motion } from '../../../constants/atossaUI';
import { useReduceMotion } from './Sheet';

export function FadeIn({ index = 0, style, children }: { index?: number; style?: StyleProp<ViewStyle>; children: React.ReactNode }) {
  const reduceMotion = useReduceMotion();
  const t = useRef(new Animated.Value(reduceMotion ? 1 : 0)).current;
  useEffect(() => {
    if (reduceMotion) { t.setValue(1); return; }
    const anim = Animated.timing(t, {
      toValue: 1, duration: motion.base, delay: Math.min(index, 6) * 40, easing: Easing.out(Easing.cubic), useNativeDriver: true,
    });
    anim.start();
    return () => anim.stop();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <Animated.View style={[style, { opacity: t, transform: [{ translateY: t.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) }] }]}>
      {children}
    </Animated.View>
  );
}

// Quiet plum level bars + elapsed timer shown while recording. The bars only move while
// recording (still when idle) and stay still under Reduce Motion. No audio level is read —
// the motion just says "listening".
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Platform, StyleSheet, View } from 'react-native';
import { colors, space } from '../../../constants/atossaUI';
import { Txt, useReduceMotion } from '../kit';

const BARS = [0.45, 0.75, 1, 0.6, 0.85, 0.5, 0.7];
const MAX_H = 32;

export function formatElapsed(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function Waveform({ recording, seconds }: { recording: boolean; seconds: number }) {
  const reduceMotion = useReduceMotion();
  const values = useRef(BARS.map(() => new Animated.Value(0.35))).current;

  useEffect(() => {
    if (!recording || reduceMotion) {
      values.forEach((v) => { v.stopAnimation(); v.setValue(0.35); });
      return;
    }
    const loops = values.map((v, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(v, {
            toValue: BARS[i], duration: 360 + i * 40, easing: Easing.inOut(Easing.quad),
            useNativeDriver: Platform.OS !== 'web',
          }),
          Animated.timing(v, {
            toValue: 0.3, duration: 360 + i * 40, easing: Easing.inOut(Easing.quad),
            useNativeDriver: Platform.OS !== 'web',
          }),
        ]),
      ),
    );
    const timers = loops.map((l, i) => setTimeout(() => l.start(), i * 70));
    return () => {
      timers.forEach(clearTimeout);
      loops.forEach((l) => l.stop());
    };
  }, [recording, reduceMotion]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <View style={styles.wrap} accessibilityLiveRegion="none">
      <View style={styles.bars} aria-hidden>
        {values.map((v, i) => (
          <Animated.View key={i} style={[styles.bar, { transform: [{ scaleY: v }] }]} />
        ))}
      </View>
      <Txt
        variant="secondary"
        accessibilityRole="timer"
        accessibilityLabel={`Recording, ${formatElapsed(seconds)}`}
        style={styles.time}
      >
        {formatElapsed(seconds)}
      </Txt>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space.sm, minHeight: MAX_H + space.xs },
  bars: { flexDirection: 'row', alignItems: 'center', gap: space.xxs, height: MAX_H },
  bar: { width: 4, height: MAX_H, borderRadius: 2, backgroundColor: colors.plum },
  time: { fontVariant: ['tabular-nums'], color: colors.ink, minWidth: 40 },
});

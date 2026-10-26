// Plum mic button. Tap to start, tap to stop (never press-and-hold).
//   size 72 — Today hero and the capture sheet's Speak step (round, plum).
//   size 52 — next to the "Type or say something else" field (r14 square, outline → plum when recording).
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Platform, Pressable, StyleSheet, View } from 'react-native';
import { useReduceMotion } from '../kit-parts/Sheet';
import { colors, radii } from '../../../constants/atossaUI';
import { Icon } from '../../ui/Icon';

export function MicButton({
  recording = false, onPress, accessibilityLabel, accessibilityHint, size = 72, disabled,
}: {
  recording?: boolean;
  onPress: () => void;
  accessibilityLabel: string;
  accessibilityHint?: string;
  size?: 72 | 52;
  disabled?: boolean;
}) {
  const big = size === 72;
  const reduceMotion = useReduceMotion();
  const pulse = useRef(new Animated.Value(0)).current;
  const pulsing = big && recording && !reduceMotion;
  // A soft ring breathes out from the button while recording (static ring under Reduce Motion).
  useEffect(() => {
    if (!pulsing) { pulse.setValue(0); return; }
    const loop = Animated.loop(Animated.timing(pulse, { toValue: 1, duration: 1400, easing: Easing.out(Easing.quad), useNativeDriver: Platform.OS !== 'web' }));
    loop.start();
    return () => loop.stop();
  }, [pulsing, pulse]);
  const button = (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: !!disabled, selected: recording }}
      style={({ pressed }) => [
        big ? styles.big : styles.small,
        big || recording
          ? { backgroundColor: pressed ? colors.plumPressed : colors.plum, borderColor: colors.plum }
          : { backgroundColor: pressed ? colors.sunken : colors.surface, borderColor: colors.borderStrong },
        disabled && { opacity: 0.5 },
      ]}
    >
      <View>
        <Icon
          name={recording ? 'square' : 'mic'}
          size={big ? 32 : 24}
          color={big || recording ? colors.white : colors.plum}
        />
      </View>
    </Pressable>
  );
  if (!big) return button;
  return (
    <View style={styles.wrap}>
      {recording ? <Animated.View
        pointerEvents="none"
        aria-hidden
        style={[
          styles.ring,
          reduceMotion
            ? { opacity: 0.3, transform: [{ scale: 1.15 }] }
            : { opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.4, 0] }), transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.45] }) }] },
        ]}
      /> : null}
      {button}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: 72, height: 72, alignItems: 'center', justifyContent: 'center' },
  ring: { position: 'absolute', width: 72, height: 72, borderRadius: radii.pill, borderWidth: 2, borderColor: colors.plum },
  big: { width: 72, height: 72, borderRadius: radii.pill, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  small: { width: 52, height: 52, borderRadius: radii.input, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
});

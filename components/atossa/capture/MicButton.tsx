// Plum mic button. Tap to start, tap to stop (never press-and-hold).
//   size 72 — Today hero and the capture sheet's Speak step (round, plum).
//   size 52 — next to the "Type or say something else" field (r14 square, outline → plum when recording).
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
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
  return (
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
}

const styles = StyleSheet.create({
  big: { width: 72, height: 72, borderRadius: radii.pill, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  small: { width: 52, height: 52, borderRadius: radii.input, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
});

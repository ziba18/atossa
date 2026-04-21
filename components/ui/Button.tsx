import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { Colors } from '../../constants/colors';
import { FontSize, FontWeight, Radius, Spacing } from '../../constants/theme';

// Matches web button variants: primary=#390517, secondary=cherry-lighter, outline, ghost, danger
type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  style,
  textStyle,
  fullWidth = false,
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.75}
      style={[
        styles.base,
        styles[variant],
        styles[`size_${size}`],
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'outline' || variant === 'ghost' ? Colors.cherry : Colors.white}
          size="small"
        />
      ) : (
        <Text style={[styles.text, styles[`text_${variant}`], styles[`textSize_${size}`], textStyle]}>
          {label}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: Radius.md,        // rounded-xl — 12px
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  fullWidth: { width: '100%' },
  disabled: { opacity: 0.45 },

  // Variants — exact match to web
  primary: {
    backgroundColor: Colors.cherry,  // #390517 dark burgundy
    shadowColor: Colors.cherry,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  secondary: {
    backgroundColor: Colors.cherryLighter,  // #F2E6EA
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: Colors.cherry,             // #390517
  },
  ghost: {
    backgroundColor: Colors.cherryLighter,  // light tint
  },
  danger: {
    backgroundColor: '#dc2626',
  },
  success: {
    backgroundColor: Colors.emerald,
  },

  // Sizes — h-8/h-10/h-12 matching web
  size_sm: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs + 2, minHeight: 36 },
  size_md: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm + 4, minHeight: 44 },
  size_lg: { paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md, minHeight: 52 },

  // Text
  text: {
    fontWeight: FontWeight.semibold,
    letterSpacing: 0.3,
    fontFamily: 'Jost_600SemiBold',
  },
  text_primary: { color: Colors.white },
  text_secondary: { color: Colors.cherry },
  text_outline: { color: Colors.cherry },
  text_ghost: { color: Colors.cherry },
  text_danger: { color: Colors.white },
  text_success: { color: Colors.white },

  textSize_sm: { fontSize: FontSize.sm },
  textSize_md: { fontSize: FontSize.sm },
  textSize_lg: { fontSize: FontSize.md },
});

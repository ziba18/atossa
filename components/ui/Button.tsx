import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { useColors, type AppColors } from '../../contexts/ThemeContext';
import { Colors } from '../../constants/colors';
import { FontSize, FontWeight, Radius, Spacing } from '../../constants/theme';

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
  const theme = useColors();
  const styles = createStyles(theme);
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
          color={variant === 'outline' || variant === 'ghost' ? theme.cherry : '#FFFFFF'}
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

function createStyles(c: AppColors) {
  return StyleSheet.create({
    base: {
      borderRadius: Radius.full,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
    },
    fullWidth: { width: '100%' },
    disabled: { opacity: 0.45 },

    primary: {
      backgroundColor: c.cherry,
      shadowColor: c.cherry,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.22,
      shadowRadius: 6,
      elevation: 3,
    },
    secondary: { backgroundColor: c.cherryLighter },
    outline: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: c.cherry },
    ghost: { backgroundColor: c.cherryLighter },
    danger: { backgroundColor: Colors.roseDeep },
    success: { backgroundColor: Colors.emerald },

    size_sm: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs + 2, minHeight: 36 },
    size_md: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm + 4, minHeight: 44 },
    size_lg: { paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md, minHeight: 52 },

    text: { fontWeight: FontWeight.semibold, letterSpacing: 0.2, fontFamily: 'Jost_600SemiBold' },
    text_primary: { color: '#FFFFFF' },
    text_secondary: { color: c.cherry },
    text_outline: { color: c.cherry },
    text_ghost: { color: c.cherry },
    text_danger: { color: '#FFFFFF' },
    text_success: { color: '#FFFFFF' },

    textSize_sm: { fontSize: FontSize.sm },
    textSize_md: { fontSize: FontSize.sm },
    textSize_lg: { fontSize: FontSize.md },
  });
}

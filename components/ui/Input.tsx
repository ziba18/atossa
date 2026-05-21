import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TextInputProps,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { useColors, type AppColors } from '../../contexts/ThemeContext';
import { Colors } from '../../constants/colors';
import { FontSize, FontWeight, Radius, Spacing } from '../../constants/theme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  rightIcon?: React.ReactNode;
  containerStyle?: ViewStyle;
}

export function Input({ label, error, hint, rightIcon, containerStyle, style, ...props }: InputProps) {
  const [focused, setFocused] = useState(false);
  const theme = useColors();
  const styles = createStyles(theme);

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[styles.inputWrapper, focused && styles.focused, !!error && styles.errorBorder]}>
        <TextInput
          style={[styles.input, style]}
          placeholderTextColor={theme.textMuted}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          {...props}
        />
        {rightIcon && <View style={styles.rightIcon}>{rightIcon}</View>}
      </View>
      {error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : hint ? (
        <Text style={styles.hint}>{hint}</Text>
      ) : null}
    </View>
  );
}

function createStyles(c: AppColors) {
  return StyleSheet.create({
    container: { marginBottom: Spacing.md },
    label: {
      fontSize: FontSize.sm,
      fontWeight: FontWeight.medium,
      fontFamily: 'Fraunces_400Regular',
      color: c.textSecondary,
      marginBottom: 6,
    },
    inputWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: Radius.md,
      backgroundColor: c.surface,
      paddingHorizontal: Spacing.md,
      minHeight: 44,
    },
    focused: {
      borderWidth: 2,
      borderColor: Colors.cherry,
    },
    errorBorder: {
      borderColor: '#f87171',
    },
    input: {
      flex: 1,
      fontSize: FontSize.md,
      fontFamily: 'Fraunces_400Regular',
      color: c.textPrimary,
      paddingVertical: Spacing.sm,
    },
    rightIcon: { marginLeft: Spacing.sm },
    errorText: {
      fontSize: FontSize.xs,
      color: '#ef4444',
      marginTop: Spacing.xs,
    },
    hint: {
      fontSize: FontSize.xs,
      color: c.textMuted,
      marginTop: Spacing.xs,
    },
  });
}

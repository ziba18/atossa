import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TextInputProps,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { Colors } from '../../constants/colors';
import { FontSize, FontWeight, Radius, Spacing } from '../../constants/theme';

// Matches web Input: rounded-xl, h-10, border-gray-200 → focus:ring-cherry, label text-sm
interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  rightIcon?: React.ReactNode;
  containerStyle?: ViewStyle;
}

export function Input({ label, error, hint, rightIcon, containerStyle, style, ...props }: InputProps) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text style={styles.label}>{label}</Text>
      )}
      <View style={[
        styles.inputWrapper,
        focused && styles.focused,
        !!error && styles.errorBorder,
      ]}>
        <TextInput
          style={[styles.input, style]}
          placeholderTextColor={Colors.textMuted}
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

const styles = StyleSheet.create({
  container: { marginBottom: Spacing.md },
  label: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    fontFamily: 'Jost_500Medium',
    color: Colors.textSecondary,   // #6b7280 — matches web text-gray-700
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',         // gray-200 — matches web border-gray-200
    borderRadius: Radius.md,        // rounded-xl — 12px
    backgroundColor: Colors.surface,  // #FFFFFF bg-white
    paddingHorizontal: Spacing.md,
    minHeight: 44,
  },
  focused: {
    borderWidth: 2,
    borderColor: Colors.cherry,     // focus:ring-cherry (#390517)
  },
  errorBorder: {
    borderColor: '#f87171',
  },
  input: {
    flex: 1,
    fontSize: FontSize.md,
    fontFamily: 'Jost_400Regular',
    color: Colors.textPrimary,      // #1a1a1a
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
    color: Colors.textMuted,
    marginTop: Spacing.xs,
  },
});

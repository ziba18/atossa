import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useColors, type AppColors } from '../../contexts/ThemeContext';
import { Colors } from '../../constants/colors';
import { Radius, Shadow } from '../../constants/theme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  elevated?: boolean;
  noPadding?: boolean;
  darkMode?: boolean;
  glass?: boolean;
  sticker?: boolean;
}

export function Card({ children, style, elevated = false, noPadding = false, darkMode, glass, sticker }: CardProps) {
  const theme = useColors();
  const styles = createStyles(theme);
  return (
    <View
      style={[
        styles.card,
        elevated && Shadow.md,
        glass && styles.glass,
        noPadding && styles.noPadding,
        darkMode && styles.cardDark,
        sticker && styles.sticker,
        style,
      ]}
    >
      {children}
    </View>
  );
}

function createStyles(c: AppColors) {
  return StyleSheet.create({
    card: {
      backgroundColor: c.surface,
      borderRadius: Radius.xxxl,
      padding: 20,
      borderWidth: 1,
      borderColor: c.border,
      ...Shadow.sm,
    },
    glass: {
      backgroundColor: c.glassBg,
      borderColor: c.glassBorder,
    },
    cardDark: {
      backgroundColor: Colors.surfaceDark,
      borderColor: Colors.borderDark,
    },
    noPadding: { padding: 0 },
    sticker: {
      borderWidth: 2,
      borderColor: '#1c1e1c',
      ...Shadow.sticker,
    },
  });
}

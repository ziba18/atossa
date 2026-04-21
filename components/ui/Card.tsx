import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Colors } from '../../constants/colors';
import { Radius, Shadow } from '../../constants/theme';

// Matches web card: rounded-2xl, border rgba(163,133,96,0.18), shadow-sm, #FFFFFF surface
interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  elevated?: boolean;
  noPadding?: boolean;
  darkMode?: boolean;
}

export function Card({ children, style, elevated = false, noPadding = false, darkMode }: CardProps) {
  return (
    <View
      style={[
        styles.card,
        elevated && Shadow.md,
        noPadding && styles.noPadding,
        darkMode && styles.cardDark,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,   // #FFFFFF
    borderRadius: Radius.xxl,          // 24px — rounded-2xl
    padding: 20,                       // p-5 = 20px
    borderWidth: 1,
    borderColor: Colors.border,        // rgba(163,133,96,0.18) warm golden
    ...Shadow.sm,
  },
  cardDark: {
    backgroundColor: Colors.surfaceDark,
    borderColor: Colors.borderDark,
  },
  noPadding: { padding: 0 },
});

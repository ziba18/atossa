import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../../constants/colors';
import { FontSize, FontWeight, Radius, Spacing } from '../../constants/theme';

// Matches web badge variants exactly
type BadgeVariant =
  | 'cherry'       // cherry-lighter bg, cherry-dark text
  | 'emerald'      // emerald-lighter bg, emerald-dark text
  | 'whiskey'      // whiskey-lighter bg, whiskey-dark text
  | 'neutral'      // gray bg
  | 'danger'       // red
  | 'low'          // same as emerald
  | 'moderate'     // same as whiskey
  | 'high'         // orange
  | 'very_high'    // red
  | 'info'         // blue
  | 'warning'      // whiskey
  | 'critical'     // orange
  | 'emergency';   // red

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
}

const VARIANT_STYLES: Record<BadgeVariant, { bg: string; color: string }> = {
  cherry:     { bg: Colors.cherryLighter, color: '#1E030C' },
  emerald:    { bg: Colors.emeraldLighter, color: Colors.emeraldDark },
  whiskey:    { bg: Colors.whiskeyLighter, color: Colors.whiskeyDark },
  neutral:    { bg: '#f3f4f6', color: '#374151' },
  danger:     { bg: '#fee2e2', color: '#991b1b' },
  low:        { bg: Colors.emeraldLighter, color: Colors.emeraldDark },
  moderate:   { bg: Colors.whiskeyLighter, color: Colors.whiskeyDark },
  high:       { bg: '#fff7ed', color: '#c2410c' },
  very_high:  { bg: '#fee2e2', color: '#991b1b' },
  info:       { bg: '#eff6ff', color: '#1d4ed8' },
  warning:    { bg: Colors.whiskeyLighter, color: Colors.whiskeyDark },
  critical:   { bg: '#fff7ed', color: '#c2410c' },
  emergency:  { bg: '#fee2e2', color: '#991b1b' },
};

export function Badge({ label, variant = 'cherry' }: BadgeProps) {
  const { bg, color } = VARIANT_STYLES[variant] ?? VARIANT_STYLES.cherry;
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[styles.text, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: Radius.full,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    fontFamily: 'Jost_600SemiBold',
  },
});

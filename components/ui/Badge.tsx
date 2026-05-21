import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { FontSize, FontWeight, Radius } from '../../constants/theme';

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
  cherry:     { bg: '#EBF5EB', color: '#1E030C' },
  emerald:    { bg: '#E8F5EE', color: '#3D8055' },
  whiskey:    { bg: '#FAF0F0', color: '#A85A5A' },
  neutral:    { bg: '#f3f4f6', color: '#374151' },
  danger:     { bg: '#fee2e2', color: '#991b1b' },
  low:        { bg: '#E8F5EE', color: '#3D8055' },
  moderate:   { bg: '#FAF0F0', color: '#A85A5A' },
  high:       { bg: '#fff7ed', color: '#c2410c' },
  very_high:  { bg: '#fee2e2', color: '#991b1b' },
  info:       { bg: '#eff6ff', color: '#1d4ed8' },
  warning:    { bg: '#FAF0F0', color: '#A85A5A' },
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
    fontFamily: 'Fraunces_500Medium',
  },
});

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../../constants/colors';
import { FontSize, FontWeight, Radius, Spacing } from '../../constants/theme';

type BadgeVariant = 'cherry' | 'emerald' | 'whiskey' | 'neutral' | 'danger';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
}

export function Badge({ label, variant = 'cherry' }: BadgeProps) {
  return (
    <View style={[styles.badge, styles[variant]]}>
      <Text style={[styles.text, styles[`text_${variant}`]]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.full,
    alignSelf: 'flex-start',
  },
  text: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold },
  cherry: { backgroundColor: Colors.cherryLighter },
  emerald: { backgroundColor: Colors.emeraldLighter },
  whiskey: { backgroundColor: Colors.whiskeyLighter },
  neutral: { backgroundColor: Colors.border },
  danger: { backgroundColor: Colors.cherryLighter },
  text_cherry: { color: Colors.cherryDark },
  text_emerald: { color: Colors.emeraldDark },
  text_whiskey: { color: Colors.whiskeyDark },
  text_neutral: { color: Colors.textSecondary },
  text_danger: { color: Colors.cherryDark },
});

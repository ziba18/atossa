import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import type { FlowIntensity } from '../../types/database';
import { Colors } from '../../constants/colors';
import { FontSize, FontWeight, Radius, Spacing } from '../../constants/theme';

const FLOW_OPTIONS: { value: FlowIntensity; label: string; emoji: string; color: string }[] = [
  { value: 'spotting',   label: 'Spotting',    emoji: '💧', color: Colors.cherryLighter },
  { value: 'light',      label: 'Light',       emoji: '🩸', color: '#FFCCD5' },
  { value: 'medium',     label: 'Medium',      emoji: '🩸', color: '#FF8FA3' },
  { value: 'heavy',      label: 'Heavy',       emoji: '🩸', color: Colors.cherry },
  { value: 'very_heavy', label: 'Very Heavy',  emoji: '🩸', color: Colors.cherryDark },
];

interface Props {
  value: FlowIntensity | null;
  onChange: (v: FlowIntensity) => void;
}

export function FlowIntensitySelector({ value, onChange }: Props) {
  return (
    <View>
      <Text style={styles.label}>Flow Intensity</Text>
      <View style={styles.row}>
        {FLOW_OPTIONS.map((opt) => {
          const selected = value === opt.value;
          return (
            <TouchableOpacity
              key={opt.value}
              onPress={() => onChange(opt.value)}
              style={[
                styles.option,
                { backgroundColor: selected ? opt.color : Colors.border },
                selected && styles.selectedOption,
              ]}
              activeOpacity={0.8}
            >
              <Text style={styles.emoji}>{opt.emoji}</Text>
              <Text style={[styles.optionLabel, selected && styles.selectedLabel]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  row: { flexDirection: 'row', gap: Spacing.xs },
  option: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
  },
  selectedOption: { borderWidth: 2, borderColor: Colors.cherryDark },
  emoji: { fontSize: 18, marginBottom: 2 },
  optionLabel: { fontSize: FontSize.xs, color: Colors.textSecondary, textAlign: 'center' },
  selectedLabel: { color: Colors.white, fontWeight: FontWeight.semibold },
});

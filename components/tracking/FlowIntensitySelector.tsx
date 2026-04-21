import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import type { FlowIntensity } from '../../types/database';
import { Icon } from '../ui/Icon';
import { Colors } from '../../constants/colors';
import { FontSize, FontWeight, Radius, Spacing } from '../../constants/theme';

const FLOW_OPTIONS: { value: FlowIntensity; label: string; iconColor: string; color: string }[] = [
  { value: 'spotting',   label: 'Spotting',   iconColor: Colors.cherry, color: Colors.cherryLighter },
  { value: 'light',      label: 'Light',      iconColor: Colors.cherry, color: '#FFCCD5' },
  { value: 'medium',     label: 'Medium',     iconColor: Colors.cherry, color: '#FF8FA3' },
  { value: 'heavy',      label: 'Heavy',      iconColor: Colors.white, color: Colors.cherry },
  { value: 'very_heavy', label: 'Very Heavy', iconColor: Colors.white, color: Colors.cherryDark },
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
              <Icon name="droplet" size={18} color={selected ? opt.iconColor : Colors.cherry} />
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
    fontFamily: 'Jost_600SemiBold',
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
  optionLabel: { fontSize: FontSize.xs, fontFamily: 'Jost_400Regular', color: Colors.textSecondary, textAlign: 'center' },
  selectedLabel: { color: Colors.white, fontFamily: 'Jost_600SemiBold' },
});

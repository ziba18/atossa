import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import type { FlowIntensity } from '../../types/database';
import { Icon } from '../ui/Icon';
import { useColors, type AppColors } from '../../contexts/ThemeContext';
import { FontSize, Radius, Spacing } from '../../constants/theme';

const FLOW_OPTIONS: { value: FlowIntensity; label: string; iconColor: string; color: string }[] = [
  { value: 'spotting',   label: 'Spotting',   iconColor: '#CB5A6E', color: '#FFE4EA' },
  { value: 'light',      label: 'Light',      iconColor: '#CB5A6E', color: '#FFCCD5' },
  { value: 'medium',     label: 'Medium',     iconColor: '#CB5A6E', color: '#FF8FA3' },
  { value: 'heavy',      label: 'Heavy',      iconColor: '#FFFFFF', color: '#CB5A6E' },
  { value: 'very_heavy', label: 'Very Heavy', iconColor: '#FFFFFF', color: '#A3304A' },
];

interface Props {
  value: FlowIntensity | null;
  onChange: (v: FlowIntensity) => void;
}

export function FlowIntensitySelector({ value, onChange }: Props) {
  const theme = useColors();
  const styles = createStyles(theme);
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
                { backgroundColor: selected ? opt.color : theme.border },
                selected && styles.selectedOption,
              ]}
              activeOpacity={0.8}
            >
              <Icon name="droplet" size={18} color={selected ? opt.iconColor : theme.cherry} />
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

function createStyles(c: AppColors) {
  return StyleSheet.create({
    label: { fontSize: FontSize.md, fontFamily: 'Fraunces_600SemiBold', color: c.textPrimary, marginBottom: Spacing.sm },
    row: { flexDirection: 'row', gap: Spacing.xs },
    option: { flex: 1, alignItems: 'center', paddingVertical: Spacing.sm, borderRadius: Radius.md },
    selectedOption: { borderWidth: 2, borderColor: '#A3304A' },
    optionLabel: { fontSize: FontSize.xs, fontFamily: 'Fraunces_400Regular', color: c.textSecondary, textAlign: 'center' },
    selectedLabel: { color: '#FFFFFF', fontFamily: 'Fraunces_600SemiBold' },
  });
}

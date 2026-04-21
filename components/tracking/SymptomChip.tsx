import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import type { SymptomType } from '../../constants/symptomTypes';
import { SYMPTOM_META } from '../../constants/symptomTypes';
import { Icon } from '../ui/Icon';
import { Colors } from '../../constants/colors';
import { FontSize, FontWeight, Radius, Spacing } from '../../constants/theme';

interface Props {
  type: SymptomType;
  selected?: boolean;
  onPress: () => void;
}

export function SymptomChip({ type, selected = false, onPress }: Props) {
  const meta = SYMPTOM_META[type];
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={[styles.chip, selected && styles.chipSelected]}
    >
      <Icon name={meta.icon} size={14} color={selected ? Colors.white : Colors.textSecondary} />
      <Text style={[styles.label, selected && styles.labelSelected]}>{meta.label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: Radius.full,
    backgroundColor: Colors.border,
    margin: Spacing.xs / 2,
  },
  chipSelected: { backgroundColor: Colors.cherry },
  label: { fontSize: FontSize.sm, fontFamily: 'Jost_500Medium', color: Colors.textSecondary },
  labelSelected: { color: Colors.white, fontFamily: 'Jost_600SemiBold' },
});

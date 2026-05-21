import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import type { SymptomType } from '../../constants/symptomTypes';
import { SYMPTOM_META } from '../../constants/symptomTypes';
import { Icon } from '../ui/Icon';
import { useColors, type AppColors } from '../../contexts/ThemeContext';
import { FontSize, Radius, Spacing } from '../../constants/theme';

interface Props {
  type: SymptomType;
  selected?: boolean;
  onPress: () => void;
}

export function SymptomChip({ type, selected = false, onPress }: Props) {
  const theme = useColors();
  const styles = createStyles(theme);
  const meta = SYMPTOM_META[type];
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={[styles.chip, selected && styles.chipSelected]}
    >
      <Icon name={meta.icon} size={14} color={selected ? '#FFFFFF' : theme.textSecondary} />
      <Text style={[styles.label, selected && styles.labelSelected]}>{meta.label}</Text>
    </TouchableOpacity>
  );
}

function createStyles(c: AppColors) {
  return StyleSheet.create({
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.xs,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.xs + 2,
      borderRadius: Radius.full,
      backgroundColor: c.border,
      margin: Spacing.xs / 2,
    },
    chipSelected: { backgroundColor: c.cherry },
    label: { fontSize: FontSize.sm, fontFamily: 'Fraunces_500Medium', color: c.textSecondary },
    labelSelected: { color: '#FFFFFF', fontFamily: 'Fraunces_600SemiBold' },
  });
}

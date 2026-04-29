import React from 'react';
import { ScrollView, TouchableOpacity, Text, StyleSheet } from 'react-native';
import type { ContentCategory } from '../../types/database';
import { useColors, type AppColors } from '../../contexts/ThemeContext';
import { FontSize, Radius, Spacing } from '../../constants/theme';

const CATEGORIES: { value: ContentCategory | 'all'; label: string }[] = [
  { value: 'all',            label: 'All' },
  { value: 'cycle_basics',   label: 'Cycle Basics' },
  { value: 'pcos',           label: 'PCOS' },
  { value: 'hormones',       label: 'Hormones' },
  { value: 'fertility',      label: 'Fertility' },
  { value: 'nutrition',      label: 'Nutrition' },
  { value: 'mental_health',  label: 'Mental Health' },
  { value: 'emergency_care', label: 'Emergency Care' },
  { value: 'teen_health',    label: 'Teen Health' },
  { value: 'menopause',      label: 'Menopause' },
];

interface Props {
  selected: ContentCategory | 'all';
  onChange: (v: ContentCategory | 'all') => void;
}

export function CategoryFilter({ selected, onChange }: Props) {
  const theme = useColors();
  const styles = createStyles(theme);
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {CATEGORIES.map((cat) => (
        <TouchableOpacity
          key={cat.value}
          onPress={() => onChange(cat.value)}
          style={[styles.chip, selected === cat.value && styles.chipActive]}
          activeOpacity={0.8}
        >
          <Text style={[styles.label, selected === cat.value && styles.labelActive]}>
            {cat.label}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

function createStyles(c: AppColors) {
  return StyleSheet.create({
    container: { paddingHorizontal: Spacing.md, gap: Spacing.xs, paddingVertical: Spacing.xs },
    chip: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs + 2, borderRadius: Radius.full, backgroundColor: c.border },
    chipActive: { backgroundColor: c.cherry },
    label: { fontSize: FontSize.sm, fontFamily: 'Jost_500Medium', color: c.textSecondary },
    labelActive: { color: '#FFFFFF', fontFamily: 'Jost_600SemiBold' },
  });
}

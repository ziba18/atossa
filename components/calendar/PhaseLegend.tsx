import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../../constants/colors';
import { useColors } from '../../contexts/ThemeContext';
import { FontSize, Radius, Spacing } from '../../constants/theme';

const PHASES = [
  { label: 'Menstrual',  color: Colors.menstrual },
  { label: 'Follicular', color: Colors.follicular },
  { label: 'Fertile',    color: Colors.matchaDeep },
  { label: 'Ovulation',  color: Colors.ovulation },
  { label: 'Luteal',     color: Colors.luteal },
];

export function PhaseLegend() {
  const theme = useColors();
  return (
    <View style={styles.row}>
      {PHASES.map((p) => (
        <View key={p.label} style={styles.item}>
          <View style={[styles.dot, { backgroundColor: p.color }]} />
          <Text style={[styles.label, { color: theme.textSecondary }]}>{p.label}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-around', flexWrap: 'wrap', paddingVertical: Spacing.sm, paddingHorizontal: Spacing.md, gap: 4 },
  item: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dot: { width: 8, height: 8, borderRadius: Radius.full },
  label: { fontSize: 10, fontFamily: 'CormorantGaramond_400Regular' },
});

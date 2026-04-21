import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../../constants/colors';
import { FontSize, Radius, Spacing } from '../../constants/theme';

const PHASES = [
  { label: 'Period',     color: Colors.menstrual },
  { label: 'Predicted', color: Colors.cherryLighter },
  { label: 'Fertile',   color: Colors.emerald },
  { label: 'Ovulation', color: Colors.whiskey },
];

export function PhaseLegend() {
  return (
    <View style={styles.row}>
      {PHASES.map((p) => (
        <View key={p.label} style={styles.item}>
          <View style={[styles.dot, { backgroundColor: p.color }]} />
          <Text style={styles.label}>{p.label}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: Spacing.sm },
  item: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dot: { width: 10, height: 10, borderRadius: Radius.full },
  label: { fontSize: FontSize.xs, fontFamily: 'Jost_400Regular', color: Colors.textSecondary },
});

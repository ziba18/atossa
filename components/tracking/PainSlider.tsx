import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Slider from '@react-native-community/slider';
import { Colors } from '../../constants/colors';
import { useColors, type AppColors } from '../../contexts/ThemeContext';
import { FontSize, FontWeight, Spacing } from '../../constants/theme';

interface Props {
  value: number;
  onChange: (v: number) => void;
  label?: string;
}

export function PainSlider({ value, onChange, label = 'Severity' }: Props) {
  const theme = useColors();
  const styles = createStyles(theme);

  const getColor = () => {
    if (value <= 3) return Colors.severity1;
    if (value <= 6) return Colors.severity4;
    if (value <= 8) return Colors.severity7;
    return Colors.severity10;
  };

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Text style={styles.label}>{label}</Text>
        <Text style={[styles.value, { color: getColor() }]}>{value}/10</Text>
      </View>
      <Slider
        minimumValue={1}
        maximumValue={10}
        step={1}
        value={value}
        onValueChange={onChange}
        minimumTrackTintColor={getColor()}
        maximumTrackTintColor={theme.border}
        thumbTintColor={getColor()}
      />
      <View style={styles.hints}>
        <Text style={styles.hint}>Mild</Text>
        <Text style={styles.hint}>Moderate</Text>
        <Text style={styles.hint}>Severe</Text>
      </View>
    </View>
  );
}

function createStyles(c: AppColors) {
  return StyleSheet.create({
    container: { marginVertical: Spacing.sm },
    row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.xs },
    label: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: c.textPrimary },
    value: { fontSize: FontSize.lg, fontWeight: FontWeight.bold },
    hints: { flexDirection: 'row', justifyContent: 'space-between', marginTop: -Spacing.xs },
    hint: { fontSize: FontSize.xs, color: c.textMuted },
  });
}

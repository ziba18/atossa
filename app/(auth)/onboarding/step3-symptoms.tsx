import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '../../../components/ui/Button';
import { SymptomChip } from '../../../components/tracking/SymptomChip';
import { SafeScreen } from '../../../components/layout/SafeScreen';
import { SYMPTOM_META, type SymptomType } from '../../../constants/symptomTypes';
import { useColors, type AppColors } from '../../../contexts/ThemeContext';
import { Colors } from '../../../constants/colors';
import { FontSize, FontWeight, Spacing } from '../../../constants/theme';

const COMMON_SYMPTOMS: SymptomType[] = [
  'cramps', 'bloating', 'headache', 'mood_swings', 'acne',
  'fatigue', 'back_pain', 'breast_tenderness', 'nausea', 'insomnia',
  'anxiety', 'hair_loss', 'excessive_hair_growth',
];

export default function Step3Symptoms() {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<SymptomType>>(new Set());

  const toggle = (type: SymptomType) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type); else next.add(type);
      return next;
    });
  };

  const theme = useColors();
  const styles = createStyles(theme);

  return (
    <SafeScreen>
      <View style={styles.progress}>
        <Text style={styles.step}>Step 3 of 5</Text>
        <View style={styles.progressBar}><View style={[styles.fill, { width: '60%' }]} /></View>
      </View>
      <Text style={styles.title}>Common Symptoms</Text>
      <Text style={styles.subtitle}>Select any symptoms you typically experience. This helps personalize your tracking.</Text>
      <View style={styles.chips}>
        {COMMON_SYMPTOMS.map((type) => (
          <SymptomChip key={type} type={type} selected={selected.has(type)} onPress={() => toggle(type)} />
        ))}
      </View>
      <Button
        label={selected.size > 0 ? `Next → (${selected.size} selected)` : 'Skip for now'}
        onPress={() => router.push('/(auth)/onboarding/step4-notifications')}
        size="lg"
        fullWidth
        style={styles.btn}
      />
    </SafeScreen>
  );
}

function createStyles(c: AppColors) {
  return StyleSheet.create({
    progress: { marginBottom: Spacing.xl },
    step: { fontSize: FontSize.sm, fontFamily: 'CormorantGaramond_400Regular', color: c.textMuted, marginBottom: Spacing.xs },
    progressBar: { height: 4, backgroundColor: c.border, borderRadius: 2 },
    fill: { height: 4, backgroundColor: Colors.cherry, borderRadius: 2 },
    title: { fontSize: 28, fontFamily: 'CormorantGaramond_500Medium_Italic', color: c.textPrimary, marginBottom: Spacing.sm },
    subtitle: { fontSize: FontSize.md, fontFamily: 'CormorantGaramond_400Regular', color: c.textMuted, marginBottom: Spacing.xl, lineHeight: 22 },
    chips: { flexDirection: 'row', flexWrap: 'wrap' },
    btn: { marginTop: Spacing.xl },
  });
}

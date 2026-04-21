import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../../stores/authStore';
import { supabase } from '../../../lib/supabase';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { SafeScreen } from '../../../components/layout/SafeScreen';
import { Colors } from '../../../constants/colors';
import { FontSize, FontWeight, Spacing } from '../../../constants/theme';

const CYCLE_OPTIONS = [21, 25, 28, 30, 35];

export default function Step1Basics() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [cycleLength, setCycleLength] = useState(28);
  const [periodLength, setPeriodLength] = useState(5);
  const [loading, setLoading] = useState(false);

  const handleNext = async () => {
    if (!user) return;
    setLoading(true);
    await supabase.from('profiles').update({
      average_cycle_length: cycleLength,
      average_period_length: periodLength,
    }).eq('id', user.id);
    setLoading(false);
    router.push('/(auth)/onboarding/step2-last-period');
  };

  return (
    <SafeScreen>
      <View style={styles.progress}>
        <Text style={styles.step}>Step 1 of 5</Text>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: '20%' }]} />
        </View>
      </View>

      <Text style={styles.title}>About Your Cycle</Text>
      <Text style={styles.subtitle}>
        This helps us give you more accurate predictions. You can update these anytime.
      </Text>

      <Text style={styles.label}>How long is your average cycle?</Text>
      <View style={styles.options}>
        {CYCLE_OPTIONS.map((opt) => (
          <TouchableOpacity
            key={opt}
            onPress={() => setCycleLength(opt)}
            style={[styles.option, cycleLength === opt && styles.optionSelected]}
          >
            <Text style={[styles.optionText, cycleLength === opt && styles.optionTextSelected]}>
              {opt} days
            </Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity
          onPress={() => {}}
          style={[styles.option, !CYCLE_OPTIONS.includes(cycleLength) && styles.optionSelected]}
        >
          <Text style={styles.optionText}>Custom</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.label}>How long does your period usually last?</Text>
      <View style={styles.options}>
        {[3, 4, 5, 6, 7].map((opt) => (
          <TouchableOpacity
            key={opt}
            onPress={() => setPeriodLength(opt)}
            style={[styles.option, periodLength === opt && styles.optionSelected]}
          >
            <Text style={[styles.optionText, periodLength === opt && styles.optionTextSelected]}>
              {opt} days
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Button label="Next →" onPress={handleNext} loading={loading} size="lg" fullWidth style={styles.btn} />
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  progress: { marginBottom: Spacing.xl },
  step: { fontSize: FontSize.sm, fontFamily: 'Jost_400Regular', color: Colors.textMuted, marginBottom: Spacing.xs },
  progressBar: { height: 4, backgroundColor: Colors.border, borderRadius: 2 },
  progressFill: { height: 4, backgroundColor: Colors.cherry, borderRadius: 2 },
  title: { fontSize: 28, fontFamily: 'CormorantGaramond_600SemiBold', color: Colors.textPrimary, marginBottom: Spacing.sm },
  subtitle: { fontSize: FontSize.md, fontFamily: 'Jost_400Regular', color: Colors.textMuted, marginBottom: Spacing.xl, lineHeight: 22 },
  label: { fontSize: FontSize.md, fontFamily: 'Jost_600SemiBold', color: Colors.textPrimary, marginBottom: Spacing.sm, marginTop: Spacing.md },
  options: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  option: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 99,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  optionSelected: { backgroundColor: Colors.cherry, borderColor: Colors.cherry },
  optionText: { fontSize: FontSize.sm, fontFamily: 'Jost_400Regular', color: Colors.textSecondary },
  optionTextSelected: { color: Colors.white, fontFamily: 'Jost_600SemiBold' },
  btn: { marginTop: Spacing.xxl },
});

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../../stores/authStore';
import { supabase } from '../../../lib/supabase';
import { Button } from '../../../components/ui/Button';
import { SafeScreen } from '../../../components/layout/SafeScreen';
import { useColors, type AppColors } from '../../../contexts/ThemeContext';
import { Colors } from '../../../constants/colors';
import { FontSize, Spacing } from '../../../constants/theme';

const CYCLE_OPTIONS = [21, 25, 28, 30, 35];
const PERIOD_OPTIONS = [3, 4, 5, 6, 7];

const UNKNOWN = 'unknown' as const;
type Choice<T> = T | typeof UNKNOWN;

export default function Step1Basics() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [cycleLength, setCycleLength] = useState<Choice<number>>(28);
  const [periodLength, setPeriodLength] = useState<Choice<number>>(5);
  const [loading, setLoading] = useState(false);

  const [customOpen, setCustomOpen] = useState(false);
  const [customDraft, setCustomDraft] = useState('');

  const isCustomCycle =
    cycleLength !== UNKNOWN && !CYCLE_OPTIONS.includes(cycleLength as number);

  const handleCustomSave = () => {
    const n = parseInt(customDraft, 10);
    if (Number.isFinite(n) && n >= 14 && n <= 60) {
      setCycleLength(n);
      setCustomOpen(false);
    }
  };

  const handleNext = async () => {
    if (!user) return;
    setLoading(true);
    // For "I don't know" we fall back to clinical defaults so predictions
    // can still run; the user can update either later from their profile.
    const cycleLen = cycleLength === UNKNOWN ? 28 : (cycleLength as number);
    const periodLen = periodLength === UNKNOWN ? 5 : (periodLength as number);
    await supabase.from('profiles').update({
      average_cycle_length: cycleLen,
      average_period_length: periodLen,
    }).eq('id', user.id);
    setLoading(false);
    router.push('/(auth)/onboarding/step2-last-period');
  };

  const theme = useColors();
  const styles = createStyles(theme);

  return (
    <SafeScreen>
      <View style={styles.progress}>
        <Text style={styles.step}>Step 1 of 5</Text>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: '20%' }]} />
        </View>
      </View>

      <Text style={styles.title}>About your cycle</Text>
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
          onPress={() => {
            setCustomDraft(isCustomCycle ? String(cycleLength) : '');
            setCustomOpen(true);
          }}
          style={[styles.option, isCustomCycle && styles.optionSelected]}
        >
          <Text style={[styles.optionText, isCustomCycle && styles.optionTextSelected]}>
            {isCustomCycle ? `${cycleLength} days` : 'Custom'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setCycleLength(UNKNOWN)}
          style={[styles.option, cycleLength === UNKNOWN && styles.optionSelected]}
        >
          <Text style={[styles.optionText, cycleLength === UNKNOWN && styles.optionTextSelected]}>
            I don't know
          </Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.label}>How long does your period usually last?</Text>
      <View style={styles.options}>
        {PERIOD_OPTIONS.map((opt) => (
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
        <TouchableOpacity
          onPress={() => setPeriodLength(UNKNOWN)}
          style={[styles.option, periodLength === UNKNOWN && styles.optionSelected]}
        >
          <Text style={[styles.optionText, periodLength === UNKNOWN && styles.optionTextSelected]}>
            I don't know
          </Text>
        </TouchableOpacity>
      </View>

      <Button label="Next" onPress={handleNext} loading={loading} size="lg" fullWidth style={styles.btn} />

      <Modal
        visible={customOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setCustomOpen(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalBackdrop}
        >
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Custom cycle length</Text>
            <Text style={styles.modalHint}>Enter a number between 14 and 60 days.</Text>
            <TextInput
              value={customDraft}
              onChangeText={setCustomDraft}
              keyboardType="number-pad"
              autoFocus
              maxLength={2}
              placeholder="e.g. 32"
              placeholderTextColor={theme.textMuted}
              style={styles.modalInput}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setCustomOpen(false)} style={styles.modalCancel}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleCustomSave} style={styles.modalSave}>
                <Text style={styles.modalSaveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeScreen>
  );
}

function createStyles(c: AppColors) {
  return StyleSheet.create({
    progress: { marginBottom: Spacing.xl },
    step: { fontSize: FontSize.sm, fontFamily: 'CormorantGaramond_400Regular', color: c.textMuted, marginBottom: Spacing.xs },
    progressBar: { height: 4, backgroundColor: c.border, borderRadius: 2 },
    progressFill: { height: 4, backgroundColor: Colors.cherry, borderRadius: 2 },
    title: { fontSize: 28, fontFamily: 'CormorantGaramond_500Medium_Italic', color: c.textPrimary, marginBottom: Spacing.sm },
    subtitle: { fontSize: FontSize.md, fontFamily: 'CormorantGaramond_400Regular', color: c.textMuted, marginBottom: Spacing.xl, lineHeight: 22 },
    label: { fontSize: FontSize.md, fontFamily: 'CormorantGaramond_600SemiBold', color: c.textPrimary, marginBottom: Spacing.sm, marginTop: Spacing.md },
    options: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
    option: {
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      borderRadius: 99,
      borderWidth: 1.5,
      borderColor: c.border,
    },
    optionSelected: { backgroundColor: Colors.cherry, borderColor: Colors.cherry },
    optionText: { fontSize: FontSize.sm, fontFamily: 'CormorantGaramond_500Medium', color: c.textSecondary },
    optionTextSelected: { color: Colors.white, fontFamily: 'CormorantGaramond_600SemiBold' },
    btn: { marginTop: Spacing.xxl },

    modalBackdrop: {
      flex: 1,
      backgroundColor: 'rgba(42,31,38,0.5)',
      alignItems: 'center',
      justifyContent: 'center',
      padding: Spacing.lg,
    },
    modalCard: {
      width: '100%',
      maxWidth: 360,
      backgroundColor: c.surface,
      borderRadius: 20,
      padding: Spacing.lg,
      gap: Spacing.sm,
    },
    modalTitle: { fontSize: FontSize.lg, fontFamily: 'CormorantGaramond_600SemiBold', color: c.textPrimary },
    modalHint: { fontSize: FontSize.sm, fontFamily: 'CormorantGaramond_400Regular', color: c.textMuted },
    modalInput: {
      borderWidth: 1.5,
      borderColor: c.border,
      borderRadius: 12,
      paddingHorizontal: Spacing.md,
      paddingVertical: 12,
      fontSize: FontSize.lg,
      fontFamily: 'CormorantGaramond_500Medium',
      color: c.textPrimary,
      marginTop: Spacing.xs,
    },
    modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: Spacing.sm, marginTop: Spacing.sm },
    modalCancel: { paddingVertical: 10, paddingHorizontal: 16 },
    modalCancelText: { fontSize: FontSize.sm, fontFamily: 'CormorantGaramond_500Medium', color: c.textSecondary },
    modalSave: { backgroundColor: Colors.cherry, borderRadius: 99, paddingVertical: 10, paddingHorizontal: 20 },
    modalSaveText: { fontSize: FontSize.sm, fontFamily: 'CormorantGaramond_600SemiBold', color: Colors.white },
  });
}

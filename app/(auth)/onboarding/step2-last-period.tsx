import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Calendar } from 'react-native-calendars';
import { useAuthStore } from '../../../stores/authStore';
import { supabase } from '../../../lib/supabase';
import { Button } from '../../../components/ui/Button';
import { SafeScreen } from '../../../components/layout/SafeScreen';
import { useColors, type AppColors } from '../../../contexts/ThemeContext';
import { Colors } from '../../../constants/colors';
import { FontSize, FontWeight, Spacing } from '../../../constants/theme';
import { toDateStr } from '../../../algorithms/dateHelpers';

export default function Step2LastPeriod() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleNext = async () => {
    if (!selectedDate || !user) { Alert.alert('Please select a date.'); return; }
    setLoading(true);
    await supabase.from('cycle_logs').insert({
      user_id: user.id,
      period_start: selectedDate,
      is_confirmed: true,
    });
    setLoading(false);
    router.push('/(auth)/onboarding/step3-symptoms');
  };

  const theme = useColors();
  const styles = createStyles(theme);

  return (
    <SafeScreen>
      <View style={styles.progress}>
        <Text style={styles.step}>Step 2 of 5</Text>
        <View style={styles.progressBar}><View style={[styles.fill, { width: '40%' }]} /></View>
      </View>
      <Text style={styles.title}>When did your last period start?</Text>
      <Text style={styles.subtitle}>Select the first day of your most recent period.</Text>
      <Calendar
        maxDate={toDateStr(new Date())}
        markedDates={selectedDate ? { [selectedDate]: { selected: true, selectedColor: Colors.cherry } } : {}}
        onDayPress={(day: any) => setSelectedDate(day.dateString)}
        theme={{ todayTextColor: Colors.cherry, arrowColor: Colors.cherry, selectedDayBackgroundColor: Colors.cherry }}
      />
      {selectedDate && (
        <Text style={styles.selected}>Selected: {selectedDate}</Text>
      )}
      <Button label="Next →" onPress={handleNext} loading={loading} size="lg" fullWidth style={styles.btn} disabled={!selectedDate} />
    </SafeScreen>
  );
}

function createStyles(c: AppColors) {
  return StyleSheet.create({
    progress: { marginBottom: Spacing.xl },
    step: { fontSize: FontSize.sm, fontFamily: 'Jost_400Regular', color: c.textMuted, marginBottom: Spacing.xs },
    progressBar: { height: 4, backgroundColor: c.border, borderRadius: 2 },
    fill: { height: 4, backgroundColor: Colors.cherry, borderRadius: 2 },
    title: { fontSize: 28, fontFamily: 'CormorantGaramond_600SemiBold', color: c.textPrimary, marginBottom: Spacing.sm },
    subtitle: { fontSize: FontSize.md, fontFamily: 'Jost_400Regular', color: c.textMuted, marginBottom: Spacing.lg, lineHeight: 22 },
    selected: { fontSize: FontSize.sm, fontFamily: 'Jost_500Medium', color: Colors.cherry, textAlign: 'center', marginTop: Spacing.sm },
    btn: { marginTop: Spacing.xl },
  });
}

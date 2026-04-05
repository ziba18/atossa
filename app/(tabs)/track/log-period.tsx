import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, Alert, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Calendar } from 'react-native-calendars';
import { useAuthStore } from '../../../stores/authStore';
import { useCycleStore } from '../../../stores/cycleStore';
import { FlowIntensitySelector } from '../../../components/tracking/FlowIntensitySelector';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Header } from '../../../components/layout/Header';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { FlowIntensity } from '../../../types/database';
import { Colors } from '../../../constants/colors';
import { FontSize, FontWeight, Radius, Spacing } from '../../../constants/theme';
import { toDateStr } from '../../../algorithms/dateHelpers';

function generateRangeDates(start: string | null, end: string | null) {
  if (!start) return {};
  if (!end || end === start) {
    return {
      [start]: { startingDay: true, endingDay: true, color: Colors.cherry, textColor: Colors.white },
    };
  }
  const marked: Record<string, any> = {};
  const cur = new Date(start + 'T00:00:00');
  const last = new Date(end + 'T00:00:00');
  while (cur <= last) {
    const d = toDateStr(cur);
    if (d === start) {
      marked[d] = { startingDay: true, color: Colors.cherry, textColor: Colors.white };
    } else if (d === end) {
      marked[d] = { endingDay: true, color: Colors.cherry, textColor: Colors.white };
    } else {
      marked[d] = { color: Colors.cherryLighter, textColor: Colors.cherry };
    }
    cur.setDate(cur.getDate() + 1);
  }
  return marked;
}

function formatDate(d: string) {
  const dt = new Date(d + 'T00:00:00');
  return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function LogPeriodScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { addCycleLog } = useCycleStore();

  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);
  const [selecting, setSelecting] = useState<'start' | 'end'>('start');
  const [flow, setFlow] = useState<FlowIntensity | null>(null);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const markedDates = useMemo(() => generateRangeDates(startDate, endDate), [startDate, endDate]);

  const handleDayPress = (day: any) => {
    const d: string = day.dateString;
    if (selecting === 'start') {
      setStartDate(d);
      setEndDate(null);
      setSelecting('end');
    } else {
      if (startDate && d < startDate) {
        // Tapped before start — reset with new start
        setStartDate(d);
        setEndDate(null);
      } else {
        setEndDate(d);
      }
    }
  };

  const handleClear = () => {
    setStartDate(null);
    setEndDate(null);
    setSelecting('start');
  };

  const handleSave = async () => {
    if (!startDate || !user) {
      Alert.alert('Missing Date', 'Please select a start date.');
      return;
    }
    setLoading(true);
    await addCycleLog({
      user_id: user.id,
      period_start: startDate,
      period_end: endDate ?? undefined,
      flow_intensity: flow ?? undefined,
      notes: notes || undefined,
      is_confirmed: true,
    });
    setLoading(false);
    Alert.alert('Logged!', 'Your period has been recorded.', [
      { text: 'OK', onPress: () => router.back() },
    ]);
  };

  const periodDays =
    startDate && endDate
      ? Math.round(
          (new Date(endDate + 'T00:00:00').getTime() - new Date(startDate + 'T00:00:00').getTime()) /
            86400000
        ) + 1
      : null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
      <Header title="Log Period" showBack />
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">

        {/* Date selection cards */}
        <View style={styles.dateRow}>
          <TouchableOpacity
            style={[styles.dateCard, selecting === 'start' && styles.dateCardActive]}
            onPress={() => setSelecting('start')}
            activeOpacity={0.8}
          >
            <Text style={styles.dateCardLabel}>Start Date</Text>
            <Text style={[styles.dateCardValue, !startDate && styles.dateCardPlaceholder]}>
              {startDate ? formatDate(startDate) : 'Tap to select'}
            </Text>
          </TouchableOpacity>

          <View style={styles.dateSeparator}>
            <Text style={styles.dateSeparatorText}>→</Text>
          </View>

          <TouchableOpacity
            style={[
              styles.dateCard,
              selecting === 'end' && startDate && styles.dateCardActive,
              !startDate && styles.dateCardDisabled,
            ]}
            onPress={() => startDate && setSelecting('end')}
            activeOpacity={startDate ? 0.8 : 1}
          >
            <Text style={styles.dateCardLabel}>End Date</Text>
            <Text style={[styles.dateCardValue, !endDate && styles.dateCardPlaceholder]}>
              {endDate ? formatDate(endDate) : 'Optional'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Summary row */}
        <View style={styles.summaryRow}>
          {periodDays ? (
            <Text style={styles.summaryText}>
              🩸 {periodDays} day{periodDays !== 1 ? 's' : ''} selected
            </Text>
          ) : startDate ? (
            <Text style={styles.summaryHint}>
              {selecting === 'end' ? 'Now tap an end date on the calendar' : 'Tap a date to change start'}
            </Text>
          ) : (
            <Text style={styles.summaryHint}>Tap a date on the calendar to begin</Text>
          )}
          {startDate && (
            <TouchableOpacity onPress={handleClear}>
              <Text style={styles.clearText}>Clear</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Single calendar for range selection */}
        <Calendar
          markingType="period"
          maxDate={toDateStr(new Date())}
          markedDates={markedDates}
          onDayPress={handleDayPress}
          theme={{
            arrowColor: Colors.cherry,
            todayTextColor: Colors.cherry,
            textDayFontSize: 14,
            textMonthFontWeight: FontWeight.semibold as any,
          }}
          style={styles.calendar}
        />

        <View style={styles.section}>
          <Text style={styles.label}>Flow Intensity</Text>
          <FlowIntensitySelector value={flow} onChange={setFlow} />
        </View>

        <Input
          label="Notes (optional)"
          value={notes}
          onChangeText={setNotes}
          placeholder="Any notes about this period..."
          multiline
          numberOfLines={3}
        />

        <Button
          label="Save Period Log"
          onPress={handleSave}
          loading={loading}
          size="lg"
          fullWidth
          style={styles.btn}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { padding: Spacing.md, paddingBottom: Spacing.xxl },

  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  dateCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: Colors.border,
    padding: Spacing.md,
  },
  dateCardActive: {
    borderColor: Colors.cherry,
    backgroundColor: Colors.cherryLighter,
  },
  dateCardDisabled: {
    opacity: 0.5,
  },
  dateCardLabel: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  dateCardValue: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },
  dateCardPlaceholder: {
    color: Colors.textMuted,
    fontWeight: FontWeight.regular,
  },
  dateSeparator: { alignItems: 'center' },
  dateSeparatorText: { fontSize: FontSize.lg, color: Colors.textMuted },

  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
    minHeight: 20,
  },
  summaryText: { fontSize: FontSize.sm, color: Colors.cherry, fontWeight: FontWeight.semibold },
  summaryHint: { fontSize: FontSize.sm, color: Colors.textMuted },
  clearText: { fontSize: FontSize.sm, color: Colors.cherry, fontWeight: FontWeight.semibold },

  calendar: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },

  section: { marginTop: Spacing.lg },
  label: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  btn: { marginTop: Spacing.xl },
});

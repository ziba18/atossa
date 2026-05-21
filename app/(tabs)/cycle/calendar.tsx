import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { addMonths, endOfMonth, parseISO, startOfMonth } from 'date-fns';
import { useAuthStore } from '../../../stores/authStore';
import { useCycleStore } from '../../../stores/cycleStore';
import { supabase } from '../../../lib/supabase';
import { AuroraBackground } from '../../../components/layout/AuroraBackground';
import { MonthGrid } from '../../../components/calendar/MonthGrid';
import { DayEditorSheet } from '../../../components/calendar/DayEditorSheet';
import { Icon } from '../../../components/ui/Icon';
import { deriveCalendar } from '../../../algorithms/calendarDerive';
import { toDateStr } from '../../../algorithms/dateHelpers';
import { Colors } from '../../../constants/colors';
import { FontFamily, Spacing } from '../../../constants/theme';
import type { CycleLog } from '../../../types/database';

// ── Phase legend chips (Aura-style) ─────────────────────────────────────────
const PHASES = [
  { key: 'period',     label: 'Period',     color: '#E5A5AD' },
  { key: 'follicular', label: 'Follicular', color: '#CCE2CD' },
  { key: 'ovulation',  label: 'Ovulation',  color: '#BFD6EC' },
  { key: 'luteal',     label: 'Luteal',     color: '#F2E5C9' },
] as const;

export default function CycleCalendarScreen() {
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const { cycleLogs, prediction, fetchCycleLogs, recomputePrediction } = useCycleStore();

  // ── Selection state ───────────────────────────────────────────────────────
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    if (user) fetchCycleLogs(user.id);
  }, [user]);

  // ── Month list: past 3 → current → next 6 ─────────────────────────────────
  const today = useMemo(() => new Date(), []);
  const months = useMemo(() => {
    const arr: Date[] = [];
    for (let i = -3; i <= 6; i++) arr.push(addMonths(startOfMonth(today), i));
    return arr;
  }, [today]);

  // ── Derive per-day phase map across the whole visible range ──────────────
  const calendar = useMemo(() => {
    const start = toDateStr(startOfMonth(months[0]));
    const end   = toDateStr(endOfMonth(months[months.length - 1]));
    return deriveCalendar(cycleLogs, prediction, start, end);
  }, [cycleLogs, prediction, months]);

  const selectedInfo = selected ? calendar.get(selected) : undefined;

  // ── Edit handlers — all go through the store so AI + EWMA pipeline reruns ─
  const refresh = useCallback(async () => {
    if (!user) return;
    await fetchCycleLogs(user.id);
    await recomputePrediction(user.id);
  }, [user]);

  const onMarkStart = useCallback(async (date: string) => {
    if (!user) return;
    // If there's an existing log within 12 days, treat as edit-start.
    const nearby = cycleLogs.find(
      (l) => Math.abs(
        parseISO(l.period_start).getTime() - parseISO(date).getTime(),
      ) < 12 * 86400000,
    );
    if (nearby) {
      await supabase.from('cycle_logs').update({ period_start: date }).eq('id', nearby.id);
    } else {
      await supabase.from('cycle_logs').insert({
        user_id: user.id,
        period_start: date,
        period_length: 5,
        flow_intensity: 'medium',
        is_confirmed: true,
      });
    }
    await refresh();
  }, [user, cycleLogs, refresh]);

  const onMarkEnd = useCallback(async (date: string) => {
    if (!user) return;
    // Find the most recent log whose start ≤ date.
    const candidate = [...cycleLogs]
      .filter((l) => l.period_start <= date)
      .sort((a, b) => b.period_start.localeCompare(a.period_start))[0];
    if (!candidate) return;
    const periodLength = Math.max(2, Math.min(10,
      Math.round((parseISO(date).getTime() - parseISO(candidate.period_start).getTime()) / 86400000) + 1
    ));
    await supabase
      .from('cycle_logs')
      .update({ period_end: date, period_length: periodLength })
      .eq('id', candidate.id);
    await refresh();
  }, [user, cycleLogs, refresh]);

  const onClear = useCallback(async (date: string) => {
    if (!user) return;
    const log = cycleLogs.find((l: CycleLog) => l.period_start === date);
    if (log) {
      await supabase.from('cycle_logs').delete().eq('id', log.id);
    } else {
      // Date falls inside an existing range — clear the end so the cycle re-opens.
      const inRange = cycleLogs.find((l) => l.period_start <= date && (l.period_end ?? '') >= date);
      if (inRange) {
        await supabase.from('cycle_logs').update({ period_end: null }).eq('id', inRange.id);
      }
    }
    await refresh();
  }, [user, cycleLogs, refresh]);

  // ── Render ────────────────────────────────────────────────────────────────
  const bottomPad = 96 + insets.bottom;

  return (
    <View style={styles.screen}>
      <AuroraBackground />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: bottomPad }}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.kicker}>YOUR TIMELINE</Text>
            <Text style={styles.title}>Calendar</Text>
          </View>

          {/* Legend */}
          <View style={styles.legendCard}>
            {PHASES.map((p) => (
              <View key={p.key} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: p.color }]} />
                <Text style={styles.legendLabel}>{p.label}</Text>
              </View>
            ))}
          </View>

          {/* Solid vs Dashed hint */}
          <View style={styles.hintCard}>
            <Text style={styles.hintCardTitle}>
              Avg {prediction?.predicted_cycle_length ?? 28}d cycle
            </Text>
            <View style={styles.hintRow}>
              <View style={styles.hintInline}>
                <View style={[styles.hintSwatch, { backgroundColor: '#E5A5AD' }]} />
                <Text style={styles.hintText}>logged</Text>
              </View>
              <View style={styles.hintInline}>
                <View style={[styles.hintSwatch, { backgroundColor: 'transparent', borderColor: '#E5A5AD', borderWidth: 1.4, borderStyle: 'dashed' }]} />
                <Text style={styles.hintText}>predicted</Text>
              </View>
            </View>
          </View>

          {/* Month stack */}
          {months.map((m) => (
            <MonthGrid
              key={toDateStr(m)}
              month={m}
              calendar={calendar}
              today={today}
              onSelectDay={(d) => setSelected(d)}
            />
          ))}
        </ScrollView>
      </SafeAreaView>

      {/* Day editor sheet */}
      <DayEditorSheet
        open={!!selected}
        date={selected}
        info={selectedInfo}
        onClose={() => setSelected(null)}
        onMarkStart={onMarkStart}
        onMarkEnd={onMarkEnd}
        onClear={onClear}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  header: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  kicker: {
    fontFamily: 'Fraunces_500Medium',
    fontSize: 10,
    color: 'rgba(63,47,74,0.50)',
    letterSpacing: 3.5,
  },
  title: {
    fontFamily: FontFamily.displayItalic,
    fontSize: 40,
    color: Colors.ink,
    marginTop: 2,
  },

  legendCard: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: Spacing.md,
    marginTop: Spacing.sm,
    padding: Spacing.sm + 2,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.55)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.65)',
    gap: 14,
    justifyContent: 'space-around',
  },
  legendItem: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
  },
  legendDot: {
    width: 10, height: 10, borderRadius: 5,
  },
  legendLabel: {
    fontFamily: 'Fraunces_400Regular',
    fontSize: 11,
    color: 'rgba(63,47,74,0.78)',
  },

  hintCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: Spacing.md,
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.45)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
  },
  hintCardTitle: {
    fontFamily: FontFamily.displayItalic,
    fontSize: 16,
    color: Colors.ink,
  },
  hintRow: {
    flexDirection: 'row',
    gap: 10,
  },
  hintInline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  hintSwatch: {
    width: 10, height: 10, borderRadius: 4,
  },
  hintText: {
    fontFamily: 'Fraunces_400Regular',
    fontSize: 10,
    color: 'rgba(63,47,74,0.65)',
    letterSpacing: 1,
  },
});

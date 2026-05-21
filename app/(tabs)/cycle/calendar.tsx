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
import { deriveCalendar } from '../../../algorithms/calendarDerive';
import { toDateStr } from '../../../algorithms/dateHelpers';
import { Colors } from '../../../constants/colors';
import { FontFamily, Spacing } from '../../../constants/theme';
import { Type } from '../../../constants/typography';
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

  // ── Edit handlers — semantics match Aura's lib/cycle/store.ts exactly ────
  //   markStart: if a logged period exists within 10 days, REPLACE its start.
  //              Otherwise INSERT a new period.
  //   markEnd:   find most recent period with start ≤ date, set its end.
  //              If no such period exists, no-op.
  //   clear:     if the date IS a period_start → delete the period.
  //              If the date IS a period_end   → clear the end (keep period).
  // After every mutation we re-fetch + re-compute so the prediction layer
  // (AI/EWMA) updates and the calendar visually refreshes.

  const refresh = useCallback(async () => {
    if (!user) return;
    await fetchCycleLogs(user.id);
    await recomputePrediction(user.id);
  }, [user, fetchCycleLogs, recomputePrediction]);

  const onMarkStart = useCallback(async (date: string) => {
    if (!user) return;
    const tenDaysMs = 10 * 86400000;
    const dateMs = parseISO(date).getTime();
    // Match Aura: any logged period within 10 days → edit its start.
    const nearby = cycleLogs.find(
      (l) => Math.abs(parseISO(l.period_start).getTime() - dateMs) < tenDaysMs,
    );
    if (nearby) {
      // If we're moving the start earlier than its current end, recompute the
      // period_length to keep the row internally consistent.
      let patch: { period_start: string; period_length?: number | null } = { period_start: date };
      if (nearby.period_end) {
        const lenDays = Math.round(
          (parseISO(nearby.period_end).getTime() - dateMs) / 86400000,
        ) + 1;
        if (lenDays < 1) {
          // Start moved past the end → clear the end, since it's now invalid.
          patch = { period_start: date, period_length: null };
          await supabase.from('cycle_logs')
            .update({ ...patch, period_end: null })
            .eq('id', nearby.id);
        } else {
          patch.period_length = Math.min(10, lenDays);
          await supabase.from('cycle_logs').update(patch).eq('id', nearby.id);
        }
      } else {
        await supabase.from('cycle_logs').update(patch).eq('id', nearby.id);
      }
    } else {
      // Bare insert — period_end / period_length stay null until markEnd.
      await supabase.from('cycle_logs').insert({
        user_id: user.id,
        period_start: date,
        is_confirmed: true,
      });
    }
    await refresh();
  }, [user, cycleLogs, refresh]);

  const onMarkEnd = useCallback(async (date: string) => {
    if (!user) return;
    // Most recent period whose start is ≤ date (sorted ASC for the scan).
    const sorted = [...cycleLogs].sort((a, b) => a.period_start.localeCompare(b.period_start));
    let target: CycleLog | undefined;
    for (const p of sorted) {
      if (p.period_start <= date) target = p;
    }
    if (!target) return;
    if (date < target.period_start) return; // sanity guard
    const periodLength = Math.max(
      1,
      Math.min(10, Math.round(
        (parseISO(date).getTime() - parseISO(target.period_start).getTime()) / 86400000,
      ) + 1),
    );
    await supabase
      .from('cycle_logs')
      .update({ period_end: date, period_length: periodLength })
      .eq('id', target.id);
    await refresh();
  }, [user, cycleLogs, refresh]);

  const onClear = useCallback(async (date: string) => {
    if (!user) return;
    // First: any log whose end is exactly this date → clear the end.
    const endsHere = cycleLogs.find((l) => l.period_end === date);
    if (endsHere) {
      await supabase
        .from('cycle_logs')
        .update({ period_end: null, period_length: null })
        .eq('id', endsHere.id);
    }
    // Then: any log whose start is exactly this date → delete the period.
    const startsHere = cycleLogs.find((l) => l.period_start === date);
    if (startsHere) {
      await supabase.from('cycle_logs').delete().eq('id', startsHere.id);
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
  kicker: { ...Type.calendar.kicker },
  title:  { ...Type.calendar.title, marginTop: 4 },

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
  legendLabel: { ...Type.calendar.legend },

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
  hintCardTitle: { ...Type.calendar.hintTitle },
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

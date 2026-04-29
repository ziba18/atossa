import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CalendarList } from 'react-native-calendars';
import { addDays, differenceInDays, format, parseISO, startOfDay } from 'date-fns';
import { useAuthStore } from '../../../stores/authStore';
import { useCycleStore } from '../../../stores/cycleStore';
import { supabase } from '../../../lib/supabase';
import { Header } from '../../../components/layout/Header';
import { Colors } from '../../../constants/colors';
import { useColors, type AppColors } from '../../../contexts/ThemeContext';
import { FontSize, Spacing, Radius } from '../../../constants/theme';
import type { CycleLog, CyclePrediction } from '../../../types/database';

// ── Colours ───────────────────────────────────────────────────────────────────
const CAL = {
  period:    { bg: '#C76E72', text: '#FFFFFF' },
  periodDim: { bg: 'rgba(199,110,114,0.30)', text: '#FFFFFF' },
  predicted: { bg: '#E8AFAF', text: '#FFFFFF' },
  fertile:   { bg: '#8DBF8A', text: '#FFFFFF' },
  ovulation: { bg: '#D4C870', text: '#5A4A00' },
} as const;

type DayMark = {
  startingDay?: boolean;
  endingDay?: boolean;
  color: string;
  textColor: string;
};

// ── Build base marked dates ───────────────────────────────────────────────────
function buildMarkedDates(
  cycleLogs: CycleLog[],
  prediction: CyclePrediction | null,
): Record<string, DayMark> {
  const marks: Record<string, DayMark> = {};

  function markRange(start: Date, end: Date, color: string, textColor: string) {
    let cur = startOfDay(start);
    const last = startOfDay(end);
    while (cur <= last) {
      const s = format(cur, 'yyyy-MM-dd');
      marks[s] = {
        startingDay: cur.getTime() === startOfDay(start).getTime(),
        endingDay:   cur.getTime() === last.getTime(),
        color, textColor,
      };
      cur = addDays(cur, 1);
    }
  }

  function markDay(date: Date, color: string, textColor: string) {
    marks[format(date, 'yyyy-MM-dd')] = { startingDay: true, endingDay: true, color, textColor };
  }

  // Future predicted cycles
  if (prediction?.next_period_start) {
    const cycleLen  = prediction.predicted_cycle_length ?? 28;
    const periodLen = 5;
    const ovOffset  = cycleLen - 14;
    const limit     = addDays(new Date(), 365);
    let cycleStart  = parseISO(prediction.next_period_start);

    for (let i = 0; i < 14 && cycleStart <= limit; i++) {
      const fertileStart = addDays(cycleStart, ovOffset - 5);
      const fertileEnd   = addDays(cycleStart, ovOffset - 1);
      markRange(fertileStart, fertileEnd, CAL.fertile.bg, CAL.fertile.text);
      markDay(addDays(cycleStart, ovOffset), CAL.ovulation.bg, CAL.ovulation.text);
      markRange(cycleStart, addDays(cycleStart, periodLen - 1), CAL.predicted.bg, CAL.predicted.text);
      cycleStart = addDays(cycleStart, cycleLen);
    }
  }

  // Actual past period logs (override predictions)
  const sorted = [...cycleLogs].sort((a, b) => a.period_start.localeCompare(b.period_start));
  for (const log of sorted) {
    const start = parseISO(log.period_start);
    const end   = log.period_end
      ? parseISO(log.period_end)
      : addDays(start, (log.period_length ?? 5) - 1);
    markRange(start, end, CAL.period.bg, CAL.period.text);
  }

  return marks;
}

// ── Legend item ───────────────────────────────────────────────────────────────
function LegendItem({ color, label }: { color: string; label: string }) {
  const theme = useColors();
  const s = createStyles(theme);
  return (
    <View style={s.legendItem}>
      <View style={[s.legendDot, { backgroundColor: color }]} />
      <Text style={[s.legendLabel, { color: theme.textSecondary }]}>{label}</Text>
    </View>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────────
interface Selecting {
  logId: string | null;
  anchor: string;   // the day that was long-pressed — determines start vs end
  start: string;
  end: string;
}

export default function CycleCalendarScreen() {
  const theme = useColors();
  const styles = createStyles(theme);
  const user = useAuthStore((s) => s.user);
  const { cycleLogs, prediction, fetchCycleLogs } = useCycleStore();

  const [selecting, setSelecting] = useState<Selecting | null>(null);
  const [saving, setSaving] = useState(false);

  const todayStr = format(new Date(), 'yyyy-MM-dd');

  // ── Map each actual period date → its log (for quick lookup on press) ──────
  const dateToLog = useMemo<Record<string, CycleLog>>(() => {
    const map: Record<string, CycleLog> = {};
    for (const log of cycleLogs) {
      const start = parseISO(log.period_start);
      const end   = log.period_end
        ? parseISO(log.period_end)
        : addDays(start, (log.period_length ?? 5) - 1);
      let cur = startOfDay(start);
      while (cur <= startOfDay(end)) {
        map[format(cur, 'yyyy-MM-dd')] = log;
        cur = addDays(cur, 1);
      }
    }
    return map;
  }, [cycleLogs]);

  // ── Base marked dates (predictions + actual logs) ─────────────────────────
  const baseMarks = useMemo(
    () => buildMarkedDates(cycleLogs, prediction),
    [cycleLogs, prediction],
  );

  // ── Display marks: dim others + highlight selection while editing ──────────
  const displayMarks = useMemo<Record<string, DayMark>>(() => {
    if (!selecting) return baseMarks;

    // Copy base; dim all actual period segments
    const marks: Record<string, DayMark> = {};
    for (const [d, m] of Object.entries(baseMarks)) {
      marks[d] = m.color === CAL.period.bg
        ? { ...m, color: CAL.periodDim.bg }
        : m;
    }

    // Draw the live selection range
    let cur = parseISO(selecting.start);
    const last = parseISO(selecting.end);
    while (cur <= last) {
      const s = format(cur, 'yyyy-MM-dd');
      marks[s] = {
        startingDay: s === selecting.start,
        endingDay:   s === selecting.end,
        color:     CAL.period.bg,
        textColor: CAL.period.text,
      };
      cur = addDays(cur, 1);
    }

    return marks;
  }, [baseMarks, selecting]);

  // ── Gesture handlers ──────────────────────────────────────────────────────

  /** Long-press: start editing an existing period or creating a new one. */
  const handleLongPress = (day: { dateString: string }) => {
    const log = dateToLog[day.dateString];
    if (log) {
      const end = log.period_end
        ?? format(addDays(parseISO(log.period_start), (log.period_length ?? 5) - 1), 'yyyy-MM-dd');
      setSelecting({ logId: log.id, anchor: day.dateString, start: log.period_start, end });
    } else {
      setSelecting({ logId: null, anchor: day.dateString, start: day.dateString, end: day.dateString });
    }
  };

  /**
   * Tap while editing: extend or shrink the range.
   * Days before the anchor move the start; days after move the end.
   */
  const handleDayPress = (day: { dateString: string }) => {
    if (!selecting) {
      // Not editing — tap a period day to start editing it
      const log = dateToLog[day.dateString];
      if (log) handleLongPress(day);
      return;
    }
    const d = day.dateString;
    if (d <= selecting.anchor) {
      setSelecting((prev) => ({ ...prev!, start: d }));
    } else {
      setSelecting((prev) => ({ ...prev!, end: d }));
    }
  };

  // ── Save ─────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!selecting || !user) return;
    setSaving(true);

    const periodLength =
      differenceInDays(parseISO(selecting.end), parseISO(selecting.start)) + 1;

    if (selecting.logId) {
      await supabase
        .from('cycle_logs')
        .update({
          period_start:  selecting.start,
          period_end:    selecting.end,
          period_length: periodLength,
        })
        .eq('id', selecting.logId);
    } else {
      await supabase.from('cycle_logs').insert({
        user_id:       user.id,
        period_start:  selecting.start,
        period_end:    selecting.end,
        period_length: periodLength,
        flow_intensity: 'medium',
      });
    }

    await fetchCycleLogs(user.id);
    setSelecting(null);
    setSaving(false);
  };

  // ── Delete ────────────────────────────────────────────────────────────────
  const handleDelete = () => {
    if (!selecting?.logId || !user) return;
    Alert.alert('Delete Period', 'Remove this period log?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          setSaving(true);
          await supabase.from('cycle_logs').delete().eq('id', selecting.logId!);
          await fetchCycleLogs(user.id);
          setSelecting(null);
          setSaving(false);
        },
      },
    ]);
  };

  // ── Formatted range label ─────────────────────────────────────────────────
  const rangeLabel = selecting
    ? selecting.start === selecting.end
      ? format(parseISO(selecting.start), 'MMM d')
      : `${format(parseISO(selecting.start), 'MMM d')} → ${format(parseISO(selecting.end), 'MMM d')}`
    : '';

  const dayCount = selecting
    ? differenceInDays(parseISO(selecting.end), parseISO(selecting.start)) + 1
    : 0;

  return (
    <SafeAreaView style={styles.screen}>
      <Header title="Cycle Calendar" showBack displayTitle />

      {/* ── Legend ── */}
      <View style={styles.legend}>
        <LegendItem color={CAL.period.bg}    label="Period" />
        <LegendItem color={CAL.predicted.bg} label="Predicted" />
        <LegendItem color={CAL.fertile.bg}   label="Fertile" />
        <LegendItem color={CAL.ovulation.bg} label="Ovulation" />
      </View>

      {/* ── Instruction strip ── */}
      <View style={[styles.instrStrip, selecting && styles.instrStripEdit]}>
        {selecting ? (
          <Text style={[styles.instrText, styles.instrTextEdit]}>
            Tap any day to move the{' '}
            <Text style={{ fontFamily: 'Jost_600SemiBold' }}>start</Text> or{' '}
            <Text style={{ fontFamily: 'Jost_600SemiBold' }}>end</Text> of this period
          </Text>
        ) : (
          <Text style={styles.instrText}>
            Tap or long-press a period to edit · Tap an empty day to log new
          </Text>
        )}
      </View>

      {/* ── Calendar ── */}
      <CalendarList
        current={todayStr}
        markingType="period"
        markedDates={displayMarks}
        pastScrollRange={24}
        futureScrollRange={13}
        scrollEnabled={!selecting}
        showScrollIndicator={false}
        calendarHeight={340}
        onDayPress={handleDayPress}
        onDayLongPress={handleLongPress}
        theme={{
          backgroundColor:         theme.background,
          calendarBackground:      theme.surface,
          textSectionTitleColor:   theme.textMuted,
          dayTextColor:            theme.textPrimary,
          todayTextColor:          theme.cherry,
          todayBackgroundColor:    'transparent',
          selectedDayTextColor:    '#FFFFFF',
          monthTextColor:          theme.textPrimary,
          indicatorColor:          theme.cherry,
          textDisabledColor:       Colors.silver,
          arrowColor:              theme.cherry,
          textDayFontFamily:       'Jost_400Regular',
          textMonthFontFamily:     'CormorantGaramond_600SemiBold',
          textDayHeaderFontFamily: 'Jost_600SemiBold',
          textDayFontSize:         14,
          textMonthFontSize:       22,
          textDayHeaderFontSize:   11,
        }}
      />

      {/* ── Edit action bar ── */}
      {selecting && (
        <View style={styles.editBar}>
          {/* Period info */}
          <View style={styles.editInfo}>
            <Text style={styles.editRange}>{rangeLabel}</Text>
            <Text style={styles.editDays}>
              {dayCount} day{dayCount !== 1 ? 's' : ''}
              {selecting.logId ? '' : ' · New period'}
            </Text>
          </View>

          {/* Actions */}
          <View style={styles.editActions}>
            {selecting.logId && (
              <TouchableOpacity
                onPress={handleDelete}
                style={styles.deleteBtn}
                disabled={saving}
              >
                <Text style={styles.deleteBtnText}>Delete</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={() => setSelecting(null)}
              style={styles.cancelBtn}
              disabled={saving}
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSave}
              style={[styles.saveBtn, saving && { opacity: 0.6 }]}
              disabled={saving}
            >
              {saving
                ? <ActivityIndicator size="small" color="#FFFFFF" />
                : <Text style={styles.saveBtnText}>Save</Text>
              }
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

function createStyles(c: AppColors) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: c.background },
    legend: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: Spacing.lg, paddingVertical: Spacing.sm, paddingHorizontal: Spacing.md, backgroundColor: c.surface, borderBottomWidth: 1, borderBottomColor: c.border },
    legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    legendDot: { width: 12, height: 12, borderRadius: 6 },
    legendLabel: { fontSize: FontSize.xs, fontFamily: 'Jost_400Regular' },
    instrStrip: { paddingVertical: 7, paddingHorizontal: Spacing.md, backgroundColor: c.surfaceElevated, borderBottomWidth: 1, borderBottomColor: c.border, alignItems: 'center' },
    instrStripEdit: { backgroundColor: c.cherryLighter, borderBottomColor: 'rgba(199,110,114,0.25)' },
    instrText: { fontSize: 11, fontFamily: 'Jost_400Regular', color: c.textMuted, textAlign: 'center' },
    instrTextEdit: { color: c.cherry },
    editBar: { backgroundColor: c.surface, borderTopWidth: 1, borderTopColor: c.border, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, paddingBottom: Spacing.lg, gap: Spacing.sm },
    editInfo: { alignItems: 'center' },
    editRange: { fontSize: FontSize.lg, fontFamily: 'CormorantGaramond_600SemiBold', color: c.textPrimary },
    editDays: { fontSize: FontSize.xs, fontFamily: 'Jost_400Regular', color: c.textMuted, marginTop: 2 },
    editActions: { flexDirection: 'row', gap: Spacing.sm, justifyContent: 'center' },
    deleteBtn: { paddingVertical: Spacing.sm, paddingHorizontal: Spacing.md, borderRadius: Radius.full, borderWidth: 1, borderColor: 'rgba(199,110,114,0.4)', backgroundColor: c.cherryLighter },
    deleteBtnText: { fontSize: FontSize.sm, fontFamily: 'Jost_600SemiBold', color: c.cherry },
    cancelBtn: { paddingVertical: Spacing.sm, paddingHorizontal: Spacing.md, borderRadius: Radius.full, borderWidth: 1, borderColor: c.border, backgroundColor: c.surfaceElevated },
    cancelBtnText: { fontSize: FontSize.sm, fontFamily: 'Jost_600SemiBold', color: c.textSecondary },
    saveBtn: { paddingVertical: Spacing.sm, paddingHorizontal: Spacing.xl, borderRadius: Radius.full, backgroundColor: c.cherry, minWidth: 80, alignItems: 'center' },
    saveBtnText: { fontSize: FontSize.sm, fontFamily: 'Jost_600SemiBold', color: '#FFFFFF' },
  });
}

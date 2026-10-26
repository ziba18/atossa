// Patterns view on the Timeline tab: what the last 4 or 12 weeks of notes add up to. Counts and
// dates only (same numbers as For my doctor for the same dates); no trends, verdicts or advice.
// Each chart has a text equivalent that a screen reader reads first, and each card opens the
// Timeline list filtered to what it counts.
import React, { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Card, EmptyState, FadeIn, PressableCard, Quote, SegmentedControl, Txt } from '../kit';
import { colors, space } from '../../../constants/atossaUI';
import { openCapture } from '../../../lib/captureStore';
import { todayKey } from '../../../lib/records/dates';
import {
  MIN_NOTE_DAYS, PATTERNS_RANGES, bleedingText, buildPatterns, noteDaysText, weeksText, type PatternsRange,
} from '../../../lib/records/patterns';
import { formatShortDate } from '../../../lib/records/format';
import { useRecordsStore } from '../../../stores/recordsStore';
import type { TimelineFilter } from './session';

const BAR_AREA = 72;
const plural = (n: number, one: string) => `${n} ${one}${n === 1 ? '' : 's'}`;

/** One horizontal bar per label: fill = days / total, count always written. */
function Bars({ rows, total }: { rows: { label: string; days: number }[]; total: number }) {
  return (
    <View style={{ gap: space.sm }}>
      {rows.map((r) => (
        <View key={r.label} style={{ gap: 4 }}>
          <View style={styles.barHead}>
            <Txt variant="body" style={{ flexShrink: 1 }}>{r.label}</Txt>
            <Txt variant="secondary">{plural(r.days, 'day')}</Txt>
          </View>
          <View style={styles.track}>
            <View style={[styles.fill, { width: `${Math.max(2, Math.min(100, (r.days / total) * 100))}%` }]} />
          </View>
        </View>
      ))}
    </View>
  );
}

export function PatternsView({ onOpen }: { onOpen: (filter: TimelineFilter) => void }) {
  const [range, setRange] = useState<PatternsRange>('4w');
  const symptom = useRecordsStore((s) => s.records.symptom);
  const periodDay = useRecordsStore((s) => s.records.period_day);
  const medicine = useRecordsStore((s) => s.records.medicine);
  const history = useRecordsStore((s) => s.records.history);
  const appointment = useRecordsStore((s) => s.records.appointment);

  const m = useMemo(
    () => buildPatterns({ symptoms: symptom, periodDays: periodDay, medicines: medicine, history, appointments: appointment }, todayKey(), range),
    [symptom, periodDay, medicine, history, appointment, range],
  );

  const toggle = (
    <SegmentedControl accessibilityLabel="Patterns range" options={PATTERNS_RANGES.map((r) => ({ value: r.value, label: r.label }))} value={range} onChange={setRange} />
  );

  if (m.tooEarly) {
    const recent = m.days.filter((d) => d.logged).length;
    return (
      <View style={{ marginTop: space.lg }}>
        <EmptyState
          icon="calendar-days"
          message={`Patterns appear after a week of notes. ${recent === 0 ? 'No notes yet.' : `So far: notes on ${plural(recent, 'day')}.`}`}
          action={{ label: 'Add a note', onPress: () => openCapture() }}
          style={{ marginTop: space.xxl }}
        />
      </View>
    );
  }

  const maxWeek = Math.max(1, ...m.weeks.map((w) => w.noteDays));
  const rangeText = `${formatShortDate(m.from, 'always')} – ${formatShortDate(m.to, 'always')}`;

  return (
    <View style={{ gap: space.md, marginTop: space.lg }}>
      {toggle}
      <Txt variant="caption">{rangeText} · {plural(m.notes, 'note')}</Txt>

      <FadeIn index={0}>
        <PressableCard
          onPress={() => onOpen('Symptoms')}
          accessibilityLabel={`${noteDaysText(m)}. ${weeksText(m)} Opens your notes.`}
        >
          <Txt variant="groupLabel">Days with a note</Txt>
          <View style={styles.numRow}>
            <Txt variant="numeral">{m.noteDays}</Txt>
            <Txt variant="secondary" style={{ flexShrink: 1 }}>of {m.totalDays} days</Txt>
          </View>
          <View style={styles.chart} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
            {m.weeks.map((w) => (
              <View key={w.from} style={styles.weekCol}>
                <Txt variant="caption" style={styles.weekNum}>{w.noteDays}</Txt>
                <View style={[styles.weekBar, { height: Math.max(3, (w.noteDays / maxWeek) * (BAR_AREA - 18)) }]} />
              </View>
            ))}
          </View>
          <Txt variant="caption" style={{ marginTop: space.xs }}>Days with a note in each week, {formatShortDate(m.from, 'always')} to {formatShortDate(m.to, 'always')}.</Txt>
        </PressableCard>
      </FadeIn>

      {m.zones.length ? (
        <FadeIn index={1}>
          <PressableCard onPress={() => onOpen('Symptoms')} accessibilityLabel={`Where. ${m.zones.map((z) => `${z.label}, ${plural(z.days, 'day')}`).join('; ')}. Opens your notes.`}>
            <Txt variant="groupLabel" style={{ marginBottom: space.sm }}>Where, in your words</Txt>
            <Bars rows={m.zones.slice(0, 5)} total={m.totalDays} />
          </PressableCard>
        </FadeIn>
      ) : null}

      {m.bleedingDays || m.spottingDays ? (
        <FadeIn index={2}>
          <PressableCard edge="clay" onPress={() => onOpen('Bleeding')} accessibilityLabel={`${bleedingText(m)} Opens your bleeding days.`}>
            <Txt variant="groupLabel">Bleeding</Txt>
            <Txt variant="body" style={{ marginTop: space.xxs }}>{bleedingText(m)}</Txt>
          </PressableCard>
        </FadeIn>
      ) : null}

      {m.impacts.length ? (
        <FadeIn index={3}>
          <PressableCard onPress={() => onOpen('Symptoms')} accessibilityLabel={`What it got in the way of. ${m.impacts.map((i) => `${i.label}, ${plural(i.days, 'day')}`).join('; ')}. Opens your notes.`}>
            <Txt variant="groupLabel" style={{ marginBottom: space.sm }}>What it got in the way of</Txt>
            <Bars rows={m.impacts} total={m.totalDays} />
          </PressableCard>
        </FadeIn>
      ) : null}

      {m.latest ? (
        <FadeIn index={4}>
          <Card>
            <Txt variant="caption">Latest, in your words · {m.latest.dateLabel}</Txt>
            <View style={{ marginTop: space.xs }}><Quote numberOfLines={3}>{m.latest.text}</Quote></View>
          </Card>
        </FadeIn>
      ) : null}

      <Txt variant="caption" style={{ textAlign: 'center', marginTop: space.xs }}>
        Counts of what you logged, from {MIN_NOTE_DAYS}+ days of notes. They match your summary for the same dates.
      </Txt>
    </View>
  );
}

const styles = StyleSheet.create({
  numRow: { flexDirection: 'row', alignItems: 'baseline', gap: space.xs, marginTop: space.xxs },
  chart: { flexDirection: 'row', alignItems: 'flex-end', gap: 4, height: BAR_AREA, marginTop: space.sm },
  weekCol: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', gap: 2 },
  weekNum: { fontSize: 11 },
  weekBar: { width: '100%', maxWidth: 28, borderRadius: 4, backgroundColor: colors.borderStrong },
  barHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: space.sm },
  track: { height: 8, borderRadius: 4, backgroundColor: colors.sunken, overflow: 'hidden' },
  fill: { height: 8, borderRadius: 4, backgroundColor: colors.borderStrong },
});

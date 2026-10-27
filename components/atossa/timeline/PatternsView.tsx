// Patterns view on the Timeline tab: what the last 4 or 12 weeks of notes add up to. Counts and
// dates only (same numbers as For my doctor for the same dates); no trends, verdicts or advice.
// Each chart has a text equivalent that a screen reader reads first, and each card opens the
// Timeline list filtered to what it counts.
import React, { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Card, EmptyState, FadeIn, PressableCard, Quote, SegmentedControl, Txt } from '../kit';
import { colors, severityColor, space } from '../../../constants/atossaUI';
import { openCapture } from '../../../lib/captureStore';
import { todayKey } from '../../../lib/records/dates';
import {
  MIN_NOTE_DAYS, PATTERNS_RANGES, STRONG_FROM, bleedingText, buildPatterns, noteDaysText, weeksText, type PatternsRange,
} from '../../../lib/records/patterns';
import { formatShortDate } from '../../../lib/records/format';
import { useRecordsStore } from '../../../stores/recordsStore';
import type { TimelineFilter } from './session';

const BAR_AREA = 72;
/** Narrowest a week column may be before its digit is dropped (digits would run together; the text above and the spoken label still give the counts). */
const MIN_DIGIT_COL = 18;
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

/** One number with a label under it; the row of three sits above the charts. */
function StatTile({ value, label, onPress, hint }: { value: number; label: string; onPress: () => void; hint: string }) {
  return (
    <PressableCard onPress={onPress} chevron={false} accessibilityLabel={`${value} ${label}. ${hint}`} style={styles.tile}>
      <Txt variant="numeral" style={styles.tileNum}>{value}</Txt>
      <Txt variant="caption" style={{ marginTop: 2 }}>{label}</Txt>
    </PressableCard>
  );
}

/** A card that has nothing to count yet: it says so in one line instead of disappearing. */
function EmptyLine({ title, line }: { title: string; line: string }) {
  return (
    <Card>
      <Txt variant="groupLabel">{title}</Txt>
      <Txt variant="secondary" style={{ marginTop: space.xxs }}>{line}</Txt>
    </Card>
  );
}

export function PatternsView({ onOpen }: { onOpen: (filter: TimelineFilter) => void }) {
  const [range, setRange] = useState<PatternsRange>('4w');
  const [chartW, setChartW] = useState(0);
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
        <View style={styles.tiles}>
          <StatTile value={m.noteDays} label="days with a note" onPress={() => onOpen('Symptoms')} hint="Opens your notes." />
          <StatTile value={m.strongDays} label={`days at ${STRONG_FROM}+ out of 10`} onPress={() => onOpen('Symptoms')} hint="Opens your notes." />
          <StatTile value={m.bleedingDays} label="days of bleeding" onPress={() => onOpen('Bleeding')} hint="Opens your bleeding days." />
        </View>
      </FadeIn>

      <FadeIn index={1}>
        <PressableCard
          onPress={() => onOpen('Symptoms')}
          accessibilityLabel={`${noteDaysText(m)}. ${weeksText(m)} Opens your notes.`}
        >
          <Txt variant="groupLabel">Days with a note, by week</Txt>
          <Txt variant="secondary" style={{ marginTop: space.xxs }}>{noteDaysText(m)}. Darker weeks had a higher number.</Txt>
          <View style={styles.chart} onLayout={(e) => setChartW(e.nativeEvent.layout.width)} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
            {m.weeks.map((w) => (
              <View key={w.from} style={styles.weekCol}>
                {chartW === 0 || chartW / m.weeks.length >= MIN_DIGIT_COL ? <Txt variant="caption" style={styles.weekNum}>{w.noteDays}</Txt> : null}
                <View style={[styles.weekBar, { height: Math.max(3, (w.noteDays / maxWeek) * (BAR_AREA - 18)), backgroundColor: w.peak == null ? colors.ink2 : severityColor(w.peak).bg }]} />
              </View>
            ))}
          </View>
          {/* First and last day under the bars so 12 bars are not anonymous (spoken text already gives the range). */}
          <View style={styles.axis} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
            <Txt variant="caption" maxFontSizeMultiplier={1.4}>{formatShortDate(m.from)}</Txt>
            <Txt variant="caption" maxFontSizeMultiplier={1.4}>{formatShortDate(m.to)}</Txt>
          </View>
          {chartW > 0 && chartW / m.weeks.length < MIN_DIGIT_COL ? (
            <Txt variant="caption" style={{ marginTop: space.xs }}>Most in one week: {plural(maxWeek, 'day')}.</Txt>
          ) : null}
        </PressableCard>
      </FadeIn>

      {m.zones.length ? (
        <FadeIn index={2}>
          <PressableCard onPress={() => onOpen('Symptoms')} accessibilityLabel={`Where. ${m.zones.map((z) => `${z.label}, ${plural(z.days, 'day')}`).join('; ')}. Opens your notes.`}>
            <Txt variant="groupLabel" style={{ marginBottom: space.sm }}>Where you felt it</Txt>
            <Bars rows={m.zones.slice(0, 5)} total={m.totalDays} />
          </PressableCard>
        </FadeIn>
      ) : (
        <EmptyLine title="Where you felt it" line="No place named in these notes. Say where it hurts and it appears here." />
      )}

      {m.bleedingDays || m.spottingDays ? (
        <FadeIn index={2}>
          <PressableCard edge="clay" onPress={() => onOpen('Bleeding')} accessibilityLabel={`${bleedingText(m)} Opens your bleeding days.`}>
            <Txt variant="groupLabel">Bleeding</Txt>
            <Txt variant="body" style={{ marginTop: space.xxs }}>{bleedingText(m)}</Txt>
          </PressableCard>
        </FadeIn>
      ) : (
        <EmptyLine title="Bleeding" line="No bleeding or spotting logged in these weeks." />
      )}

      {m.impacts.length ? (
        <FadeIn index={3}>
          <PressableCard onPress={() => onOpen('Symptoms')} accessibilityLabel={`What it got in the way of. ${m.impacts.map((i) => `${i.label}, ${plural(i.days, 'day')}`).join('; ')}. Opens your notes.`}>
            <Txt variant="groupLabel" style={{ marginBottom: space.sm }}>What it got in the way of</Txt>
            <Bars rows={m.impacts} total={m.totalDays} />
          </PressableCard>
        </FadeIn>
      ) : (
        <EmptyLine title="What it got in the way of" line="Nothing logged yet. Say what it stopped you doing and it appears here." />
      )}

      <EmptyLine title="Sleep and mood" line="Not recorded yet. You can mention them in any note." />

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
  tiles: { flexDirection: 'row', gap: space.sm },
  tile: { flex: 1, minWidth: 0, paddingHorizontal: space.sm, paddingVertical: space.md },
  tileNum: { fontSize: 32, lineHeight: 38 },
  numRow: { flexDirection: 'row', alignItems: 'baseline', gap: space.xs, marginTop: space.xxs },
  chart: { flexDirection: 'row', alignItems: 'flex-end', gap: 4, height: BAR_AREA, marginTop: space.sm },
  axis: { flexDirection: 'row', justifyContent: 'space-between', marginTop: space.xxs, paddingRight: 10 },
  weekCol: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', gap: 2 },
  weekNum: { fontSize: 11 },
  weekBar: { width: '100%', maxWidth: 28, borderRadius: 4, backgroundColor: colors.ink2 },
  barHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: space.sm },
  track: { height: 8, borderRadius: 4, backgroundColor: colors.sunken, overflow: 'hidden' },
  fill: { height: 8, borderRadius: 4, backgroundColor: colors.ink2 },
});

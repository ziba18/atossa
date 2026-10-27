// Patterns view on the Timeline tab: what the last 4 or 12 weeks of notes add up to. Counts and
// dates only (same numbers as For my doctor for the same dates); no trends, verdicts or advice.
// Each chart has a text equivalent that a screen reader reads first, and each card opens the
// Timeline list filtered to what it counts.
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useReduceMotion } from '../kit-parts/Sheet';
import { Card, EmptyState, FadeIn, PressableCard, Quote, SegmentedControl, Txt } from '../kit';
import { colors, severityColor, severityRamp, space } from '../../../constants/atossaUI';
import { untaggedLine } from '../../../lib/records/counts';
import { openCapture } from '../../../lib/captureStore';
import { todayKey } from '../../../lib/records/dates';
import {
  MIN_NOTE_DAYS, PATTERNS_RANGES, STRONG_FROM, bleedingText, buildPatterns, noteDaysText, weeksText, type PatternsRange,
} from '../../../lib/records/patterns';
import { formatShortDate, joinFacts } from '../../../lib/records/format';
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
            <Txt variant="secondary" numberOfLines={1} style={{ flexShrink: 0 }}>{plural(r.days, "day")}</Txt>
          </View>
          <View style={styles.track}>
            <View style={[styles.fill, { width: `${Math.max(2, Math.min(100, (r.days / total) * 100))}%` }]} />
          </View>
        </View>
      ))}
    </View>
  );
}

/** A week bar that eases up from its baseline once (200 ms); no motion under Reduce Motion. */
function WeekBar({ height, color }: { height: number; color: string }) {
  const reduce = useReduceMotion();
  const t = useRef(new Animated.Value(reduce ? 1 : 0)).current;
  useEffect(() => {
    if (reduce) { t.setValue(1); return; }
    const a = Animated.timing(t, { toValue: 1, duration: 200, easing: Easing.out(Easing.cubic), useNativeDriver: true });
    a.start();
    return () => a.stop();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return <Animated.View style={[styles.weekBar, { height, backgroundColor: color, transformOrigin: 'bottom', transform: [{ scaleY: t }] }]} />;
}

/** One number with a label under it; the row of three sits above the charts. */
function StatTile({ value, label, onPress, hint, wide, zeroLabel }: { value: number; label: string; onPress: () => void; hint: string; wide?: boolean; zeroLabel?: string }) {
  // A zero that means "nothing logged" reads as a sentence, not a big 0.
  const none = value === 0 && !!zeroLabel;
  return (
    <PressableCard onPress={onPress} chevron={false} accessibilityLabel={none ? `${zeroLabel}. ${hint}` : `${value} ${label}. ${hint}`} style={wide ? styles.tileWide : styles.tile}>
      <View style={wide ? styles.tileRow : undefined}>
        {none ? <Txt variant={wide ? 'body' : 'caption'} style={{ fontWeight: '600', color: colors.ink }}>{zeroLabel}</Txt> : <Txt variant="numeral" style={styles.tileNum}>{value}</Txt>}
        {none ? null : <Txt variant="caption" style={wide ? { flexShrink: 1 } : { marginTop: 2 }}>{label}</Txt>}
      </View>
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

export function PatternsView({ onOpen, onOpenWeek }: { onOpen: (filter: TimelineFilter) => void; onOpenWeek: (w: { from: string; to: string }) => void }) {
  const router = useRouter();
  const [range, setRange] = useState<PatternsRange>('4w');
  const [chartW, setChartW] = useState(0);
  const [stack, setStack] = useState(false);
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

  const inRange = symptom.filter((r) => r.data.date >= m.from && r.data.date <= m.to).map((r) => r.data);
  const sleepLine = untaggedLine(inRange, 'tired') || 'Not recorded yet. You can mention them in any note.';
  const maxWeek = Math.max(1, ...m.weeks.map((w) => w.noteDays));
  const rangeText = `${formatShortDate(m.from, 'always')} – ${formatShortDate(m.to, 'always')}`;

  return (
    <View style={{ gap: space.md, marginTop: space.lg }}>
      {toggle}
      <Txt variant="caption">{rangeText} · {plural(m.notes, 'note')}</Txt>

      <FadeIn index={0}>
        {/* Under ~270 wide (200% text on a small phone) three tiles side by side break words letter by letter: stack them. */}
        <View style={[styles.tiles, stack && { flexDirection: 'column' }]} onLayout={(e) => setStack(e.nativeEvent.layout.width < 270)}>
          <StatTile wide={stack} value={m.noteDays} label="days with a note" onPress={() => onOpen('Symptoms')} hint="Opens your notes." />
          <StatTile wide={stack} value={m.strongDays} label={`days at ${STRONG_FROM}+ out of 10`} onPress={() => onOpen('Symptoms')} hint="Opens your notes." />
          <StatTile wide={stack} value={m.bleedingDays} label="days of bleeding" zeroLabel="No bleeding logged" onPress={() => onOpen('Bleeding')} hint="Opens your bleeding days." />
        </View>
      </FadeIn>

      <FadeIn index={1}>
        <PressableCard
          onPress={() => onOpen('Symptoms')}
          accessibilityLabel={`${noteDaysText(m)}. ${weeksText(m)} Opens your notes.`}
          accessibilityActions={m.weeks.filter((w) => w.noteDays > 0).map((w) => ({ name: `week:${w.from}:${w.to}`, label: `Open the week from ${formatShortDate(w.from, 'always')}` }))}
          onAccessibilityAction={(name) => { const [, from, to] = name.split(':'); if (from && to) onOpenWeek({ from, to }); }}
        >
          <Txt variant="groupLabel">Days with a note, by week</Txt>
          <Txt variant="secondary" style={{ marginTop: space.sm }}>
            {noteDaysText(m)}. Bar height is the days with a note that week; shade is the highest number given that week.
          </Txt>
          <View style={styles.chart} onLayout={(e) => setChartW(e.nativeEvent.layout.width)} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
            {m.weeks.map((w) => (
              <Pressable key={w.from} disabled={w.noteDays === 0} onPress={() => onOpenWeek({ from: w.from, to: w.to })} style={styles.weekCol} hitSlop={4}>
                {chartW === 0 || chartW / m.weeks.length >= MIN_DIGIT_COL ? <Txt variant="caption" style={styles.weekNum}>{w.noteDays}</Txt> : null}
                <WeekBar height={Math.max(3, (w.noteDays / maxWeek) * (BAR_AREA - 18))} color={w.peak == null ? colors.ink2 : severityColor(w.peak).bg} />
              </Pressable>
            ))}
          </View>
          {m.weeks.length <= 5 ? (
            <View style={styles.chartLabels} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
              {m.weeks.map((w) => (
                <Txt key={w.from} variant="caption" maxFontSizeMultiplier={1.4} style={{ flex: 1, textAlign: 'center' }}>{formatShortDate(w.from)}</Txt>
              ))}
            </View>
          ) : null}
          {/* First and last day under the bars so 12 bars are not anonymous (spoken text already gives the range). */}
          {m.weeks.length > 5 ? <View style={styles.axis} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
            <Txt variant="caption" maxFontSizeMultiplier={1.4}>{formatShortDate(m.from)}</Txt>
            <Txt variant="caption" maxFontSizeMultiplier={1.4}>{formatShortDate(m.to)}</Txt>
          </View> : null}
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
            {m.bleedingDays || m.spottingDays ? (
              <View style={styles.bleedChart} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
                {m.weeks.map((w) => {
                  const inWeek = (d: { date: string }) => d.date >= w.from && d.date <= w.to;
                  const n = m.days.filter((d) => d.bleeding && inWeek(d)).length;
                  // Spotting-only weeks: an outlined clay bar, like the hatched outline in the month view.
                  const sp = n ? 0 : m.days.filter((d) => d.spotting && inWeek(d)).length;
                  const v = n || sp;
                  return (
                    <View key={w.from} style={styles.weekCol}>
                      {v > 0 && (chartW === 0 || chartW / m.weeks.length >= MIN_DIGIT_COL) ? <Txt variant="caption" style={styles.weekNum}>{v}</Txt> : null}
                      <View style={[styles.weekBar, { height: v ? 4 + v * 4 : 3 }, n ? { backgroundColor: colors.clay } : sp ? { backgroundColor: colors.clayTint, borderWidth: 1.5, borderColor: colors.clay } : { backgroundColor: colors.clayTint }]} />
                    </View>
                  );
                })}
              </View>
            ) : null}
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

      {m.tried.length ? (
        <FadeIn index={4}>
          <PressableCard
            onPress={() => router.push('/(tabs)/doctor' as any)}
            accessibilityLabel={`What you tried. ${m.tried.slice(0, 3).map((t) => joinFacts(t.title, t.helped)).join('; ')}. Opens For my doctor.`}
          >
            <Txt variant="groupLabel">What you tried</Txt>
            <View style={{ gap: space.sm, marginTop: space.sm }}>
              {m.tried.slice(0, 3).map((t) => (
                <View key={t.title}>
                  <Txt variant="body">{t.title}</Txt>
                  {t.helped ? <Txt variant="secondary">{t.helped}</Txt> : null}
                </View>
              ))}
            </View>
          </PressableCard>
        </FadeIn>
      ) : null}

      <EmptyLine title="Sleep and mood" line={sleepLine} />

      {m.latest ? (
        <FadeIn index={4}>
          <Card>
            <Txt variant="caption">Latest, in your words · {m.latest.dateLabel}</Txt>
            <View style={{ marginTop: space.xs }}><Quote numberOfLines={3}>{m.latest.text}</Quote></View>
          </Card>
        </FadeIn>
      ) : null}

      <PressableCard
        onPress={() => router.push('/(tabs)/doctor' as any)}
        accessibilityLabel="Make my summary for my doctor. Opens For my doctor."
      >
        <Txt variant="headline">Make my summary for my doctor</Txt>
        <Txt variant="secondary" style={{ marginTop: space.xxs }}>One clear page from your notes, in your words.</Txt>
      </PressableCard>

      <Txt variant="caption" style={{ textAlign: 'center', marginTop: space.xs }}>
        Counts of what you logged, from {MIN_NOTE_DAYS}+ days of notes. They match your summary for the same dates.
      </Txt>
    </View>
  );
}

const styles = StyleSheet.create({
  chartLabels: { flexDirection: 'row', gap: 4, marginTop: 4 },
  ringRow: { flexDirection: 'row', alignItems: 'center', gap: space.md, marginTop: space.sm },
  bleedChart: { flexDirection: 'row', alignItems: 'flex-end', gap: 4, height: 44, marginTop: space.sm },
  tiles: { flexDirection: 'row', gap: space.sm },
  tile: { flex: 1, minWidth: 0, paddingHorizontal: space.sm, paddingVertical: space.md },
  tileWide: { paddingHorizontal: space.md, paddingVertical: space.sm },
  tileRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  tileNum: { fontSize: 32, lineHeight: 38 },
  numRow: { flexDirection: 'row', alignItems: 'baseline', gap: space.xs, marginTop: space.xxs },
  chart: { flexDirection: 'row', alignItems: 'flex-end', gap: 4, height: BAR_AREA, marginTop: space.sm },
  axis: { flexDirection: 'row', justifyContent: 'space-between', marginTop: space.xxs, paddingRight: 10 },
  weekCol: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', gap: 2 },
  weekNum: { fontSize: 11 },
  weekBar: { width: '100%', maxWidth: 28, borderRadius: 4, backgroundColor: colors.ink2 },
  barHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: space.sm },
  track: { height: 8, borderRadius: 4, backgroundColor: colors.sunken, overflow: 'hidden' },
  fill: { height: 8, borderRadius: 4, backgroundColor: severityRamp[2] },
});

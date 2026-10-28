// Month grid for Timeline → Month. Logged states only (Apple-style grammar), never predictions:
//   bleeding  = 36 solid clay circle, white 600 numeral; consecutive days join into one clay
//               capsule (square inner edges, round at run ends, breaking at week rows) — a period
//               reads as one span, not six events
//   spotting  = 36 clay hatched outline (1.5), clay numeral on a clear disc (hatch never crosses it)
//   future    = ink3 numeral, no press state (unless something is logged there)
//   any note  = 5 plum dot under the day
//   today     = 1.5 ink ring
// Empty days are plain. No streaks, no "missed" states, no animation.
import React from 'react';
import { Pressable, StyleSheet, View, useWindowDimensions, Dimensions } from 'react-native';
import { IconButton, Txt } from '../kit';
import { colors, fonts, radii, space } from '../../../constants/atossaUI';
import {
  MONTH_NAMES, WEEKDAY_LETTERS, daysInMonth, firstWeekdayOffset, toKey, todayKey,
} from '../../../lib/records/dates';
import { formatDay, notesLabel } from '../../../lib/records/format';

export type DayBleeding = 'bleeding' | 'spotting' | 'none-flow';

export interface DayMark {
  bleeding?: DayBleeding;
  /** Symptom notes that day (from noteCount). */
  notes: number;
  /** Highest 0-10 strength noted that day: tints the day's disc on the plum ramp (the number is also in the spoken label). */
  worst?: number;
  /** Anything at all on the day (incl. appointments) — future days are only tappable if true. */
  hasEntries: boolean;
}

// Seven columns must stay clear of each other: at the 200% browser zoom widths (under ~280 px) the discs shrink.
const DISC = Dimensions.get('window').width < 280 ? 28 : 36;
const RING = 1.5;

export function MonthCalendar({
  year, month0, marks, onPrev, onNext, onDayPress,
}: {
  year: number;
  month0: number;
  marks: Record<string, DayMark>;
  onPrev: () => void;
  onNext: () => void;
  onDayPress: (key: string) => void;
}) {
  const today = todayKey();
  // Narrow phones (320): "September 2026" at title size wraps to two lines between the arrows.
  const winW = useWindowDimensions().width;
  const narrow = winW < 360;
  // Under ~220 pt the full month name would break mid-word beside the arrows: 'Sep 2026', full name for screen readers.
  const abbreviate = winW < 220;
  const offset = firstWeekdayOffset(year, month0);
  const days = daysInMonth(year, month0);
  const cells: (number | null)[] = [...Array(offset).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)];
  while (cells.length % 7) cells.push(null);

  return (
    <View>
      <View style={styles.head}>
        <IconButton icon="chevron-left" color={colors.plum} label="Previous month" onPress={onPrev} />
        <Txt variant="title" accessibilityRole="header" accessibilityLabel={`${MONTH_NAMES[month0]} ${year}`} style={[{ textAlign: 'center', flex: 1, minWidth: 0 }, narrow && { fontSize: 20, lineHeight: 26 }]}>
          {`${abbreviate ? MONTH_NAMES[month0].slice(0, 3) : MONTH_NAMES[month0]} ${year}`}
        </Txt>
        <IconButton icon="chevron-right" color={colors.plum} label="Next month" onPress={onNext} />
      </View>
      <View style={styles.row} aria-hidden>
        {WEEKDAY_LETTERS.map((w, i) => (
          <View key={i} style={styles.weekday}><Txt variant="caption">{w}</Txt></View>
        ))}
      </View>
      {Array.from({ length: cells.length / 7 }, (_, r) => (
        <View key={r} style={styles.row}>
          {cells.slice(r * 7, r * 7 + 7).map((d, c, row) => {
            if (d == null) return <View key={c} style={styles.cell} />;
            const key = toKey(year, month0, d);
            const solidAt = (i: number) => {
              const n = row[i];
              return n != null && marks[toKey(year, month0, n)]?.bleeding === 'bleeding';
            };
            const solid = solidAt(c);
            return (
              <DayCell
                key={c}
                day={d}
                dayKey={key}
                mark={marks[key]}
                isToday={key === today}
                future={key > today}
                joinLeft={solid && c > 0 && solidAt(c - 1)}
                joinRight={solid && c < 6 && solidAt(c + 1)}
                disabled={key > today && !marks[key]?.hasEntries}
                onPress={() => onDayPress(key)}
              />
            );
          })}
        </View>
      ))}
    </View>
  );
}

function a11yLabel(key: string, mark: DayMark | undefined, isToday: boolean): string {
  const parts = [formatDay(key, 'always')];
  if (isToday) parts.push('today');
  if (mark?.bleeding === 'bleeding') parts.push('bleeding logged');
  else if (mark?.bleeding === 'spotting') parts.push('spotting logged');
  else if (mark?.bleeding === 'none-flow') parts.push('period logged, no flow');
  if (mark?.notes) parts.push(notesLabel(mark.notes));
  if (mark?.worst != null) parts.push(`at worst ${mark.worst} out of 10`);
  return parts.join(', ');
}

function DayCell({
  day, dayKey, mark, isToday, future, joinLeft, joinRight, disabled, onPress,
}: {
  day: number; dayKey: string; mark?: DayMark; isToday: boolean; future: boolean;
  /** Bleeding on the neighbouring day in the same week row → the clay capsule continues that way. */
  joinLeft: boolean; joinRight: boolean;
  disabled: boolean; onPress: () => void;
}) {
  const solid = mark?.bleeding === 'bleeding';
  const spotting = mark?.bleeding === 'spotting';
  // A day with a note is one neutral outline; the strongest rating is the number printed under it (no shade carries meaning).
  const hasNote = (mark?.notes ?? 0) > 0 || mark?.worst != null;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={a11yLabel(dayKey, mark, isToday)}
      accessibilityHint={disabled ? undefined : 'Shows this day'}
      accessibilityState={{ disabled }}
      style={styles.cell}
    >
      {({ pressed }) => (
        <>
          <View style={styles.discWrap}>
            {/* Today ring sits outside a filled/hatched disc so both read. */}
            {isToday ? <View style={[styles.todayRing, hasNote && styles.todayRingOuter]} /> : null}
            <View
              style={[
                styles.disc,
                hasNote && { borderWidth: 1.5, borderColor: colors.borderStrong },
                pressed && !solid && !disabled && { backgroundColor: colors.sunken },
              ]}
            >
              <Txt
                maxFontSizeMultiplier={1.4}
                style={[
                  styles.num,
                  future && !solid && !spotting && { color: colors.ink3 },
                ]}
              >
                {day}
              </Txt>
            </View>
          </View>
          {solid || spotting ? (
            <View pointerEvents="none" style={styles.bleedRow}>
              <View style={[styles.bleedSide, solid && joinLeft && { backgroundColor: colors.clay }]} />
              <View style={[styles.bleedMid, solid ? { backgroundColor: colors.clay } : styles.spotMid]} />
              <View style={[styles.bleedSide, solid && joinRight && { backgroundColor: colors.clay }]} />
            </View>
          ) : null}
          {mark?.worst != null
            ? <Txt maxFontSizeMultiplier={1.2} style={styles.rating}>{mark.worst}</Txt>
            : <View style={[styles.dot, !mark?.notes && { opacity: 0 }]} />}
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', marginBottom: space.xs },
  row: { flexDirection: 'row' },
  weekday: { flex: 1, height: 28, alignItems: 'center', justifyContent: 'center' },
  cell: { flex: 1, height: 62, alignItems: 'center', justifyContent: 'flex-start', paddingTop: 4 },
  /** The bleeding marker under a day (same grammar as the PDF strip): solid clay bar = bleeding, dashed = spotting; runs join across days. */
  bleedRow: { position: 'absolute', left: 0, right: 0, top: DISC + 6, height: 4, flexDirection: 'row' },
  bleedSide: { flex: 1 },
  bleedMid: { width: DISC, height: 4 },
  spotMid: { height: 0, borderTopWidth: 2, borderStyle: 'dashed', borderColor: colors.clay, marginTop: 1 },
  discWrap: { width: DISC, height: DISC, alignItems: 'center', justifyContent: 'center' },
  disc: { width: DISC, height: DISC, borderRadius: radii.pill, alignItems: 'center', justifyContent: 'center' },
  todayRing: {
    position: 'absolute', width: DISC, height: DISC, borderRadius: radii.pill, borderWidth: RING, borderColor: colors.ink,
  },
  todayRingOuter: { width: DISC + 6, height: DISC + 6, top: -3, left: -3 },
  num: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 20, color: colors.ink, fontVariant: ['tabular-nums'] },
  rating: { fontFamily: fonts.semibold, fontSize: 12, lineHeight: 14, color: colors.ink, fontVariant: ['tabular-nums', 'lining-nums'], marginTop: 7 },
  dot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: colors.plum, marginTop: 9 },
});

// Month grid for Timeline → Month. Logged states only (Apple-style grammar), never predictions:
//   bleeding  = 36 solid clay circle, white 600 numeral; consecutive days join into one clay
//               capsule (square inner edges, round at run ends, breaking at week rows) — a period
//               reads as one span, not six events
//   spotting  = 36 clay hatched outline (1.5), clay numeral on a clear disc (hatch never crosses it)
//   future    = ink3 numeral, no press state (unless something is logged there)
//   any note  = 4 plum dot under the day
//   today     = 1.5 ink ring
// Empty days are plain. No streaks, no "missed" states, no animation.
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Svg, { Circle, ClipPath, Defs, G, Line, Path } from 'react-native-svg';
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
  /** Anything at all on the day (incl. appointments) — future days are only tappable if true. */
  hasEntries: boolean;
}

const DISC = 36;
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
  const offset = firstWeekdayOffset(year, month0);
  const days = daysInMonth(year, month0);
  const cells: (number | null)[] = [...Array(offset).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)];
  while (cells.length % 7) cells.push(null);

  return (
    <View>
      <View style={styles.head}>
        <IconButton icon="chevron-left" color={colors.plum} label="Previous month" onPress={onPrev} />
        <Txt variant="title" accessibilityRole="header" style={{ textAlign: 'center', flex: 1 }}>
          {`${MONTH_NAMES[month0]} ${year}`}
        </Txt>
        <IconButton icon="chevron-right" color={colors.plum} label="Next month" onPress={onNext} />
      </View>
      <View style={styles.row} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
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
          {joinLeft || joinRight ? (
            <View
              pointerEvents="none"
              style={[styles.band, { left: joinLeft ? -1 : '50%', right: joinRight ? -1 : '50%' }]} // -1 overlaps the neighbour: no hairline seam
            />
          ) : null}
          <View style={styles.discWrap}>
            {/* Today ring sits outside a filled/hatched disc so both read. */}
            {isToday ? <View style={[styles.todayRing, (solid || spotting) && styles.todayRingOuter]} /> : null}
            {spotting ? <SpottingHatch /> : null}
            {spotting ? <View pointerEvents="none" style={styles.spotClear} /> : null}
            <View
              style={[
                styles.disc,
                solid && { backgroundColor: colors.clay },
                pressed && !solid && !disabled && { backgroundColor: colors.sunken },
              ]}
            >
              <Txt
                maxFontSizeMultiplier={1.4}
                style={[
                  styles.num,
                  future && !solid && !spotting && { color: colors.ink3 },
                  solid && styles.numOnClay,
                  spotting && { color: colors.clay },
                ]}
              >
                {day}
              </Txt>
            </View>
          </View>
          <View style={[styles.dot, !mark?.notes && { opacity: 0 }]} />
        </>
      )}
    </Pressable>
  );
}

/** 36 pt clay outline (1.5) with diagonal hatching in a band inside it; the centre stays clear for the numeral. */
function SpottingHatch() {
  const id = React.useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const r = DISC / 2;
  const outer = r - RING / 2;
  const inner = r - 6;
  // Annulus as one even-odd path: outer circle + inner circle.
  const annulus =
    `M ${r - outer} ${r} a ${outer} ${outer} 0 1 0 ${outer * 2} 0 a ${outer} ${outer} 0 1 0 ${-outer * 2} 0 Z ` +
    `M ${r - inner} ${r} a ${inner} ${inner} 0 1 0 ${inner * 2} 0 a ${inner} ${inner} 0 1 0 ${-inner * 2} 0 Z`;
  const lines = [];
  for (let k = -DISC; k <= DISC; k += 5) lines.push(<Line key={k} x1={k} y1={DISC} x2={k + DISC} y2={0} stroke={colors.clay} strokeWidth={1.25} />);
  return (
    <Svg width={DISC} height={DISC} style={StyleSheet.absoluteFill} pointerEvents="none">
      <Defs>
        <ClipPath id={`hatch-${id}`}>
          <Path d={annulus} clipRule="evenodd" fillRule="evenodd" />
        </ClipPath>
      </Defs>
      <G clipPath={`url(#hatch-${id})`}>{lines}</G>
      <Circle cx={r} cy={r} r={outer} stroke={colors.clay} strokeWidth={RING} fill="none" />
    </Svg>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', marginBottom: space.xs },
  row: { flexDirection: 'row' },
  weekday: { flex: 1, height: 28, alignItems: 'center', justifyContent: 'center' },
  cell: { flex: 1, height: 56, alignItems: 'center', justifyContent: 'flex-start', paddingTop: 4 },
  /** Clay band joining consecutive bleeding days (behind the discs, same height). */
  band: { position: 'absolute', top: 4, height: DISC, backgroundColor: colors.clay },
  /** Clear centre for the spotting numeral, so the hatch never runs through the digits. */
  spotClear: { position: 'absolute', width: DISC - 12, height: DISC - 12, borderRadius: radii.pill, backgroundColor: colors.canvas },
  discWrap: { width: DISC, height: DISC, alignItems: 'center', justifyContent: 'center' },
  disc: { width: DISC, height: DISC, borderRadius: radii.pill, alignItems: 'center', justifyContent: 'center' },
  todayRing: {
    position: 'absolute', width: DISC, height: DISC, borderRadius: radii.pill, borderWidth: RING, borderColor: colors.ink,
  },
  todayRingOuter: { width: DISC + 6, height: DISC + 6, top: -3, left: -3 },
  num: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 20, color: colors.ink, fontVariant: ['tabular-nums'] },
  numOnClay: { fontFamily: fonts.semibold, color: colors.white },
  dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: colors.plum, marginTop: space.xxs },
});

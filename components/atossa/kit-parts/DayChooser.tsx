import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { colors, fonts, radii, space } from '../../../constants/atossaUI';
import { haptics } from '../../../lib/haptics';
import {
  MONTH_NAMES, WEEKDAY_LETTERS, daysInMonth, firstWeekdayOffset, parseKey, toKey, todayKey,
} from '../../../lib/records/dates';
import { formatDay } from '../../../lib/records/format';
import { IconButton } from './controls';
import { Txt } from './Txt';

/**
 * Inline en-GB day picker (Monday-first month grid) for the "Today ▾" DatePill. Days after
 * `max` (default today) are disabled — symptoms and bleeding can't be logged in the future.
 * Selected = plumTint + 2px plum ring. Today has a 1.5px ink ring. No predictions, no colour coding.
 */
export function DayChooser({
  value, onChange, max = todayKey(), min, month,
}: {
  value: string; onChange: (key: string) => void; max?: string; min?: string;
  /** Month shown first when `value` is empty (any date key in it). Default: `max`'s month. */
  month?: string;
}) {
  const start = parseKey(value || month || max);
  const [ym, setYm] = useState({ y: start.y, m0: start.m0 });
  const today = todayKey();
  const offset = firstWeekdayOffset(ym.y, ym.m0);
  const days = daysInMonth(ym.y, ym.m0);
  const maxYm = parseKey(max);
  const canNext = ym.y < maxYm.y || (ym.y === maxYm.y && ym.m0 < maxYm.m0);

  const shift = (n: number) => setYm(({ y, m0 }) => {
    const t = m0 + n;
    return { y: y + Math.floor(t / 12), m0: ((t % 12) + 12) % 12 };
  });

  const cells: (number | null)[] = [...Array(offset).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)];
  while (cells.length % 7) cells.push(null);

  return (
    <View>
      <View style={styles.head}>
        <IconButton icon="chevron-left" label="Previous month" onPress={() => shift(-1)} />
        <Txt variant="headline" accessibilityRole="header">{`${MONTH_NAMES[ym.m0]} ${ym.y}`}</Txt>
        {canNext ? <IconButton icon="chevron-right" label="Next month" onPress={() => shift(1)} /> : <View style={{ width: 44 }} />}
      </View>
      <View style={styles.row}>
        {WEEKDAY_LETTERS.map((w, i) => (
          <View key={i} style={styles.cell}><Txt variant="caption">{w}</Txt></View>
        ))}
      </View>
      {Array.from({ length: cells.length / 7 }, (_, r) => (
        <View key={r} style={styles.row}>
          {cells.slice(r * 7, r * 7 + 7).map((d, c) => {
            if (d == null) return <View key={c} style={styles.cell} />;
            const key = toKey(ym.y, ym.m0, d);
            const disabled = key > max || (min ? key < min : false);
            const selected = key === value;
            return (
              <Pressable
                key={c}
                disabled={disabled}
                onPress={() => { haptics.selection(); onChange(key); }}
                accessibilityRole="button"
                accessibilityLabel={formatDay(key, 'always')}
                accessibilityState={{ selected, disabled }}
                style={styles.cell}
              >
                <View style={[styles.day, key === today && styles.today, selected && styles.selected]}>
                  <Txt style={[styles.num, disabled && { color: colors.ink3, opacity: 0.5 }, selected && styles.numSelected]}>{d}</Txt>
                </View>
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: space.xxs },
  row: { flexDirection: 'row' },
  cell: { flex: 1, height: 44, alignItems: 'center', justifyContent: 'center' },
  day: { width: 36, height: 36, borderRadius: radii.pill, alignItems: 'center', justifyContent: 'center' },
  today: { borderWidth: 1.5, borderColor: colors.ink },
  selected: { borderWidth: 2, borderColor: colors.plum, backgroundColor: colors.plumTint },
  num: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 20, color: colors.ink, fontVariant: ['tabular-nums'] },
  numSelected: { fontFamily: fonts.semibold, color: colors.plum },
});

// "Last 14 days" strip above the Timeline list: one cell per day, shaded by that day's strongest
// "at worst" score (severity ramp, digit always shown so colour is never the only signal).
// Days with a note but no score show a dot; days with nothing stay empty. Descriptive only.
import React, { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Card, Txt } from '../kit';
import { colors, severityColor, space } from '../../../constants/atossaUI';
import { addDays, parseKey, todayKey } from '../../../lib/records/dates';
import { worstOf } from '../../../lib/records/format';
import type { Rec, SymptomData } from '../../../types/records';

const MAX_DAYS = 14;
const MIN_DAYS = 7;
/** Narrowest a day cell may get before the strip drops to fewer days (digit stays legible). */
const MIN_CELL = 22;
const LETTERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

interface Cell { key: string; letter: string; worst: number | null; noted: boolean }

export function RecentStrip({ symptoms, flush }: { symptoms: Rec<SymptomData>[]; flush?: boolean }) {
  const [inner, setInner] = useState(0);
  // Narrow screens / big text: show the last 7 days instead of squeezing 14 cells.
  const days = inner > 0 && inner < MAX_DAYS * MIN_CELL ? MIN_DAYS : MAX_DAYS;
  const { cells, noteDays } = useMemo(() => {
    const today = todayKey();
    const out: Cell[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const key = addDays(today, -i);
      const { y, m0, d } = parseKey(key);
      const mine = symptoms.filter((s) => s.data.date === key);
      const scores = mine.map((s) => worstOf(s.data)).filter((n): n is number => n != null);
      out.push({
        key,
        letter: LETTERS[new Date(Date.UTC(y, m0, d)).getUTCDay()],
        worst: scores.length ? Math.max(...scores) : null,
        noted: mine.length > 0,
      });
    }
    return { cells: out, noteDays: out.filter((c) => c.noted).length };
  }, [symptoms, days]);

  const label = `Last ${days} days: notes on ${noteDays} ${noteDays === 1 ? 'day' : 'days'}`;
  return (
    <Card style={[styles.card, flush && { marginTop: 0 }]}>
      <View style={styles.head}>
        <Txt variant="groupLabel">Last {days} days</Txt>
        <Txt variant="secondary" style={{ flexShrink: 1, textAlign: 'right' }}>{noteDays === 0 ? 'No notes yet' : `${noteDays} ${noteDays === 1 ? 'day' : 'days'} with notes`}</Txt>
      </View>
      <View style={styles.row} onLayout={(e) => setInner(e.nativeEvent.layout.width)} accessible accessibilityRole="image" accessibilityLabel={label}>
        {cells.map((c) => {
          const sev = c.worst != null ? severityColor(c.worst) : null;
          return (
            <View key={c.key} style={styles.col}>
              <View style={[styles.cell, sev ? { backgroundColor: sev.bg, borderColor: sev.bg } : null]}>
                {sev ? (
                  <Txt variant="caption" color={sev.fg} style={styles.digit}>{c.worst}</Txt>
                ) : c.noted ? <View style={styles.dot} /> : null}
              </View>
              <Txt variant="caption" color={colors.ink3} style={styles.letter}>{c.letter}</Txt>
            </View>
          );
        })}
      </View>
      <Txt variant="caption" color={colors.ink2}>Number: strongest rating that day, out of 10. Blank: no note.</Txt>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { padding: space.md, gap: space.sm, marginTop: space.lg },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: space.sm },
  row: { flexDirection: 'row', gap: 3 },
  col: { flex: 1, alignItems: 'center', gap: 4 },
  cell: {
    width: '100%', aspectRatio: 0.8, borderRadius: 8, borderWidth: 1,
    borderColor: colors.hairline, backgroundColor: colors.canvas, alignItems: 'center', justifyContent: 'center',
  },
  digit: { fontWeight: '700', fontSize: 13, fontVariant: ['tabular-nums', 'lining-nums'] },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.ink2 },
  letter: { fontSize: 11 },
});

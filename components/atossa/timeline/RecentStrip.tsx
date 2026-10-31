// "Last 14 days" strip above the Timeline list: one cell per day, the same grammar as the Month view:
// a day with a note gets one neutral outline and its strongest "at worst" score printed in ink (no shade
// carries meaning). Days with a note but no score show a dot; days with nothing show a dash. Descriptive only.
import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Card, Txt } from '../kit';
import { Icon } from '../../ui/Icon';
import { colors, severityRamp, space } from '../../../constants/atossaUI';
import { addDays, parseKey, todayKey } from '../../../lib/records/dates';
import { formatDay, worstOf } from '../../../lib/records/format';
import type { Rec, SymptomData } from '../../../types/records';

const MAX_DAYS = 14;
const MIN_DAYS = 7;
const FEW_DAYS = 5;
/** Narrowest a day cell may get before the strip drops to fewer days (digit stays legible). */
const MIN_CELL = 28;
const LETTERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

interface Cell { key: string; letter: string; worst: number | null; noted: boolean }

export function RecentStrip({ symptoms, flush, twoRows, band, onDayPress, onPatterns, onMonth }: { symptoms: Rec<SymptomData>[]; flush?: boolean; /** One deep-Iris band: white day cells on it, white text. */ band?: boolean; twoRows?: boolean; onDayPress?: (key: string) => void; onPatterns?: () => void; onMonth?: () => void }) {
  const [inner, setInner] = useState(0);
  // Narrow screens / big text: show the last 7 days instead of squeezing 14 cells.
  // With twoRows (Timeline, which has the height) the 14 days stay: two rows of 7 instead of dropping to 7.
  const wrap = !!twoRows && inner >= MIN_DAYS * MIN_CELL && inner < MAX_DAYS * MIN_CELL;
  const days = wrap ? MAX_DAYS : inner > 0 && inner < MIN_DAYS * MIN_CELL ? FEW_DAYS : inner > 0 && inner < MAX_DAYS * MIN_CELL ? MIN_DAYS : MAX_DAYS;
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
    <Card tone="default" style={[styles.card, flush && { marginTop: 0 }, band && { backgroundColor: severityRamp[4], borderColor: severityRamp[4] }]}>
      <View style={styles.head}>
        <Txt variant="groupLabel" color={band ? colors.white : undefined}>Last {days} days</Txt>
        <Txt variant="secondary" style={[{ flexShrink: 1 }, band ? { color: severityRamp[0] } : null]}>{noteDays === 0 ? (symptoms.length > 0 ? 'No notes in these days' : 'No notes yet') : (noteDays === 1 ? '1 day with a note' : `${noteDays} days with notes`)}</Txt>
      </View>
      <View style={[styles.row, wrap && { flexWrap: 'wrap', rowGap: 6 }]} onLayout={(e) => setInner(e.nativeEvent.layout.width)} {...(onDayPress ? null : { accessible: true, accessibilityRole: 'image' as const, accessibilityLabel: label })}>
        {cells.map((c) => {
          const body = (
            <>
              <View style={[styles.cell, c.noted ? styles.cellNoted : null, band && (c.noted ? { backgroundColor: colors.white, borderColor: colors.white } : { backgroundColor: 'transparent', borderColor: severityRamp[1] })]}>
                {c.worst != null ? (
                  <Txt variant="caption" color={colors.ink} style={styles.digit}>{c.worst}</Txt>
                ) : c.noted ? <View style={styles.dot} /> : <View style={[styles.dash, band && !c.noted ? { backgroundColor: colors.white } : null]} />}
              </View>
              <Txt variant="caption" color={band ? colors.white : flush ? colors.ink3 : colors.ink2} style={styles.letter}>{c.letter}</Txt>
            </>
          );
          const colStyle = [styles.col, wrap && { flexBasis: `${100 / MIN_DAYS - 1}%`, flexGrow: 0 }];
          if (onDayPress) {
            return (
              // The day is a picture (digit, letter); the button is a transparent layer over it, so it holds no text that could differ from its name.
              <View key={c.key} style={colStyle as any}>
                {body}
                <Pressable onPress={() => onDayPress(c.key)} accessibilityRole="button" accessibilityLabel={`${formatDay(c.key, 'always')}, ${c.worst != null ? `at worst ${c.worst} out of 10` : c.noted ? 'note, no rating' : 'no note'}`} accessibilityHint="Shows this day" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
              </View>
            );
          }
          return (
            <View key={c.key} style={[styles.col, wrap && { flexBasis: `${100 / MIN_DAYS - 1}%`, flexGrow: 0 }]}>
              <View style={[styles.cell, c.noted ? styles.cellNoted : null, band && (c.noted ? { backgroundColor: colors.white, borderColor: colors.white } : { backgroundColor: 'transparent', borderColor: severityRamp[1] })]}>
                {c.worst != null ? (
                  <Txt variant="caption" color={colors.ink} style={styles.digit}>{c.worst}</Txt>
                ) : c.noted ? <View style={styles.dot} /> : <View style={[styles.dash, band && !c.noted ? { backgroundColor: colors.white } : null]} />}
              </View>
              <Txt variant="caption" color={band ? colors.white : flush ? colors.ink3 : colors.ink2} style={styles.letter}>{c.letter}</Txt>
            </View>
          );
        })}
      </View>
      <Txt variant="caption" color={band ? severityRamp[0] : colors.ink2}>{noteDays === 0 ? 'Dash: no note.' : flush ? 'Number: strongest rating that day, out of 10. Dash: no note.' : 'Number: strongest rating that day, of 10. Dash: no note.'}</Txt>
      {onPatterns || onMonth ? (
        <Pressable
          onPress={onPatterns ?? onMonth}
          accessibilityRole="button"
          accessibilityLabel={onPatterns ? 'See your patterns' : 'See the month'}
          accessibilityHint={onPatterns ? 'Opens Patterns on the Timeline tab' : 'Opens the Month view'}
          style={({ pressed }) => [styles.patterns, pressed && { backgroundColor: colors.canvas }]}
        >
          <Icon name={onPatterns ? 'bar-chart' : 'calendar'} size={20} color={colors.ink} />
          <Txt variant="body" style={{ flex: 1, color: colors.plum }}>{onPatterns ? 'See your patterns' : 'See the month'}</Txt>
          <Icon name="chevron-right" size={20} color={colors.ink3} />
        </Pressable>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { padding: space.md, gap: 10, marginTop: space.sm },
  head: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'baseline', columnGap: space.sm },
  row: { flexDirection: 'row', gap: 3 },
  col: { flex: 1, alignItems: 'center', gap: 4 },
  cell: {
    width: '100%', maxWidth: 44, aspectRatio: 1, borderRadius: 8, borderWidth: 1,
    borderColor: colors.hairline, backgroundColor: colors.canvas, alignItems: 'center', justifyContent: 'center',
  },
  cellOnTint: { backgroundColor: 'transparent', borderColor: colors.borderStrong },
  cellNoted: { borderColor: colors.ink2, backgroundColor: colors.surface },
  digit: { fontWeight: '700', fontSize: 13, fontVariant: ['tabular-nums', 'lining-nums'] },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.ink2 },
  dash: { width: 8, height: 1.5, borderRadius: 1, backgroundColor: colors.ink3 },
  letter: { fontSize: 13 },
  patterns: {
    flexDirection: 'row', alignItems: 'center', gap: space.sm, minHeight: 44,
    borderTopWidth: 1, borderTopColor: colors.borderStrong, marginTop: space.xs, paddingTop: space.xs,
  },
});

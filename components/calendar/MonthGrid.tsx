import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, LayoutChangeEvent } from 'react-native';
import { addDays, endOfMonth, format, isSameDay, startOfMonth, startOfWeek } from 'date-fns';
import { DayCell } from './DayCell';
import type { CalendarDay } from '../../algorithms/calendarDerive';
import { Spacing, MAX_CONTENT_WIDTH } from '../../constants/theme';
import { CalendarMonth, CalendarYear, CalendarWeekday } from '../../constants/typography';
import { toDateStr } from '../../algorithms/dateHelpers';

interface Props {
  month: Date;
  calendar: Map<string, CalendarDay>;
  today: Date;
  onSelectDay: (dateStr: string) => void;
}

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

// Pre-compute a reasonable cell size from screen width so the first paint
// doesn't flash an empty grid. onLayout refines this once the grid view
// actually measures itself.
const SCREEN_W = Math.min(Dimensions.get('window').width, MAX_CONTENT_WIDTH);
const CARD_INSET = Spacing.md * 4; // card horizontal margin (×2) + card padding (×2)
const INITIAL_CELL = Math.floor((SCREEN_W - CARD_INSET) / 7);

export function MonthGrid({ month, calendar, today, onSelectDay }: Props) {
  const [cellSize, setCellSize] = useState(INITIAL_CELL);

  const cells = useMemo(() => {
    const first = startOfMonth(month);
    const last = endOfMonth(month);
    const gridStart = startOfWeek(first, { weekStartsOn: 0 });
    const out: Date[] = [];
    let cur = gridStart;
    while (cur <= last || out.length % 7 !== 0) {
      out.push(cur);
      cur = addDays(cur, 1);
      if (out.length > 42) break;
    }
    return out;
  }, [month]);

  const monthIdx = month.getMonth();

  // The grid container measures its own width and divides by 7 — this
  // gives every cell an exact integer pixel width, no floating-point
  // wrap behaviour. Floor (not round) so 7 cells always fit.
  const onGridLayout = (e: LayoutChangeEvent) => {
    const measured = Math.floor(e.nativeEvent.layout.width / 7);
    if (measured > 0 && measured !== cellSize) setCellSize(measured);
  };

  return (
    <View style={styles.card}>
      {/* Month header */}
      <View style={styles.header}>
        <Text style={styles.monthTitle}>{format(month, 'MMMM')}</Text>
        <Text style={styles.year}>{format(month, 'yyyy')}</Text>
      </View>

      {/* Weekday header — same exact widths so columns align with the grid */}
      <View style={styles.weekdayRow}>
        {WEEKDAYS.map((d, i) => (
          <Text key={i} style={[styles.weekday, { width: cellSize }]}>{d}</Text>
        ))}
      </View>

      {/* Day grid */}
      <View style={styles.grid} onLayout={onGridLayout}>
        {cells.map((d) => {
          const dateStr = toDateStr(d);
          const info = calendar.get(dateStr);
          return (
            <DayCell
              key={dateStr}
              day={d.getDate()}
              info={info}
              isToday={isSameDay(d, today)}
              inMonth={d.getMonth() === monthIdx}
              size={cellSize}
              onPress={() => onSelectDay(dateStr)}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: Spacing.md,
    marginVertical: Spacing.sm,
    padding: Spacing.md,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.45)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
    shadowColor: '#3F2F4A',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.10,
    shadowRadius: 32,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    paddingHorizontal: 6,
    marginBottom: 10,
  },
  monthTitle: { ...CalendarMonth },
  year:       { ...CalendarYear, textAlign: 'right' as const },
  weekdayRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  weekday: { ...CalendarWeekday, textAlign: 'center' as const },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
});

import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { addDays, endOfMonth, format, isSameDay, parseISO, startOfMonth, startOfWeek } from 'date-fns';
import { DayCell } from './DayCell';
import type { CalendarDay } from '../../algorithms/calendarDerive';
import { FontFamily, Spacing } from '../../constants/theme';
import { Type } from '../../constants/typography';
import { Colors } from '../../constants/colors';
import { toDateStr } from '../../algorithms/dateHelpers';

interface Props {
  month: Date;
  calendar: Map<string, CalendarDay>;
  today: Date;
  onSelectDay: (dateStr: string) => void;
}

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export function MonthGrid({ month, calendar, today, onSelectDay }: Props) {
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

  return (
    <View style={styles.card}>
      {/* Month header — Cormorant italic */}
      <View style={styles.header}>
        <Text style={styles.monthTitle}>{format(month, 'MMMM')}</Text>
        <Text style={styles.year}>{format(month, 'yyyy')}</Text>
      </View>

      {/* Weekday header */}
      <View style={styles.weekdayRow}>
        {WEEKDAYS.map((d, i) => (
          <Text key={i} style={styles.weekday}>{d}</Text>
        ))}
      </View>

      {/* Day grid */}
      <View style={styles.grid}>
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
  monthTitle: { ...Type.calendar.month },
  year:       { ...Type.calendar.year, textAlign: 'right' as const },
  weekdayRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  weekday: { ...Type.calendar.weekday, flex: 1, textAlign: 'center' as const },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
});

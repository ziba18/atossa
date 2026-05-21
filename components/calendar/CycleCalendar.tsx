import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Calendar } from 'react-native-calendars';
import type { CycleLog, CyclePrediction } from '../../types/database';
import { Colors } from '../../constants/colors';
import { useColors } from '../../contexts/ThemeContext';
import { FontSize } from '../../constants/theme';
import { isDateInRange, addDaysToStr } from '../../algorithms/dateHelpers';

interface Props {
  cycleLogs: CycleLog[];
  prediction: CyclePrediction | null;
  onDayPress?: (dateStr: string) => void;
}

export function CycleCalendar({ cycleLogs, prediction, onDayPress }: Props) {
  const theme = useColors();
  const markedDates = useMemo(() => {
    const marks: Record<string, any> = {};

    // Mark actual period days
    cycleLogs.forEach((log) => {
      if (!log.period_start) return;
      const end = log.period_end ?? log.period_start;
      let current = log.period_start;
      while (current <= end) {
        marks[current] = {
          color: Colors.menstrual,
          textColor: Colors.white,
          startingDay: current === log.period_start,
          endingDay: current === end,
        };
        current = addDaysToStr(current, 1);
      }
    });

    // Mark predicted period
    if (prediction?.next_period_start && prediction?.next_period_end) {
      let current = prediction.next_period_start;
      while (current <= prediction.next_period_end) {
        marks[current] = {
          color: Colors.predictedPeriod,
          textColor: Colors.cherryDark,
          startingDay: current === prediction.next_period_start,
          endingDay: current === prediction.next_period_end,
        };
        current = addDaysToStr(current, 1);
      }
    }

    // Mark ovulation day
    if (prediction?.next_ovulation) {
      marks[prediction.next_ovulation] = {
        marked: true,
        dotColor: Colors.whiskey,
        selected: false,
      };
    }

    // Mark fertile window
    if (prediction?.fertile_window_start && prediction?.fertile_window_end) {
      let current = prediction.fertile_window_start;
      while (current <= prediction.fertile_window_end) {
        if (!marks[current]) {
          marks[current] = { marked: true, dotColor: Colors.emerald };
        }
        current = addDaysToStr(current, 1);
      }
    }

    return marks;
  }, [cycleLogs, prediction]);

  return (
    <Calendar
      markingType="period"
      markedDates={markedDates}
      onDayPress={(day: any) => onDayPress?.(day.dateString)}
      theme={{
        backgroundColor: theme.background,
        calendarBackground: theme.background,
        textSectionTitleColor: theme.textSecondary,
        selectedDayBackgroundColor: theme.cherry,
        selectedDayTextColor: '#FFFFFF',
        todayTextColor: theme.cherry,
        dayTextColor: theme.textPrimary,
        textDisabledColor: theme.textMuted,
        dotColor: theme.cherry,
        arrowColor: Colors.whiskey,
        monthTextColor: theme.textPrimary,
        textDayFontSize: FontSize.sm,
        textMonthFontSize: FontSize.md,
        textDayHeaderFontSize: FontSize.xs,
        textDayFontFamily: 'CormorantGaramond_400Regular',
        textMonthFontFamily: 'CormorantGaramond_600SemiBold',
        textDayHeaderFontFamily: 'CormorantGaramond_500Medium',
      }}
    />
  );
}

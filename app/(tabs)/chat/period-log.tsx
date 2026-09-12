import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  startOfMonth, endOfMonth, eachDayOfInterval, getDay, subMonths, format,
} from 'date-fns';
import { Icon } from '../../../components/ui/Icon';
import { LogEntrySheet, type LogEntrySheetHandle } from '../../../components/cycle/LogEntrySheet';
import { useAuthStore } from '../../../stores/authStore';
import { api } from '../../../lib/api';
import { today, toDate, toDateStr, daysBetween, addDaysToStr } from '../../../algorithms/dateHelpers';
import type { CycleLog } from '../../../types/database';

const BG        = '#EFEAD9';
const PINK_DEEP = '#1B4332';
const PINK_SOFT = '#E3DCC6';
const INK       = '#1A1512';
const MUTED     = '#7A6F5C';

const WEEKDAY = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const MONTHS_BACK = 12;

interface MonthBlock { key: string; label: string; leadingBlanks: number; days: string[] }

interface ActivePeriod { daysLogged: number; targetLength: number }

export default function PeriodLogScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const profile = useAuthStore((s) => s.profile);
  const sheetRef = useRef<LogEntrySheetHandle>(null);
  const scrollRef = useRef<ScrollView>(null);

  const [periodDates, setPeriodDates] = useState<Set<string>>(new Set());
  const [activePeriod, setActivePeriod] = useState<ActivePeriod | null>(null);

  const load = async () => {
    if (!user) return;
    const cycles = await api.get<CycleLog[]>('/cycles?limit=100');
    const dates = new Set<string>();
    for (const c of cycles) {
      const end = c.period_end ?? c.period_start;
      const span = Math.max(0, daysBetween(c.period_start, end));
      for (let i = 0; i <= span; i++) dates.add(addDaysToStr(c.period_start, i));
    }
    setPeriodDates(dates);

    // Most recently started period, if it's still short of a typical length
    // and recent enough to plausibly still be ongoing — the completion pull
    // here is genuine, not decorative: a full period range is what actually
    // makes cycle predictions more accurate.
    const targetLength = profile?.average_period_length ?? 5;
    const mostRecent = cycles[0];
    if (mostRecent) {
      const end = mostRecent.period_end ?? mostRecent.period_start;
      const daysLogged = daysBetween(mostRecent.period_start, end) + 1;
      const stillRecent = daysBetween(mostRecent.period_start, today()) <= 20;
      setActivePeriod(daysLogged < targetLength && stillRecent ? { daysLogged, targetLength } : null);
    } else {
      setActivePeriod(null);
    }
  };

  useEffect(() => { load(); }, [user]);

  // Continuous run of months, oldest first — a linear scroll, not month-by-month paging.
  const months = useMemo<MonthBlock[]>(() => {
    const now = new Date();
    return Array.from({ length: MONTHS_BACK + 1 }, (_, i) => {
      const anchor = subMonths(now, MONTHS_BACK - i);
      const start = startOfMonth(anchor);
      const end = endOfMonth(anchor);
      return {
        key: format(start, 'yyyy-MM'),
        label: format(start, 'MMMM yyyy'),
        leadingBlanks: getDay(start),
        days: eachDayOfInterval({ start, end }).map(toDateStr),
      };
    });
  }, []);

  // Current month is always the last block, so landing at the bottom puts today in view.
  useEffect(() => {
    const t = setTimeout(() => scrollRef.current?.scrollToEnd({ animated: false }), 60);
    return () => clearTimeout(t);
  }, []);

  const openSheet = (date: string) => sheetRef.current?.open(date);

  return (
    <View style={[styles.safe, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.iconBtn} hitSlop={12}>
          <Icon name="arrow-left" size={20} color={PINK_DEEP} />
        </Pressable>
        <Text style={styles.headerTitle}>Period Log</Text>
        <View style={styles.iconBtn} />
      </View>

      {activePeriod && (
        <View style={styles.progressCard}>
          <Text style={styles.progressLabel}>
            {activePeriod.daysLogged} of ~{activePeriod.targetLength} days logged this period
          </Text>
          <View style={styles.progressDots}>
            {Array.from({ length: activePeriod.targetLength }, (_, i) => (
              <View key={i} style={[styles.progressDot, i < activePeriod.daysLogged && styles.progressDotFilled]} />
            ))}
          </View>
        </View>
      )}

      <ScrollView ref={scrollRef} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.weekdayRow}>
          {WEEKDAY.map((d, i) => (
            <Text key={i} style={styles.weekdayText}>{d}</Text>
          ))}
        </View>

        {months.map((month) => (
          <View key={month.key} style={styles.monthBlock}>
            <Text style={styles.monthLabel}>{month.label}</Text>
            <View style={styles.grid}>
              {Array.from({ length: month.leadingBlanks }, (_, i) => (
                <View key={`blank-${i}`} style={styles.cell} />
              ))}
              {month.days.map((d) => {
                const isToday = d === today();
                const logged = periodDates.has(d);
                const dom = toDate(d).getDate();
                return (
                  <View key={d} style={styles.cell}>
                    <Pressable
                      onPress={() => openSheet(d)}
                      style={[
                        styles.dayCircle,
                        logged && styles.dayCircleLogged,
                        isToday && !logged && styles.dayCircleToday,
                      ]}
                    >
                      <Text style={[
                        styles.dayText,
                        logged && styles.dayTextLogged,
                        isToday && !logged && styles.dayTextToday,
                      ]}>
                        {dom}
                      </Text>
                    </Pressable>
                  </View>
                );
              })}
            </View>
          </View>
        ))}
      </ScrollView>

      {user && <LogEntrySheet ref={sheetRef} onSaved={load} />}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 12, paddingBottom: 10,
    borderBottomWidth: 1, borderBottomColor: PINK_SOFT,
  },
  iconBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: PINK_DEEP, fontSize: 17, fontWeight: '700' },

  progressCard: {
    marginHorizontal: 16, marginTop: 14, padding: 14, borderRadius: 16,
    backgroundColor: '#FFFDF6', borderWidth: 1, borderColor: PINK_SOFT, gap: 8,
  },
  progressLabel: { color: PINK_DEEP, fontSize: 12.5, fontWeight: '700' },
  progressDots: { flexDirection: 'row', gap: 6 },
  progressDot: {
    flex: 1, height: 8, borderRadius: 4, backgroundColor: PINK_SOFT,
  },
  progressDotFilled: { backgroundColor: PINK_DEEP },

  scrollContent: { padding: 16, paddingBottom: 60 },

  weekdayRow: {
    flexDirection: 'row', marginBottom: 6, paddingHorizontal: 2,
  },
  weekdayText: {
    width: `${100 / 7}%`, textAlign: 'center', color: MUTED, fontSize: 12, fontWeight: '700',
  },

  monthBlock: { marginBottom: 22 },
  monthLabel: { color: PINK_DEEP, fontSize: 14, fontWeight: '800', marginBottom: 10, marginLeft: 2 },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },

  cell: { width: `${100 / 7}%`, alignItems: 'center', paddingVertical: 4 },
  dayCircle: {
    width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center',
  },
  dayCircleToday: { borderWidth: 1.5, borderColor: PINK_DEEP },
  dayCircleLogged: { backgroundColor: PINK_DEEP },
  dayText: { color: INK, fontSize: 13, fontWeight: '600' },
  dayTextToday: { color: PINK_DEEP, fontWeight: '800' },
  dayTextLogged: { color: '#fff', fontWeight: '800' },
});

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Icon, type IconName } from '../../../components/ui/Icon';
import { CyclePhaseRing } from '../../../components/cycle/CyclePhaseRing';
import { LogEntrySheet, type LogEntrySheetHandle } from '../../../components/cycle/LogEntrySheet';
import { useAuthStore } from '../../../stores/authStore';
import { fetchMany } from '../../../lib/supabase';
import { computeCycleMath, type RingPhase } from '../../../algorithms/cyclePhase';
import { today, formatShortDate, daysBetween, addDaysToStr, toDate } from '../../../algorithms/dateHelpers';
import type { CycleLog, FlowIntensity, SymptomLog } from '../../../types/database';

const BG        = '#EFEAD9';
const CARD      = '#FFFDF6';
const PINK      = '#9CAF88';
const PINK_DEEP = '#1B4332';
const PINK_SOFT = '#E3DCC6';
const INK       = '#1A1512';
const MUTED     = '#7A6F5C';

const FLOW_LABEL: Record<FlowIntensity, string> = {
  spotting: 'Spotting', light: 'Light', medium: 'Medium', heavy: 'Heavy', very_heavy: 'Very heavy',
};

// One short, phase-relevant sentence — no jargon, no reading required to use the app.
const PHASE_INSIGHT: Record<RingPhase, string> = {
  menstrual: 'Rest where you can — energy is often lowest right now.',
  follicular: 'Energy tends to climb from here — a good window for new things.',
  ovulatory: "You're in your fertile window — energy often peaks here too.",
  luteal: 'PMS symptoms can show up late in this phase — be gentle with yourself.',
};

const WEEKDAY = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

interface RecentEntry { id: string; date: string; title: string; detail: string; icon: IconName; tint: string }

export default function CycleDataScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const profile = useAuthStore((s) => s.profile);
  const sheetRef = useRef<LogEntrySheetHandle>(null);
  const dayScrollRef = useRef<ScrollView>(null);

  const [cycleLogs, setCycleLogs] = useState<CycleLog[]>([]);
  const [loggedDates, setLoggedDates] = useState<Set<string>>(new Set());
  const [recent, setRecent] = useState<RecentEntry[]>([]);

  const dayStrip = useMemo(() => {
    const start = addDaysToStr(today(), -13);
    return Array.from({ length: 14 }, (_, i) => addDaysToStr(start, i));
  }, []);

  const load = async () => {
    if (!user) return;
    const [cycles, symLogs] = await Promise.all([
      fetchMany<CycleLog>('cycle_logs', { user_id: user.id }, { orderBy: 'period_start', ascending: false, limit: 12 }),
      fetchMany<SymptomLog>('symptom_logs', { user_id: user.id }, { orderBy: 'logged_date', ascending: false, limit: 120 }),
    ]);
    setCycleLogs(cycles);

    const dates = new Set<string>();
    for (const c of cycles) {
      const end = c.period_end ?? c.period_start;
      const span = Math.max(0, daysBetween(c.period_start, end));
      for (let i = 0; i <= span; i++) dates.add(addDaysToStr(c.period_start, i));
    }
    for (const s of symLogs) dates.add(s.logged_date);
    setLoggedDates(dates);

    setRecent(cycles.slice(0, 5).map((c) => ({
      id: `cycle-${c.id}`,
      date: c.period_start,
      title: 'Period',
      detail: c.flow_intensity ? FLOW_LABEL[c.flow_intensity] : 'Logged',
      icon: 'droplet' as IconName,
      tint: PINK_DEEP,
    })));
  };

  useEffect(() => { load(); }, [user]);

  useEffect(() => {
    const t = setTimeout(() => dayScrollRef.current?.scrollToEnd({ animated: false }), 60);
    return () => clearTimeout(t);
  }, []);

  const cycleMath = useMemo(() => {
    if (!user) return null;
    return computeCycleMath({
      cycleLogs,
      defaultCycleLength: profile?.average_cycle_length,
      defaultPeriodLength: profile?.average_period_length,
      userId: user.id,
    });
  }, [cycleLogs, profile, user]);

  const todayLogged = loggedDates.has(today());

  const openSheet = (date: string) => sheetRef.current?.open(date);

  return (
    <View style={[styles.safe, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.iconBtn} hitSlop={12}>
          <Icon name="arrow-left" size={20} color={PINK_DEEP} />
        </Pressable>
        <Text style={styles.headerTitle}>Cycle Data</Text>
        <View style={styles.iconBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* ── Cycle ring — orientation, not data density ── */}
        <LinearGradient colors={['#FFFDF6', '#EFEAD9']} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={styles.hero}>
          {cycleMath && (
            <CyclePhaseRing
              size={236}
              cycleDay={cycleMath.cycleDay}
              cycleLength={cycleMath.cycleLength}
              periodLength={cycleMath.periodLength}
              phaseBoundaries={cycleMath.phaseBoundaries}
              isIrregular={cycleMath.isIrregular}
              todayLogged={todayLogged}
              hasData={cycleMath.hasData}
              daysUntilNextPeriod={cycleMath.daysUntilNextPeriod}
              accessibilityLabel={cycleMath.accessibilityLabel}
              onPressCenter={() => openSheet(today())}
            />
          )}
          {cycleMath?.isIrregular && cycleMath.hasData && (
            <Text style={styles.irregularNote}>Your cycles vary — predictions are a range, not a fixed date.</Text>
          )}
        </LinearGradient>

        {/* ── Today's insight — one sentence, phase-relevant ── */}
        {cycleMath?.hasData && (
          <View style={styles.insightCard}>
            <Icon name="potion" size={14} color={PINK_DEEP} />
            <Text style={styles.insightText}>{PHASE_INSIGHT[cycleMath.phase]}</Text>
          </View>
        )}

        {/* ── Day strip — tap any day to log/edit it ── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Recent days</Text>
          <ScrollView ref={dayScrollRef} horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dayStrip}>
            {dayStrip.map((d) => {
              const isToday = d === today();
              const has = loggedDates.has(d);
              const dow = WEEKDAY[toDate(d).getDay()];
              const dom = toDate(d).getDate();
              return (
                <Pressable key={d} onPress={() => openSheet(d)} style={[styles.dayPill, isToday && styles.dayPillToday]}>
                  <Text style={[styles.dayDow, isToday && styles.dayTextToday]}>{dow}</Text>
                  <Text style={[styles.dayDom, isToday && styles.dayTextToday]}>{dom}</Text>
                  <View style={[styles.dayDot, has && styles.dayDotOn]} />
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {recent.length > 0 && (
          <View style={styles.recentSection}>
            <View style={styles.recentTitleRow}>
              <Icon name="crow" size={13} color={PINK_DEEP} />
              <Text style={styles.recentTitle}>Recent entries</Text>
            </View>
            {recent.map((r) => (
              <View key={r.id} style={styles.recentRow}>
                <View style={[styles.recentIcon, { backgroundColor: r.tint + '1F' }]}>
                  <Icon name={r.icon} size={16} color={r.tint} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.recentLabel}>{r.title}</Text>
                  <Text style={styles.recentDetail}>{r.detail}</Text>
                </View>
                <Text style={styles.recentDate}>{formatShortDate(r.date)}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* ── Always-visible quick-log entry point ── */}
      <Pressable style={[styles.fab, { bottom: insets.bottom + 84 }]} onPress={() => openSheet(today())}>
        <Icon name="plus" size={22} color="#fff" />
      </Pressable>

      {user && <LogEntrySheet ref={sheetRef} userId={user.id} onSaved={load} />}
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

  scrollContent: { padding: 16, paddingBottom: 100, gap: 14 },

  hero: {
    borderRadius: 28, borderWidth: 1, borderColor: '#FFFFFF',
    paddingTop: 20, paddingBottom: 16, paddingHorizontal: 16, alignItems: 'center',
    shadowColor: PINK_DEEP, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.12, shadowRadius: 20, elevation: 6,
  },
  irregularNote: { color: MUTED, fontSize: 11.5, textAlign: 'center', marginTop: 10, lineHeight: 16 },

  insightCard: {
    flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: CARD,
    borderRadius: 16, borderWidth: 1, borderColor: PINK_SOFT, padding: 14,
  },
  insightText: { flex: 1, color: INK, fontSize: 13, fontWeight: '500', lineHeight: 18 },

  card: {
    backgroundColor: CARD, borderRadius: 22, borderWidth: 1, borderColor: PINK_SOFT, padding: 18,
    shadowColor: PINK_DEEP, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.06, shadowRadius: 14, elevation: 2,
  },
  cardTitle: { color: PINK_DEEP, fontSize: 14, fontWeight: '800', marginBottom: 12 },

  dayStrip: { gap: 8, paddingVertical: 2 },
  dayPill: {
    width: 46, paddingVertical: 8, borderRadius: 16, backgroundColor: '#E3DCC6',
    borderWidth: 1, borderColor: PINK, alignItems: 'center', gap: 2,
  },
  dayPillToday: { backgroundColor: PINK_DEEP, borderColor: PINK_DEEP },
  dayDow: { color: MUTED, fontSize: 11, fontWeight: '700' },
  dayDom: { color: INK, fontSize: 16, fontWeight: '800' },
  dayTextToday: { color: '#fff' },
  dayDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: 'transparent', marginTop: 1 },
  dayDotOn: { backgroundColor: PINK_DEEP },

  recentSection: { gap: 10 },
  recentTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2, marginLeft: 2 },
  recentTitle: { color: PINK_DEEP, fontSize: 14, fontWeight: '800' },
  recentRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: CARD, borderRadius: 16,
    borderWidth: 1, borderColor: PINK_SOFT, paddingHorizontal: 14, paddingVertical: 12, gap: 12,
  },
  recentIcon: { width: 34, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  recentLabel: { color: INK, fontSize: 14, fontWeight: '700' },
  recentDetail: { color: MUTED, fontSize: 12, marginTop: 1 },
  recentDate: { color: MUTED, fontSize: 11, fontWeight: '700' },

  fab: {
    position: 'absolute', right: 20, width: 56, height: 56, borderRadius: 28,
    backgroundColor: PINK_DEEP, alignItems: 'center', justifyContent: 'center',
    shadowColor: PINK_DEEP, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 10, elevation: 8,
  },
});

import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { addDays, differenceInDays, format, parseISO } from 'date-fns';
import { useAuthStore } from '../../../stores/authStore';
import { useCycleStore } from '../../../stores/cycleStore';
import { CycleRing } from '../../../components/calendar/CycleRing';
import { Icon } from '../../../components/ui/Icon';
import { useColors, type AppColors } from '../../../contexts/ThemeContext';
import { FontSize, Spacing, Radius, Shadow } from '../../../constants/theme';
import { AuroraBackground } from '../../../components/layout/AuroraBackground';

// ── Phase palette ─────────────────────────────────────────────────────────────
// Anchored to the warm rose palette in constants/colors.ts. Each phase has
// a distinct hue but they all sit in the same tonal family (warm, slightly
// muted) so the cycle ring feels cohesive.
const PHASE_COLORS = {
  period:     '#B0455A', // deep rose
  follicular: '#B5C8B5', // light muted sage
  fertile:    '#8FA88E', // muted sage
  ovulation:  '#D4A65C', // warm honey
  luteal:     '#A89AB5', // soft mauve
} as const;

type Phase = keyof typeof PHASE_COLORS;

// ── Phase content (the "Clue-style" insight block) ───────────────────────────
const PHASE_DATA: Record<Phase, {
  label: string;
  subtitle: string;
  description: string;
  energy: string;
  mood: string;
  tips: string[];
}> = {
  period: {
    label: 'Menstrual Phase',
    subtitle: 'Your body renews',
    description: 'Estrogen and progesterone are at their lowest. This is a natural time to slow down, rest, and turn inward.',
    energy: 'Low',
    mood: 'Introspective',
    tips: ['Rest & gentle movement', 'Iron-rich foods', 'Heat for cramps'],
  },
  follicular: {
    label: 'Follicular Phase',
    subtitle: 'Energy is rising',
    description: 'Rising estrogen boosts serotonin and dopamine. You\'re entering your sharpest, most creative phase of the cycle.',
    energy: 'Building',
    mood: 'Optimistic',
    tips: ['Start new projects', 'Social plans', 'Increase workout intensity'],
  },
  fertile: {
    label: 'Fertile Window',
    subtitle: 'Peak fertility',
    description: 'Estrogen peaks and cervical mucus becomes clear and stretchy. Your fertility is at its highest right now.',
    energy: 'High',
    mood: 'Confident',
    tips: ['Track discharge', 'Use OPK if trying', 'Libido peaks here'],
  },
  ovulation: {
    label: 'Ovulation',
    subtitle: 'Peak energy & drive',
    description: 'The LH surge triggers egg release. You\'re at your most magnetic, energised, and communicative today.',
    energy: 'Peak',
    mood: 'Social & bold',
    tips: ['Peak performance day', 'High social energy', 'BBT rises slightly'],
  },
  luteal: {
    label: 'Luteal Phase',
    subtitle: 'Nesting mode',
    description: 'Progesterone rises then falls. Energy shifts inward. Self-care and routine are your best allies.',
    energy: 'Declining',
    mood: 'Inward',
    tips: ['Magnesium & B6', 'Wind-down routines', 'Limit caffeine'],
  },
};

function classifyDay(day: number, menEnd: number, ovDay: number): Phase {
  if (day <= menEnd) return 'period';
  if (day === ovDay) return 'ovulation';
  if (day >= ovDay - 4 && day <= ovDay + 1) return 'fertile';
  if (day > ovDay + 1) return 'luteal';
  return 'follicular';
}

// ── Quick-log actions ─────────────────────────────────────────────────────────
const QUICK_ACTIONS = [
  { label: 'Period',   icon: 'droplets',  route: '/(tabs)/cycle/log-period' },
  { label: 'Health',   icon: 'heart',     route: '/(tabs)/health' },
  { label: 'Calendar', icon: 'calendar',  route: '/(tabs)/cycle/calendar' },
] as const;

// ── Week-ahead phase abbreviations ────────────────────────────────────────────
const PHASE_SHORT: Record<Phase, string> = {
  period:     'Period',
  follicular: 'Foll.',
  fertile:    'Fert.',
  ovulation:  'Ov.',
  luteal:     'Lut.',
};

// ── Component ─────────────────────────────────────────────────────────────────
export default function CycleScreen() {
  const router    = useRouter();
  const theme     = useColors();
  const styles    = createStyles(theme);
  const insets    = useSafeAreaInsets();
  const user      = useAuthStore((s) => s.user);
  const { cycleLogs, prediction, fetchCycleLogs, fetchPrediction } = useCycleStore();

  useEffect(() => {
    if (user) { fetchCycleLogs(user.id); fetchPrediction(user.id); }
  }, [user]);

  // ── Derived cycle state ───────────────────────────────────────────────────
  const cycle = useMemo(() => {
    const todayStr  = format(new Date(), 'yyyy-MM-dd');
    const totalDays = prediction?.predicted_cycle_length ?? 28;
    const sorted    = [...cycleLogs].sort((a, b) => b.period_start.localeCompare(a.period_start));
    const last      = sorted[0];

    let cycleDay = 1;
    if (last?.period_start) {
      const diff = differenceInDays(parseISO(todayStr), parseISO(last.period_start));
      cycleDay = Math.min(Math.max(1, diff + 1), totalDays);
    }

    const menEnd = last?.period_length ?? 5;
    const ovDay  = Math.max(menEnd + 4, totalDays - 14);
    const phase  = classifyDay(cycleDay, menEnd, ovDay);

    const daysUntilPeriod = prediction?.next_period_start
      ? Math.max(0, differenceInDays(parseISO(prediction.next_period_start), parseISO(todayStr)))
      : Math.max(0, totalDays - cycleDay);

    // ── 7-day week strip ─────────────────────────────────────────────────────
    const weekDays = Array.from({ length: 7 }, (_, i) => {
      const date    = addDays(new Date(), i);
      const dateStr = format(date, 'yyyy-MM-dd');
      let dayInCycle = cycleDay + i;
      if (last?.period_start) {
        const rawDiff = differenceInDays(parseISO(dateStr), parseISO(last.period_start));
        // wrap around if past predicted cycle length
        dayInCycle = ((rawDiff) % totalDays) + 1;
      }
      return {
        date,
        label:      i === 0 ? 'Today' : format(date, 'EEE'),
        dayNum:     format(date, 'd'),
        cycleDay:   dayInCycle,
        phase:      classifyDay(dayInCycle, menEnd, ovDay),
        isToday:    i === 0,
      };
    });

    // ── Upcoming events for the "Coming Up" card ──────────────────────────
    const events: Array<{ label: string; date: string; color: string; icon: string }> = [];

    if (prediction?.fertile_window_start) {
      const d = differenceInDays(parseISO(prediction.fertile_window_start), parseISO(todayStr));
      if (d >= 0 && d <= 14) {
        events.push({
          label: d === 0 ? 'Fertile window starts today' : `Fertile window in ${d}d`,
          date:  prediction.fertile_window_start,
          color: PHASE_COLORS.fertile,
          icon:  'leaf',
        });
      }
    }

    if (prediction?.next_ovulation) {
      const d = differenceInDays(parseISO(prediction.next_ovulation), parseISO(todayStr));
      if (d >= 0 && d <= 21) {
        events.push({
          label: d === 0 ? 'Ovulation today' : `Ovulation in ${d}d`,
          date:  prediction.next_ovulation,
          color: PHASE_COLORS.ovulation,
          icon:  'zap',
        });
      }
    }

    if (prediction?.next_period_start && daysUntilPeriod <= 14) {
      events.push({
        label: daysUntilPeriod === 0 ? 'Period expected today' : `Next period in ${daysUntilPeriod}d`,
        date:  prediction.next_period_start,
        color: PHASE_COLORS.period,
        icon:  'droplets',
      });
    }

    // ── Average cycle length ──────────────────────────────────────────────
    const avgCycleLength = cycleLogs.length >= 2
      ? Math.round(
          cycleLogs.slice(0, 6).reduce((s, _, i, arr) => {
            if (i === 0) return s;
            return s + differenceInDays(parseISO(arr[i - 1].period_start), parseISO(arr[i].period_start));
          }, 0) / Math.min(cycleLogs.length - 1, 5),
        )
      : null;

    return {
      phase, cycleDay, totalDays, daysUntilPeriod,
      weekDays, events, avgCycleLength,
      hasData: cycleLogs.length > 0,
    };
  }, [cycleLogs, prediction]);

  const phaseData  = PHASE_DATA[cycle.phase];
  const phaseColor = PHASE_COLORS[cycle.phase];
  const bottomPad  = 68 + 12 + insets.bottom + 16;

  // Lock the page scroll while the user is dragging the cycle ring so the
  // page doesn't move underneath them.
  const [ringDragging, setRingDragging] = useState(false);

  return (
    <View style={styles.screen}>
      <AuroraBackground />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: bottomPad }}
          scrollEnabled={!ringDragging}
        >

          {/* ── Header ── */}
          <View style={styles.header}>
            <Text style={styles.title}>My Cycle</Text>
          </View>

          {/* ── Cycle Ring ── */}
          <View style={styles.ringCard}>
            <CycleRing
              cycleLogs={cycleLogs}
              prediction={prediction}
              onDragChange={setRingDragging}
            />
          </View>

          {/* ── Quick-log row ── */}
          <View style={styles.quickRow}>
            {QUICK_ACTIONS.map((a) => (
              <TouchableOpacity
                key={a.label}
                onPress={() => router.push(a.route as any)}
                style={styles.quickItem}
                activeOpacity={0.75}
              >
                <View style={styles.quickIcon}>
                  <Icon name={a.icon} size={20} color={theme.cherry} />
                </View>
                <Text style={styles.quickLabel}>{a.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* ── Phase insight card ── */}
          {cycle.hasData && (
            <View style={[styles.phaseCard, { borderColor: phaseColor + '45' }]}>
              {/* Top row: phase name + energy/mood chips */}
              <View style={styles.phaseTop}>
                <View style={[styles.phasePip, { backgroundColor: phaseColor }]} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.phaseLabel, { color: phaseColor }]}>{phaseData.label}</Text>
                  <Text style={styles.phaseSub}>{phaseData.subtitle}</Text>
                </View>
                <View style={styles.phaseChips}>
                  <View style={[styles.phaseChip, { backgroundColor: phaseColor + '1A' }]}>
                    <Text style={[styles.phaseChipText, { color: phaseColor }]}>⚡ {phaseData.energy}</Text>
                  </View>
                  <View style={[styles.phaseChip, { backgroundColor: phaseColor + '1A' }]}>
                    <Text style={[styles.phaseChipText, { color: phaseColor }]}>💭 {phaseData.mood}</Text>
                  </View>
                </View>
              </View>

              {/* Description */}
              <Text style={styles.phaseDesc}>{phaseData.description}</Text>

              {/* Tip chips */}
              <View style={styles.tipRow}>
                {phaseData.tips.map((t, i) => (
                  <View key={i} style={[styles.tipChip, { backgroundColor: phaseColor + '18', borderColor: phaseColor + '35' }]}>
                    <Text style={[styles.tipText, { color: phaseColor }]}>{t}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* ── Week-ahead strip ── */}
          {cycle.hasData && (
            <View style={styles.weekCard}>
              <Text style={styles.sectionLabel}>WEEK AHEAD</Text>
              <View style={styles.weekRow}>
                {cycle.weekDays.map((d, i) => (
                  <View key={i} style={styles.weekDay}>
                    <Text style={[styles.weekDayName, d.isToday && { color: theme.textPrimary, fontFamily: 'Jost_600SemiBold' }]}>
                      {d.label}
                    </Text>
                    <View style={[
                      styles.weekDayBubble,
                      { backgroundColor: PHASE_COLORS[d.phase] + (d.isToday ? 'FF' : '40') },
                      d.isToday && styles.weekDayBubbleToday,
                    ]}>
                      <Text style={[styles.weekDayNum, d.isToday && { color: '#FFF', fontFamily: 'Jost_600SemiBold' }]}>
                        {d.dayNum}
                      </Text>
                    </View>
                    <Text style={[styles.weekPhase, { color: PHASE_COLORS[d.phase] }]}>
                      {PHASE_SHORT[d.phase]}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* ── Coming up ── */}
          {cycle.events.length > 0 && (
            <View style={styles.eventsCard}>
              <Text style={styles.sectionLabel}>COMING UP</Text>
              <View style={styles.eventsList}>
                {cycle.events.map((ev, i) => (
                  <View key={i} style={[styles.eventRow, i < cycle.events.length - 1 && styles.eventRowBorder]}>
                    <View style={[styles.eventIconWrap, { backgroundColor: ev.color + '1E' }]}>
                      <Icon name={ev.icon as any} size={14} color={ev.color} />
                    </View>
                    <Text style={styles.eventLabel}>{ev.label}</Text>
                    <Text style={[styles.eventDate, { color: ev.color }]}>
                      {format(parseISO(ev.date), 'MMM d')}
                    </Text>
                  </View>
                ))}
              </View>
              {prediction?.confidence_score !== undefined && (
                <View style={styles.aiRow}>
                  <Icon name="sparkles" size={11} color={theme.cherry} />
                  <Text style={styles.aiText}>
                    Predicted from your history · {Math.round(prediction.confidence_score ?? 0)}% confidence
                    {prediction.method_used === 'moving_average_6'
                      ? ' · 6-cycle average'
                      : prediction.method_used === 'average'
                      ? ' · improving with each cycle'
                      : ' · log more cycles to improve accuracy'}
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* ── Cycle stats ── */}
          {cycle.avgCycleLength !== null && (
            <View style={styles.statsCard}>
              <Text style={styles.sectionLabel}>CYCLE STATS</Text>
              <View style={styles.statsRow}>
                <View style={styles.stat}>
                  <Text style={styles.statValue}>{cycle.avgCycleLength}</Text>
                  <Text style={styles.statLabel}>Avg days</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.stat}>
                  <Text style={styles.statValue}>{cycleLogs.length}</Text>
                  <Text style={styles.statLabel}>Cycles logged</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.stat}>
                  <Text style={[styles.statValue, { color: prediction?.predicted_cycle_length ? theme.cherry : theme.textMuted }]}>
                    {prediction?.predicted_cycle_length ?? '—'}
                  </Text>
                  <Text style={styles.statLabel}>Predicted next</Text>
                </View>
              </View>
            </View>
          )}

          {/* ── Empty state ── */}
          {!cycle.hasData && (
            <View style={styles.emptyCard}>
              <Icon name="flower" size={48} color={theme.cherry} />
              <Text style={styles.emptyTitle}>Start tracking your cycle</Text>
              <Text style={styles.emptySub}>
                Log your first period to unlock personalised cycle predictions, phase insights, and your cycle ring.
              </Text>
              <TouchableOpacity
                onPress={() => router.push('/(tabs)/cycle/log-period')}
                style={styles.emptyBtn}
                activeOpacity={0.8}
              >
                <Text style={styles.emptyBtnText}>Log first period</Text>
              </TouchableOpacity>
            </View>
          )}

        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
function createStyles(c: AppColors) {
  const glass = c.surface + 'B8';
  return StyleSheet.create({
    screen:        { flex: 1, backgroundColor: c.background },

    // Header
    header:        { paddingHorizontal: Spacing.md, paddingTop: Spacing.md, paddingBottom: Spacing.xs },
    title:         { fontSize: 28, fontFamily: 'Jost_600SemiBold', color: c.textPrimary },

    // Ring
    ringCard:      { marginHorizontal: Spacing.md, backgroundColor: glass, borderRadius: 32, borderWidth: 1, borderColor: c.border, overflow: 'hidden', paddingVertical: Spacing.sm },

    // Quick-log row
    quickRow:      { flexDirection: 'row', marginHorizontal: Spacing.md, marginTop: Spacing.md, backgroundColor: glass, borderRadius: 24, borderWidth: 1, borderColor: c.border, paddingVertical: Spacing.sm },
    quickItem:     { flex: 1, alignItems: 'center', gap: 6, paddingVertical: 4 },
    quickIcon:     { width: 44, height: 44, borderRadius: 14, backgroundColor: c.cherryLighter, alignItems: 'center', justifyContent: 'center' },
    quickLabel:    { fontSize: 11, fontFamily: 'Jost_500Medium', color: c.textSecondary },

    // Phase insight card
    phaseCard:     { marginHorizontal: Spacing.md, marginTop: Spacing.md, backgroundColor: glass, borderRadius: 24, borderWidth: 1, padding: Spacing.md, gap: Spacing.sm },
    phaseTop:      { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
    phasePip:      { width: 10, height: 10, borderRadius: 5, marginTop: 5 },
    phaseLabel:    { fontSize: FontSize.md, fontFamily: 'Jost_600SemiBold' },
    phaseSub:      { fontSize: FontSize.xs, fontFamily: 'Jost_400Regular', color: c.textMuted, marginTop: 1 },
    phaseChips:    { gap: 4, alignItems: 'flex-end' },
    phaseChip:     { borderRadius: Radius.full, paddingHorizontal: 8, paddingVertical: 3 },
    phaseChipText: { fontSize: 10, fontFamily: 'Jost_500Medium' },
    phaseDesc:     { fontSize: FontSize.sm, fontFamily: 'Jost_400Regular', color: c.textSecondary, lineHeight: 21 },
    tipRow:        { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
    tipChip:       { borderRadius: Radius.full, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 4 },
    tipText:       { fontSize: 11, fontFamily: 'Jost_500Medium' },

    // Week strip
    weekCard:      { marginHorizontal: Spacing.md, marginTop: Spacing.md, backgroundColor: glass, borderRadius: 24, borderWidth: 1, borderColor: c.border, padding: Spacing.md },
    sectionLabel:  { fontSize: 9.5, fontFamily: 'Jost_600SemiBold', color: c.textMuted, letterSpacing: 1.4, marginBottom: Spacing.sm },
    weekRow:       { flexDirection: 'row', justifyContent: 'space-between' },
    weekDay:       { alignItems: 'center', gap: 4 },
    weekDayName:   { fontSize: 10, fontFamily: 'Jost_400Regular', color: c.textMuted },
    weekDayBubble: { width: 34, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    weekDayBubbleToday: { ...Shadow.sm },
    weekDayNum:    { fontSize: FontSize.sm, fontFamily: 'Jost_400Regular', color: c.textPrimary },
    weekPhase:     { fontSize: 9, fontFamily: 'Jost_500Medium' },

    // Events / Coming up
    eventsCard:    { marginHorizontal: Spacing.md, marginTop: Spacing.md, backgroundColor: glass, borderRadius: 24, borderWidth: 1, borderColor: c.border, padding: Spacing.md },
    eventsList:    { gap: 0 },
    eventRow:      { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingVertical: 10 },
    eventRowBorder:{ borderBottomWidth: 1, borderBottomColor: c.border },
    eventIconWrap: { width: 30, height: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    eventLabel:    { flex: 1, fontSize: FontSize.sm, fontFamily: 'Jost_400Regular', color: c.textPrimary },
    eventDate:     { fontSize: FontSize.sm, fontFamily: 'Jost_600SemiBold' },
    aiRow:         { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: Spacing.sm, paddingTop: Spacing.sm, borderTopWidth: 1, borderTopColor: c.border },
    aiText:        { flex: 1, fontSize: 10.5, fontFamily: 'Jost_400Regular', color: c.textMuted, lineHeight: 15 },

    // Stats
    statsCard:     { marginHorizontal: Spacing.md, marginTop: Spacing.md, backgroundColor: glass, borderRadius: 24, borderWidth: 1, borderColor: c.border, padding: Spacing.md },
    statsRow:      { flexDirection: 'row', justifyContent: 'space-around', marginTop: Spacing.sm },
    stat:          { alignItems: 'center' },
    statValue:     { fontSize: FontSize.xxl, fontFamily: 'Jost_600SemiBold', color: c.textPrimary },
    statLabel:     { fontSize: FontSize.xs, fontFamily: 'Jost_400Regular', color: c.textMuted, marginTop: 2 },
    statDivider:   { width: 1, backgroundColor: c.border },

    // Empty state
    emptyCard:     { alignItems: 'center', marginHorizontal: Spacing.md, marginTop: Spacing.md, gap: Spacing.sm, backgroundColor: glass, borderRadius: 24, borderWidth: 1, borderColor: c.border, padding: 36 },
    emptyTitle:    { fontSize: FontSize.lg, fontFamily: 'Jost_600SemiBold', color: c.textPrimary, textAlign: 'center' },
    emptySub:      { fontSize: FontSize.sm, fontFamily: 'Jost_400Regular', color: c.textMuted, textAlign: 'center', lineHeight: 21 },
    emptyBtn:      { backgroundColor: c.cherry, borderRadius: Radius.full, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.sm, marginTop: Spacing.sm },
    emptyBtnText:  { fontSize: FontSize.md, fontFamily: 'Jost_600SemiBold', color: '#FFFFFF' },
  });
}

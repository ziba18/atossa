import React, { useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../../stores/authStore';
import { useCycleStore } from '../../../stores/cycleStore';
import { usePCOSQuizStore } from '../../../stores/pcosQuizStore';
import { CycleRing } from '../../../components/calendar/CycleRing';
import { PhaseLegend } from '../../../components/calendar/PhaseLegend';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Icon } from '../../../components/ui/Icon';
import { Colors } from '../../../constants/colors';
import { FontSize, Spacing, Radius } from '../../../constants/theme';
import { formatDisplayDate } from '../../../algorithms/dateHelpers';

export default function CycleScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { cycleLogs, prediction, fetchCycleLogs, fetchPrediction } = useCycleStore();
  const quizResult = usePCOSQuizStore((s) => s.result);

  useEffect(() => {
    if (user) {
      fetchCycleLogs(user.id);
      fetchPrediction(user.id);
    }
  }, [user]);

  const avgCycleLength = cycleLogs.length >= 2
    ? Math.round(cycleLogs.slice(0, 6).reduce((s, _, i, arr) => {
        if (i === 0) return s;
        const diff = new Date(arr[i - 1].period_start).getTime() - new Date(arr[i].period_start).getTime();
        return s + diff / (1000 * 86400);
      }, 0) / Math.min(cycleLogs.length - 1, 5))
    : null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* ── Header ── */}
        <View style={styles.header}>
          <Text style={styles.title}>My Cycle</Text>
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/cycle/log-period')}
            style={styles.logBtn}
          >
            <Text style={styles.logBtnText}>+ Log Period</Text>
          </TouchableOpacity>
        </View>

        {/* ── Cycle Ring ── */}
        <CycleRing cycleLogs={cycleLogs} prediction={prediction} />
        <PhaseLegend />

        {/* ── Prediction card ── */}
        {prediction && (
          <Card style={styles.predCard} elevated>
            <Text style={styles.sectionLabel}>Next Period Prediction</Text>
            <Text style={styles.bigDate}>
              {prediction.next_period_start ? formatDisplayDate(prediction.next_period_start) : '—'}
            </Text>
            <View style={styles.row}>
              <Badge label={`${Math.round(prediction.confidence_score ?? 0)}% confidence`} variant="cherry" />
              {prediction.method_used && (
                <Badge label={prediction.method_used.replace(/_/g, ' ')} variant="neutral" />
              )}
            </View>
            {prediction.fertile_window_start && (
              <View style={styles.fertileRow}>
                <Icon name="leaf" size={14} color={Colors.forest} />
                <Text style={styles.fertileText}>
                  Fertile window: {formatDisplayDate(prediction.fertile_window_start)} – {formatDisplayDate(prediction.fertile_window_end!)}
                </Text>
              </View>
            )}
          </Card>
        )}

        {/* ── Cycle stats ── */}
        {avgCycleLength && (
          <Card style={styles.statsCard}>
            <Text style={styles.sectionLabel}>Cycle Stats</Text>
            <View style={styles.statsRow}>
              <View style={styles.stat}>
                <Text style={styles.statValue}>{avgCycleLength}</Text>
                <Text style={styles.statLabel}>Avg Days</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.stat}>
                <Text style={styles.statValue}>{cycleLogs.length}</Text>
                <Text style={styles.statLabel}>Logged Cycles</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.stat}>
                <Text style={[styles.statValue, { color: prediction?.predicted_cycle_length ? Colors.cherry : Colors.textMuted }]}>
                  {prediction?.predicted_cycle_length ?? '—'}
                </Text>
                <Text style={styles.statLabel}>Predicted Next</Text>
              </View>
            </View>
          </Card>
        )}

        {/* ── Calendar ── */}
        <TouchableOpacity
          onPress={() => router.push('/(tabs)/cycle/calendar' as any)}
          activeOpacity={0.85}
          style={styles.calendarCard}
        >
          <View style={styles.calendarLeft}>
            <Icon name="calendar" size={22} color={Colors.cherry} />
            <View>
              <Text style={styles.calendarTitle}>Calendar</Text>
              <Text style={styles.calendarSub}>Full history &amp; year-ahead predictions</Text>
            </View>
          </View>
          <Icon name="chevron-right" size={18} color={Colors.textMuted} />
        </TouchableOpacity>


        {/* ── No data CTA ── */}
        {cycleLogs.length === 0 && (
          <Card style={styles.emptyCard}>
            <Icon name="calendar" size={44} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>No period logged yet</Text>
            <Text style={styles.emptySub}>
              Log your first period to see your cycle ring and get predictions
            </Text>
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/cycle/log-period')}
              style={styles.emptyBtn}
              activeOpacity={0.8}
            >
              <Text style={styles.emptyBtnText}>Log first period</Text>
            </TouchableOpacity>
          </Card>
        )}

        {/* ── PCOS Assessment card ── */}
        <TouchableOpacity
          onPress={() => router.push('/(tabs)/insights/pcos-assessment' as any)}
          activeOpacity={0.85}
          style={styles.pcosCard}
        >
          <View style={styles.pcosHeader}>
            <View style={styles.pcosTitleRow}>
              <Icon name="stethoscope" size={18} color={Colors.gold} />
              <Text style={styles.pcosTitle}>PCOS Risk Assessment</Text>
            </View>
            <Icon name="chevron-right" size={18} color={Colors.textMuted} />
          </View>

          {quizResult ? (
            <>
              <View style={styles.pcosBarBg}>
                <View style={[styles.pcosBarFill, { width: `${quizResult.scorePct}%` as any, backgroundColor: quizResult.tierColor }]} />
              </View>
              <View style={styles.pcosResultRow}>
                <View>
                  <Text style={[styles.pcosTierLabel, { color: quizResult.tierColor }]}>{quizResult.tierLabel}</Text>
                  <Text style={styles.pcosTakenAt}>
                    Taken {new Date(quizResult.takenAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </Text>
                </View>
                <View style={[styles.pcosPctBadge, { backgroundColor: quizResult.tierColor + '18', borderColor: quizResult.tierColor + '30' }]}>
                  <Text style={[styles.pcosPctText, { color: quizResult.tierColor }]}>{quizResult.scorePct}%</Text>
                </View>
              </View>
            </>
          ) : (
            <View style={styles.pcosCta}>
              <Text style={styles.pcosCtaText}>Take the quiz to understand your PCOS risk</Text>
              <View style={styles.pcosCtaBtn}>
                <Text style={styles.pcosCtaBtnText}>Start Quiz</Text>
              </View>
            </View>
          )}
        </TouchableOpacity>

        <View style={{ height: Spacing.xl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xs,
  },
  title: {
    fontSize: FontSize.xxl,
    fontFamily: 'CormorantGaramond_600SemiBold',
    color: Colors.textPrimary,
  },
  logBtn: {
    backgroundColor: Colors.cherry,
    borderRadius: 99,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
  },
  logBtnText: {
    color: Colors.white,
    fontFamily: 'Jost_600SemiBold',
    fontSize: FontSize.sm,
  },

  predCard: { marginHorizontal: Spacing.md, gap: Spacing.sm },
  sectionLabel: { fontSize: FontSize.sm, fontFamily: 'Jost_500Medium', color: Colors.textMuted },
  bigDate: { fontSize: FontSize.xxl, fontFamily: 'CormorantGaramond_600SemiBold', color: Colors.cherry },
  row: { flexDirection: 'row', gap: Spacing.xs },
  fertileRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  fertileText: { fontSize: FontSize.sm, fontFamily: 'Jost_400Regular', color: Colors.forest },

  statsCard: { marginHorizontal: Spacing.md, marginTop: Spacing.md },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: Spacing.sm },
  stat: { alignItems: 'center' },
  statValue: { fontSize: FontSize.xxl, fontFamily: 'CormorantGaramond_600SemiBold', color: Colors.textPrimary },
  statLabel: { fontSize: FontSize.xs, fontFamily: 'Jost_400Regular', color: Colors.textMuted, marginTop: 2 },
  statDivider: { width: 1, backgroundColor: 'rgba(180,150,140,0.2)' },

  calendarCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    marginHorizontal: Spacing.md,
    marginTop: Spacing.md,
  },
  calendarLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  calendarTitle: { fontSize: FontSize.md, fontFamily: 'Jost_600SemiBold', color: Colors.textPrimary },
  calendarSub: { fontSize: FontSize.xs, fontFamily: 'Jost_400Regular', color: Colors.textMuted, marginTop: 2 },

emptyCard: { alignItems: 'center', paddingVertical: Spacing.xl, marginHorizontal: Spacing.md, gap: Spacing.sm },
  emptyTitle: { fontSize: FontSize.lg, fontFamily: 'CormorantGaramond_600SemiBold', color: Colors.textPrimary },
  emptySub: { fontSize: FontSize.sm, fontFamily: 'Jost_400Regular', color: Colors.textMuted, textAlign: 'center', lineHeight: 20 },
  emptyBtn: {
    backgroundColor: Colors.cherry, borderRadius: 99,
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.sm, marginTop: Spacing.sm,
  },
  emptyBtnText: { fontSize: FontSize.md, fontFamily: 'Jost_600SemiBold', color: Colors.white },

  // PCOS card
  pcosCard: {
    backgroundColor: Colors.surface, borderRadius: 16,
    borderWidth: 1, borderColor: Colors.border,
    padding: Spacing.md, gap: Spacing.sm,
    marginHorizontal: Spacing.md, marginTop: Spacing.md,
  },
  pcosHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pcosTitleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  pcosTitle: { fontSize: FontSize.md, fontFamily: 'Jost_600SemiBold', color: Colors.textPrimary },
  pcosBarBg: { height: 8, backgroundColor: Colors.border, borderRadius: Radius.full, overflow: 'hidden' },
  pcosBarFill: { height: 8, borderRadius: Radius.full },
  pcosResultRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pcosTierLabel: { fontSize: FontSize.md, fontFamily: 'Jost_600SemiBold' },
  pcosTakenAt: { fontSize: FontSize.xs, fontFamily: 'Jost_400Regular', color: Colors.textMuted, marginTop: 2 },
  pcosPctBadge: { borderRadius: Radius.full, paddingHorizontal: 12, paddingVertical: 4, borderWidth: 1 },
  pcosPctText: { fontSize: FontSize.sm, fontFamily: 'Jost_600SemiBold' },
  pcosCta: { gap: Spacing.sm },
  pcosCtaText: { fontSize: FontSize.sm, fontFamily: 'Jost_400Regular', color: Colors.textSecondary, lineHeight: 20 },
  pcosCtaBtn: {
    alignSelf: 'flex-start', backgroundColor: Colors.goldLighter,
    borderRadius: 99, paddingHorizontal: Spacing.md, paddingVertical: 6,
    borderWidth: 1, borderColor: Colors.gold + '40',
  },
  pcosCtaBtnText: { fontSize: FontSize.xs, fontFamily: 'Jost_600SemiBold', color: Colors.goldDark },
});

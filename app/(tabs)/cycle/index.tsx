import React, { useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../../../stores/authStore';
import { useCycleStore } from '../../../stores/cycleStore';
import { usePCOSQuizStore } from '../../../stores/pcosQuizStore';
import { CycleRing } from '../../../components/calendar/CycleRing';
import { PhaseLegend } from '../../../components/calendar/PhaseLegend';
import { Icon } from '../../../components/ui/Icon';
import { Colors } from '../../../constants/colors';
import { FontSize, Spacing } from '../../../constants/theme';
import { formatDisplayDate } from '../../../algorithms/dateHelpers';
import { AuroraBackground } from '../../../components/layout/AuroraBackground';

export default function CycleScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const { cycleLogs, prediction, fetchCycleLogs, fetchPrediction } = useCycleStore();
  const quizResult = usePCOSQuizStore((s) => s.result);

  useEffect(() => {
    if (user) { fetchCycleLogs(user.id); fetchPrediction(user.id); }
  }, [user]);

  const avgCycleLength = cycleLogs.length >= 2
    ? Math.round(cycleLogs.slice(0, 6).reduce((s, _, i, arr) => {
        if (i === 0) return s;
        const diff = new Date(arr[i - 1].period_start).getTime() - new Date(arr[i].period_start).getTime();
        return s + diff / (1000 * 86400);
      }, 0) / Math.min(cycleLogs.length - 1, 5))
    : null;

  const bottomPad = 68 + 12 + insets.bottom + 16;

  return (
    <View style={styles.screen}>
      <AuroraBackground />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: bottomPad }}
        >

          {/* ── Header ── */}
          <View style={styles.header}>
            <View>
              <Text style={styles.smallcaps}>YOUR SHAPE</Text>
              <Text style={styles.title}>My Cycle</Text>
            </View>
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/cycle/log-period')}
              style={styles.logBtn}
            >
              <Icon name="plus" size={14} color={Colors.white} />
              <Text style={styles.logBtnText}>Log Period</Text>
            </TouchableOpacity>
          </View>

          {/* ── Cycle Ring ── */}
          <View style={styles.ringCard}>
            <CycleRing cycleLogs={cycleLogs} prediction={prediction} />
          </View>

          <View style={{ paddingHorizontal: Spacing.md }}>
            <PhaseLegend />
          </View>

          {/* ── Prediction card ── */}
          {prediction && (
            <View style={styles.card}>
              <Text style={styles.cardSmallcaps}>NEXT PERIOD PREDICTION</Text>
              <Text style={styles.bigDate}>
                {prediction.next_period_start ? formatDisplayDate(prediction.next_period_start) : '—'}
              </Text>
              <View style={styles.row}>
                <View style={[styles.badge, { backgroundColor: Colors.cherryLighter }]}>
                  <View style={[styles.badgeDot, { backgroundColor: Colors.cherry }]} />
                  <Text style={[styles.badgeText, { color: Colors.cherry }]}>
                    {Math.round(prediction.confidence_score ?? 0)}% confidence
                  </Text>
                </View>
                {prediction.method_used && (
                  <View style={[styles.badge, { backgroundColor: Colors.border }]}>
                    <Text style={[styles.badgeText, { color: Colors.textMuted }]}>
                      {prediction.method_used.replace(/_/g, ' ')}
                    </Text>
                  </View>
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
            </View>
          )}

          {/* ── Stats ── */}
          {avgCycleLength && (
            <View style={styles.statsCard}>
              <Text style={styles.cardSmallcaps}>CYCLE STATS</Text>
              <View style={styles.statsRow}>
                <View style={styles.stat}>
                  <Text style={styles.statValue}>{avgCycleLength}</Text>
                  <Text style={styles.statLabel}>Avg days</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.stat}>
                  <Text style={styles.statValue}>{cycleLogs.length}</Text>
                  <Text style={styles.statLabel}>Logged</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.stat}>
                  <Text style={[styles.statValue, { color: prediction?.predicted_cycle_length ? Colors.cherry : Colors.textMuted }]}>
                    {prediction?.predicted_cycle_length ?? '—'}
                  </Text>
                  <Text style={styles.statLabel}>Predicted</Text>
                </View>
              </View>
            </View>
          )}

          {/* ── Calendar link ── */}
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/cycle/calendar' as any)}
            activeOpacity={0.85}
            style={styles.calCard}
          >
            <View style={styles.calLeft}>
              <View style={styles.calIconWrap}>
                <Icon name="calendar" size={20} color={Colors.cherry} />
              </View>
              <View>
                <Text style={styles.calTitle}>Calendar</Text>
                <Text style={styles.calSub}>Full history & year-ahead predictions</Text>
              </View>
            </View>
            <Icon name="chevron-right" size={18} color={Colors.textMuted} />
          </TouchableOpacity>

          {/* ── No data CTA ── */}
          {cycleLogs.length === 0 && (
            <View style={styles.emptyCard}>
              <Icon name="droplets" size={44} color={Colors.textMuted} />
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
            </View>
          )}

          {/* ── PCOS Assessment ── */}
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/insights/pcos-assessment' as any)}
            activeOpacity={0.85}
            style={styles.pcosCard}
          >
            <View style={styles.pcosHeader}>
              <View style={styles.pcosTitleRow}>
                <View style={[styles.pcosIconWrap, { backgroundColor: Colors.goldLighter }]}>
                  <Icon name="stethoscope" size={16} color={Colors.gold} />
                </View>
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
                      {new Date(quizResult.takenAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
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
                  <Text style={styles.pcosCtaBtnText}>Start Quiz →</Text>
                </View>
              </View>
            )}
          </TouchableOpacity>

        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xs,
  },
  smallcaps: {
    fontSize: 10, fontFamily: 'Jost_600SemiBold',
    color: Colors.textMuted, letterSpacing: 1.5, marginBottom: 4,
  },
  title: {
    fontSize: 28,
    fontFamily: 'CormorantGaramond_600SemiBold',
    color: Colors.textPrimary,
  },
  logBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: Colors.cherry,
    borderRadius: 99,
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
  },
  logBtnText: {
    color: Colors.white,
    fontFamily: 'Jost_600SemiBold',
    fontSize: FontSize.sm,
  },

  ringCard: {
    marginHorizontal: Spacing.md,
    backgroundColor: 'rgba(255,255,255,0.72)',
    borderRadius: 32,
    borderWidth: 1,
    borderColor: 'rgba(51,50,68,0.08)',
    overflow: 'hidden',
    paddingVertical: Spacing.sm,
  },

  card: {
    backgroundColor: 'rgba(255,255,255,0.72)',
    borderRadius: 24,
    padding: Spacing.md,
    marginHorizontal: Spacing.md,
    marginTop: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(51,50,68,0.08)',
    gap: 8,
  },
  cardSmallcaps: { fontSize: 10, fontFamily: 'Jost_600SemiBold', color: Colors.textMuted, letterSpacing: 1.5 },
  bigDate: { fontSize: FontSize.xxl, fontFamily: 'CormorantGaramond_600SemiBold', color: Colors.cherry },
  row: { flexDirection: 'row', gap: Spacing.xs },
  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99,
  },
  badgeDot: { width: 6, height: 6, borderRadius: 3 },
  badgeText: { fontSize: FontSize.xs, fontFamily: 'Jost_500Medium' },
  fertileRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.xs,
  },
  fertileText: { fontSize: FontSize.sm, fontFamily: 'Jost_400Regular', color: Colors.forest },

  statsCard: {
    backgroundColor: 'rgba(255,255,255,0.72)',
    borderRadius: 24,
    padding: Spacing.md,
    marginHorizontal: Spacing.md,
    marginTop: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(51,50,68,0.08)',
  },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: Spacing.sm },
  stat: { alignItems: 'center' },
  statValue: { fontSize: FontSize.xxl, fontFamily: 'CormorantGaramond_600SemiBold', color: Colors.textPrimary },
  statLabel: { fontSize: FontSize.xs, fontFamily: 'Jost_400Regular', color: Colors.textMuted, marginTop: 2 },
  statDivider: { width: 1, backgroundColor: Colors.border },

  calCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.72)',
    borderRadius: 20,
    borderWidth: 1, borderColor: Colors.border,
    padding: Spacing.md,
    marginHorizontal: Spacing.md, marginTop: Spacing.md,
  },
  calLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  calIconWrap: {
    width: 40, height: 40, borderRadius: 14,
    backgroundColor: Colors.cherryLighter,
    alignItems: 'center', justifyContent: 'center',
  },
  calTitle: { fontSize: FontSize.md, fontFamily: 'Jost_600SemiBold', color: Colors.textPrimary },
  calSub: { fontSize: FontSize.xs, fontFamily: 'Jost_400Regular', color: Colors.textMuted, marginTop: 2 },

  emptyCard: {
    alignItems: 'center', paddingVertical: 40,
    marginHorizontal: Spacing.md, marginTop: Spacing.md, gap: Spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.60)',
    borderRadius: 24, borderWidth: 1, borderColor: Colors.border,
    padding: Spacing.md,
  },
  emptyTitle: { fontSize: FontSize.lg, fontFamily: 'CormorantGaramond_600SemiBold', color: Colors.textPrimary },
  emptySub: { fontSize: FontSize.sm, fontFamily: 'Jost_400Regular', color: Colors.textMuted, textAlign: 'center', lineHeight: 20 },
  emptyBtn: {
    backgroundColor: Colors.cherry, borderRadius: 99,
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.sm, marginTop: Spacing.sm,
  },
  emptyBtnText: { fontSize: FontSize.md, fontFamily: 'Jost_600SemiBold', color: Colors.white },

  pcosCard: {
    backgroundColor: 'rgba(255,255,255,0.72)',
    borderRadius: 24,
    borderWidth: 1, borderColor: Colors.border,
    padding: Spacing.md, gap: Spacing.sm,
    marginHorizontal: Spacing.md, marginTop: Spacing.md,
  },
  pcosHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pcosTitleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  pcosIconWrap: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  pcosTitle: { fontSize: FontSize.md, fontFamily: 'Jost_600SemiBold', color: Colors.textPrimary },
  pcosBarBg: { height: 6, backgroundColor: Colors.border, borderRadius: 99, overflow: 'hidden' },
  pcosBarFill: { height: 6, borderRadius: 99 },
  pcosResultRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pcosTierLabel: { fontSize: FontSize.md, fontFamily: 'Jost_600SemiBold' },
  pcosTakenAt: { fontSize: FontSize.xs, fontFamily: 'Jost_400Regular', color: Colors.textMuted, marginTop: 2 },
  pcosPctBadge: { borderRadius: 99, paddingHorizontal: 12, paddingVertical: 4, borderWidth: 1 },
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

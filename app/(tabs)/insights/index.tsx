import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../../stores/authStore';
import { useCycleStore } from '../../../stores/cycleStore';
import { supabase } from '../../../lib/supabase';
import { Card } from '../../../components/ui/Card';
import { PCOSRiskCard } from '../../../components/alerts/PCOSRiskCard';
import { Badge } from '../../../components/ui/Badge';
import type { PCOSAssessment } from '../../../types/database';
import { Colors } from '../../../constants/colors';
import { FontSize, FontWeight, Spacing } from '../../../constants/theme';
import { formatDisplayDate } from '../../../algorithms/dateHelpers';

export default function InsightsScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { prediction, cycleLogs, fetchPrediction, fetchCycleLogs } = useCycleStore();
  const [pcosAssessment, setPcosAssessment] = useState<PCOSAssessment | null>(null);

  useEffect(() => {
    if (!user) return;
    fetchPrediction(user.id);
    fetchCycleLogs(user.id);
    supabase.from('pcos_assessments').select('*').eq('user_id', user.id).eq('is_dismissed', false)
      .order('created_at', { ascending: false }).limit(1).maybeSingle()
      .then(({ data }) => setPcosAssessment(data as PCOSAssessment | null));
  }, [user]);

  const avgCycleLength = cycleLogs.length >= 2
    ? Math.round(cycleLogs.slice(0, 6).reduce((s, _, i, arr) => {
        if (i === 0) return s;
        const diff = new Date(arr[i-1].period_start).getTime() - new Date(arr[i].period_start).getTime();
        return s + diff / (1000 * 86400);
      }, 0) / Math.min(cycleLogs.length - 1, 5))
    : null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Health Insights</Text>

        {/* Next period */}
        {prediction && (
          <Card style={styles.predCard} elevated>
            <Text style={styles.sectionLabel}>Next Period Prediction</Text>
            <Text style={styles.bigDate}>
              {prediction.next_period_start ? formatDisplayDate(prediction.next_period_start) : '—'}
            </Text>
            <View style={styles.row}>
              <Badge label={`${Math.round(prediction.confidence_score ?? 0)}% confidence`} variant="cherry" />
              {prediction.method_used && <Badge label={prediction.method_used.replace(/_/g, ' ')} variant="neutral" />}
            </View>
          </Card>
        )}

        {/* Cycle stats */}
        {avgCycleLength && (
          <Card style={styles.statsCard}>
            <Text style={styles.sectionLabel}>Cycle Stats</Text>
            <View style={styles.statsRow}>
              <View style={styles.stat}>
                <Text style={styles.statValue}>{avgCycleLength}</Text>
                <Text style={styles.statLabel}>Avg Days</Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statValue}>{cycleLogs.length}</Text>
                <Text style={styles.statLabel}>Logged Cycles</Text>
              </View>
              <View style={styles.stat}>
                <Text style={[styles.statValue, { color: prediction?.predicted_cycle_length ? Colors.cherry : Colors.textMuted }]}>
                  {prediction?.predicted_cycle_length ?? '—'}
                </Text>
                <Text style={styles.statLabel}>Predicted Next</Text>
              </View>
            </View>
          </Card>
        )}

        {/* PCOS assessment */}
        {pcosAssessment && <PCOSRiskCard assessment={pcosAssessment} />}

        {/* Navigation cards */}
        <View style={styles.navRow}>
          {[
            { emoji: '📊', label: 'Health Trends', route: '/(tabs)/insights/health-trends' },
            { emoji: '🩺', label: 'PCOS Assessment', route: '/(tabs)/insights/pcos-assessment' },
          ].map((item) => (
            <TouchableOpacity key={item.label} onPress={() => router.push(item.route as any)} style={styles.navCard}>
              <Text style={styles.navEmoji}>{item.emoji}</Text>
              <Text style={styles.navLabel}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { padding: Spacing.md },
  title: { fontSize: FontSize.xxxl, fontWeight: FontWeight.bold, color: Colors.textPrimary, marginBottom: Spacing.lg },
  predCard: { marginBottom: Spacing.md, gap: Spacing.sm },
  sectionLabel: { fontSize: FontSize.sm, color: Colors.textMuted, fontWeight: FontWeight.medium },
  bigDate: { fontSize: FontSize.xxl, fontWeight: FontWeight.bold, color: Colors.cherry },
  row: { flexDirection: 'row', gap: Spacing.xs },
  statsCard: { marginBottom: Spacing.md },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: Spacing.sm },
  stat: { alignItems: 'center' },
  statValue: { fontSize: FontSize.xxl, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  statLabel: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2 },
  navRow: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm },
  navCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: Spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  navEmoji: { fontSize: 32, marginBottom: Spacing.sm },
  navLabel: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.textSecondary, textAlign: 'center' },
});

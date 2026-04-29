import React, { useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../../stores/authStore';
import { useCycleStore } from '../../../stores/cycleStore';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Icon } from '../../../components/ui/Icon';
import { FontSize, Spacing } from '../../../constants/theme';
import { formatDisplayDate } from '../../../algorithms/dateHelpers';
import { useColors, type AppColors } from '../../../contexts/ThemeContext';

export default function InsightsScreen() {
  const router = useRouter();
  const theme = useColors();
  const styles = createStyles(theme);
  const user = useAuthStore((s) => s.user);
  const { prediction, cycleLogs, fetchPrediction, fetchCycleLogs } = useCycleStore();

  useEffect(() => {
    if (!user) return;
    fetchPrediction(user.id);
    fetchCycleLogs(user.id);
  }, [user]);

  const avgCycleLength = cycleLogs.length >= 2
    ? Math.round(cycleLogs.slice(0, 6).reduce((s, _, i, arr) => {
        if (i === 0) return s;
        const diff = new Date(arr[i-1].period_start).getTime() - new Date(arr[i].period_start).getTime();
        return s + diff / (1000 * 86400);
      }, 0) / Math.min(cycleLogs.length - 1, 5))
    : null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Health Insights</Text>

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

        {avgCycleLength && (
          <Card>
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
                <Text style={[styles.statValue, { color: prediction?.predicted_cycle_length ? theme.cherry : theme.textMuted }]}>
                  {prediction?.predicted_cycle_length ?? '—'}
                </Text>
                <Text style={styles.statLabel}>Predicted Next</Text>
              </View>
            </View>
          </Card>
        )}

        <TouchableOpacity
          onPress={() => router.push('/(tabs)/insights/health-trends' as any)}
          style={styles.navCard}
          activeOpacity={0.8}
        >
          <Icon name="bar-chart" size={24} color={theme.cherry} />
          <Text style={styles.navLabel}>Health Trends</Text>
          <Icon name="chevron-right" size={16} color={theme.textMuted} />
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function createStyles(c: AppColors) {
  return StyleSheet.create({
    container: { padding: Spacing.md, gap: Spacing.md },
    title: { fontSize: FontSize.xxxl, fontFamily: 'CormorantGaramond_600SemiBold', color: c.textPrimary },
    predCard: { gap: Spacing.sm },
    sectionLabel: { fontSize: FontSize.sm, fontFamily: 'Jost_500Medium', color: c.textMuted },
    bigDate: { fontSize: FontSize.xxl, fontFamily: 'CormorantGaramond_600SemiBold', color: c.cherry },
    row: { flexDirection: 'row', gap: Spacing.xs },
    statsRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: Spacing.sm },
    stat: { alignItems: 'center' },
    statValue: { fontSize: FontSize.xxl, fontFamily: 'CormorantGaramond_600SemiBold', color: c.textPrimary },
    statLabel: { fontSize: FontSize.xs, fontFamily: 'Jost_400Regular', color: c.textMuted, marginTop: 2 },
    navCard: {
      backgroundColor: c.surface, borderRadius: 16,
      borderWidth: 1, borderColor: c.border,
      padding: Spacing.md, flexDirection: 'row',
      alignItems: 'center', gap: Spacing.sm,
    },
    navLabel: { flex: 1, fontSize: FontSize.sm, fontFamily: 'Jost_600SemiBold', color: c.textPrimary },
  });
}

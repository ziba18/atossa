import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LineChart } from 'react-native-chart-kit';
import { useAuthStore } from '../../../stores/authStore';
import { useContentWidth } from '../../../hooks/useContentWidth';
import { supabase } from '../../../lib/supabase';
import { Header } from '../../../components/layout/Header';
import { Card } from '../../../components/ui/Card';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import { EmptyState } from '../../../components/ui/EmptyState';
import { Icon } from '../../../components/ui/Icon';
import type { HealthMetric } from '../../../types/database';
import { FontSize, FontWeight, Spacing } from '../../../constants/theme';
import { useColors, type AppColors } from '../../../contexts/ThemeContext';
import { formatShortDate } from '../../../algorithms/dateHelpers';

export default function HealthTrendsScreen() {
  const theme = useColors();
  const styles = createStyles(theme);
  const user = useAuthStore((s) => s.user);
  const SCREEN_WIDTH = useContentWidth();
  const [weightData, setWeightData] = useState<HealthMetric[]>([]);
  const [bpData, setBpData] = useState<HealthMetric[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      supabase.from('health_metrics').select('*').eq('user_id', user.id).eq('metric_type', 'weight').order('recorded_at').limit(10),
      supabase.from('health_metrics').select('*').eq('user_id', user.id).eq('metric_type', 'blood_pressure_systolic').order('recorded_at').limit(10),
    ]).then(([w, b]) => {
      setWeightData((w.data ?? []) as HealthMetric[]);
      setBpData((b.data ?? []) as HealthMetric[]);
      setLoading(false);
    });
  }, [user]);

  if (loading) return <LoadingSpinner fullScreen />;

  const chartConfig = {
    backgroundGradientFrom: theme.surface,
    backgroundGradientTo: theme.surface,
    color: (opacity = 1) => `rgba(57, 5, 23, ${opacity})`,
    labelColor: () => theme.textSecondary,
    strokeWidth: 2,
    propsForDots: { r: '4', strokeWidth: '2', stroke: theme.cherry },
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      <Header title="Health Trends" showBack />
      <ScrollView contentContainerStyle={styles.container}>
        {weightData.length >= 2 ? (
          <Card style={styles.chartCard}>
            <View style={styles.chartHeader}>
              <Icon name="trending-up" size={18} color={theme.cherry} />
              <Text style={styles.chartTitle}>Weight Trend (kg)</Text>
            </View>
            <LineChart
              data={{
                labels: weightData.map((d) => formatShortDate(d.recorded_at.split('T')[0])),
                datasets: [{ data: weightData.map((d) => d.value) }],
              }}
              width={SCREEN_WIDTH - Spacing.md * 4}
              height={180}
              chartConfig={chartConfig}
              bezier
              style={styles.chart}
            />
          </Card>
        ) : (
          <EmptyState iconName="trending-up" title="No weight data yet" subtitle="Log your weight in the Track tab to see trends here." />
        )}

        {bpData.length >= 2 ? (
          <Card style={styles.chartCard}>
            <View style={styles.chartHeader}>
              <Icon name="heart-pulse" size={18} color={theme.cherry} />
              <Text style={styles.chartTitle}>Blood Pressure Trend (mmHg)</Text>
            </View>
            <LineChart
              data={{
                labels: bpData.map((d) => formatShortDate(d.recorded_at.split('T')[0])),
                datasets: [{ data: bpData.map((d) => d.value), color: () => theme.cherry }],
              }}
              width={SCREEN_WIDTH - Spacing.md * 4}
              height={180}
              chartConfig={chartConfig}
              bezier
              style={styles.chart}
            />
          </Card>
        ) : (
          <EmptyState iconName="heart-pulse" title="No BP data yet" subtitle="Log blood pressure in the Track tab to see trends here." />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function createStyles(c: AppColors) {
  return StyleSheet.create({
    container: { padding: Spacing.md },
    chartCard: { marginBottom: Spacing.md },
    chartHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: Spacing.sm },
    chartTitle: { fontSize: FontSize.md, fontFamily: 'Jost_600SemiBold', color: c.textPrimary },
    chart: { borderRadius: 12, marginLeft: -Spacing.md },
  });
}

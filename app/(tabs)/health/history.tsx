import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, FlatList, StyleSheet, RefreshControl } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../../../stores/authStore';
import { supabase } from '../../../lib/supabase';
import { Card } from '../../../components/ui/Card';
import { Header } from '../../../components/layout/Header';
import { Icon } from '../../../components/ui/Icon';
import { EmptyState } from '../../../components/ui/EmptyState';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import { useColors, type AppColors } from '../../../contexts/ThemeContext';
import { FontSize, Spacing, Radius } from '../../../constants/theme';
import { formatDisplayDate } from '../../../algorithms/dateHelpers';
import type { SymptomLog, HealthMetric } from '../../../types/database';

type DayEntry = {
  date: string;
  medications: HealthMetric[];
  symptoms: SymptomLog[];
};

function severityColor(c: AppColors, sev: number | null): string {
  if (!sev) return c.textMuted;
  if (sev >= 7) return c.roseDeep;
  if (sev >= 4) return c.gold ?? c.cherry;
  return c.emerald;
}

function prettifySymptom(s: string): string {
  return s.replace(/_/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase());
}

export default function HealthHistoryScreen() {
  const theme = useColors();
  const styles = createStyles(theme);
  const user = useAuthStore((s) => s.user);
  const insets = useSafeAreaInsets();
  const navSpacerHeight = 68 + 12 + insets.bottom;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [meds, setMeds] = useState<HealthMetric[]>([]);
  const [symptoms, setSymptoms] = useState<SymptomLog[]>([]);

  const load = async () => {
    if (!user) return;
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const [m, s] = await Promise.all([
      supabase.from('health_metrics')
        .select('*')
        .eq('user_id', user.id)
        .eq('metric_type', 'medication')
        .gte('recorded_at', since)
        .order('recorded_at', { ascending: false })
        .limit(200),
      supabase.from('symptom_logs')
        .select('*')
        .eq('user_id', user.id)
        .gte('logged_time', since)
        .order('logged_time', { ascending: false })
        .limit(400),
    ]);
    setMeds((m.data ?? []) as HealthMetric[]);
    setSymptoms((s.data ?? []) as SymptomLog[]);
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    if (user) load();
  }, [user?.id]);

  const days: DayEntry[] = useMemo(() => {
    const byDate = new Map<string, DayEntry>();
    for (const m of meds) {
      const d = m.recorded_at.split('T')[0];
      if (!byDate.has(d)) byDate.set(d, { date: d, medications: [], symptoms: [] });
      byDate.get(d)!.medications.push(m);
    }
    for (const s of symptoms) {
      const d = s.logged_date;
      if (!byDate.has(d)) byDate.set(d, { date: d, medications: [], symptoms: [] });
      byDate.get(d)!.symptoms.push(s);
    }
    return Array.from(byDate.values()).sort((a, b) => b.date.localeCompare(a.date));
  }, [meds, symptoms]);

  if (loading) return <LoadingSpinner fullScreen message="Loading your logs…" />;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }} edges={['top', 'left', 'right']}>
      <Header title="Logged Health" showBack />
      <FlatList
        data={days}
        keyExtractor={(item) => item.date}
        contentContainerStyle={[styles.list, { paddingBottom: navSpacerHeight + Spacing.md }]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); load(); }}
            tintColor={theme.cherry}
          />
        }
        ListEmptyComponent={
          <EmptyState
            iconName="heart"
            title="Nothing logged yet"
            subtitle="Save a health log entry and it will appear here."
          />
        }
        renderItem={({ item }) => (
          <Card style={styles.card}>
            <Text style={styles.date}>{formatDisplayDate(item.date)}</Text>

            {item.medications.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHead}>
                  <Icon name="pill" size={14} color={theme.cherry} />
                  <Text style={styles.sectionTitle}>Medications</Text>
                </View>
                {item.medications.map((m) => (
                  <View key={m.id} style={styles.row}>
                    <Text style={styles.rowText} numberOfLines={2}>
                      {m.notes ?? 'Medication'}
                    </Text>
                    {m.value > 0 && (
                      <Text style={styles.rowMeta}>{m.value} {m.unit}</Text>
                    )}
                  </View>
                ))}
              </View>
            )}

            {item.symptoms.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHead}>
                  <Icon name="activity" size={14} color={theme.emerald ?? theme.cherry} />
                  <Text style={styles.sectionTitle}>Symptoms &amp; pain</Text>
                </View>
                {item.symptoms.map((s) => (
                  <View key={s.id} style={styles.row}>
                    <View style={styles.rowMain}>
                      <Text style={styles.rowText} numberOfLines={2}>
                        {prettifySymptom(s.symptom_type)}
                      </Text>
                      {s.notes && <Text style={styles.rowSub} numberOfLines={2}>{s.notes}</Text>}
                    </View>
                    {s.severity != null && (
                      <View style={[styles.sevPill, { backgroundColor: severityColor(theme, s.severity) + '22', borderColor: severityColor(theme, s.severity) + '55' }]}>
                        <Text style={[styles.sevText, { color: severityColor(theme, s.severity) }]}>
                          {s.severity}/10
                        </Text>
                      </View>
                    )}
                  </View>
                ))}
              </View>
            )}
          </Card>
        )}
      />
    </SafeAreaView>
  );
}

function createStyles(c: AppColors) {
  return StyleSheet.create({
    list: { padding: Spacing.md, gap: Spacing.sm },
    card: { marginBottom: Spacing.sm, gap: Spacing.sm },
    date: {
      fontSize: FontSize.lg,
      fontFamily: 'Fraunces_500Medium',
      color: c.textPrimary,
      marginBottom: 2,
    },
    section: {
      borderTopWidth: 1,
      borderTopColor: c.border,
      paddingTop: Spacing.sm,
      gap: 4,
    },
    sectionHead: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
    sectionTitle: {
      fontSize: 11,
      fontFamily: 'Fraunces_500Medium',
      color: c.textMuted,
      letterSpacing: 1.2,
      textTransform: 'uppercase',
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: Spacing.sm,
      paddingVertical: 6,
    },
    rowMain: { flex: 1, gap: 2 },
    rowText: { fontSize: FontSize.sm, fontFamily: 'Fraunces_400Regular', color: c.textPrimary },
    rowSub: { fontSize: FontSize.xs, fontFamily: 'Fraunces_400Regular', color: c.textMuted },
    rowMeta: { fontSize: FontSize.xs, fontFamily: 'Fraunces_400Regular', color: c.textSecondary },
    sevPill: {
      paddingHorizontal: 10,
      paddingVertical: 3,
      borderRadius: Radius.full,
      borderWidth: 1,
    },
    sevText: { fontSize: 11, fontFamily: 'Fraunces_500Medium' },
  });
}

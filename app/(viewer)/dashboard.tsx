import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../stores/authStore';
import { supabase } from '../../lib/supabase';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { EmptyState } from '../../components/ui/EmptyState';
import type { ConnectedAccount, CycleLog, SymptomLog } from '../../types/database';
import { useColors, type AppColors } from '../../contexts/ThemeContext';
import { FontSize, Spacing } from '../../constants/theme';
import { formatDisplayDate } from '../../algorithms/dateHelpers';

export default function ViewerDashboard() {
  const theme = useColors();
  const styles = createStyles(theme);
  const user = useAuthStore((s) => s.user);
  const [connections, setConnections] = useState<ConnectedAccount[]>([]);
  const [selectedOwner, setSelectedOwner] = useState<string | null>(null);
  const [cycleLogs, setCycleLogs] = useState<CycleLog[]>([]);
  const [symptomLogs, setSymptomLogs] = useState<SymptomLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase.from('connected_accounts').select('*')
      .eq('viewer_user_id', user.id).eq('status', 'accepted')
      .then(({ data }) => {
        const conns = (data ?? []) as ConnectedAccount[];
        setConnections(conns);
        if (conns.length > 0) setSelectedOwner(conns[0].owner_user_id);
        setLoading(false);
      });
  }, [user]);

  useEffect(() => {
    if (!selectedOwner) return;
    Promise.all([
      supabase.from('cycle_logs').select('*').eq('user_id', selectedOwner).order('period_start', { ascending: false }).limit(5),
      supabase.from('symptom_logs').select('*').eq('user_id', selectedOwner).order('logged_date', { ascending: false }).limit(10),
    ]).then(([cl, sl]) => {
      setCycleLogs((cl.data ?? []) as CycleLog[]);
      setSymptomLogs((sl.data ?? []) as SymptomLog[]);
    });
  }, [selectedOwner]);

  if (loading) return <LoadingSpinner fullScreen />;

  if (connections.length === 0) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
        <EmptyState iconName="link" title="No connections" subtitle="You haven't been connected to anyone's Atossa account yet." />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Viewing Health Data</Text>
        <Text style={styles.subtitle}>You have been granted viewer access to the following accounts:</Text>

        {cycleLogs.length > 0 && (
          <View>
            <Text style={styles.sectionTitle}>Recent Periods</Text>
            {cycleLogs.slice(0, 3).map((log) => (
              <Card key={log.id} style={styles.logCard}>
                <Text style={styles.logDate}>{formatDisplayDate(log.period_start)}</Text>
                {log.flow_intensity && <Badge label={log.flow_intensity} variant="cherry" />}
              </Card>
            ))}
          </View>
        )}

        {symptomLogs.length > 0 && (
          <View>
            <Text style={styles.sectionTitle}>Recent Symptoms</Text>
            {symptomLogs.slice(0, 5).map((log) => (
              <Card key={log.id} style={styles.logCard}>
                <Text style={styles.logDate}>{log.logged_date}</Text>
                <Badge label={log.symptom_type.replace('_', ' ')} variant="whiskey" />
                {log.severity && <Text style={styles.severity}>Severity: {log.severity}/10</Text>}
              </Card>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function createStyles(c: AppColors) {
  return StyleSheet.create({
    container: { padding: Spacing.md },
    title: { fontSize: FontSize.xxl, color: c.textPrimary, marginBottom: Spacing.xs },
    subtitle: { fontSize: FontSize.md, color: c.textMuted, marginBottom: Spacing.xl },
    sectionTitle: { fontSize: FontSize.lg, color: c.textPrimary, marginTop: Spacing.lg, marginBottom: Spacing.sm },
    logCard: { marginBottom: Spacing.sm, flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
    logDate: { flex: 1, fontSize: FontSize.md, color: c.textPrimary },
    severity: { fontSize: FontSize.sm, color: c.textMuted },
  });
}

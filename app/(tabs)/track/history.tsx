import React, { useEffect } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../../stores/authStore';
import { useCycleStore } from '../../../stores/cycleStore';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { EmptyState } from '../../../components/ui/EmptyState';
import { Header } from '../../../components/layout/Header';
import { Colors } from '../../../constants/colors';
import { FontSize, FontWeight, Spacing } from '../../../constants/theme';
import { formatDisplayDate, formatShortDate } from '../../../algorithms/dateHelpers';

export default function HistoryScreen() {
  const user = useAuthStore((s) => s.user);
  const { cycleLogs, fetchCycleLogs } = useCycleStore();

  useEffect(() => { if (user) fetchCycleLogs(user.id); }, [user]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
      <Header title="Period History" showBack />
      <FlatList
        data={cycleLogs}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<EmptyState iconName="calendar" title="No logs yet" subtitle="Start logging your period to see history here." />}
        renderItem={({ item }) => (
          <Card style={styles.card}>
            <View style={styles.row}>
              <View>
                <Text style={styles.date}>{formatDisplayDate(item.period_start)}</Text>
                {item.period_end && (
                  <Text style={styles.sub}>to {formatShortDate(item.period_end)}</Text>
                )}
              </View>
              <View style={styles.badges}>
                {item.flow_intensity && (
                  <Badge label={item.flow_intensity.replace('_', ' ')} variant="cherry" />
                )}
                {item.period_length && (
                  <Badge label={`${item.period_length}d`} variant="neutral" />
                )}
                {item.cycle_length && (
                  <Badge label={`Cycle: ${item.cycle_length}d`} variant="emerald" />
                )}
              </View>
            </View>
            {item.notes && <Text style={styles.notes}>{item.notes}</Text>}
          </Card>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  list: { padding: Spacing.md },
  card: { marginBottom: Spacing.sm },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  date: { fontSize: FontSize.md, fontFamily: 'Jost_600SemiBold', color: Colors.textPrimary },
  sub: { fontSize: FontSize.sm, fontFamily: 'Jost_400Regular', color: Colors.textMuted, marginTop: 2 },
  badges: { flexDirection: 'row', gap: 4, flexWrap: 'wrap', maxWidth: '50%' },
  notes: { fontSize: FontSize.sm, fontFamily: 'Jost_400Regular', color: Colors.textMuted, marginTop: Spacing.sm, fontStyle: 'italic' },
});

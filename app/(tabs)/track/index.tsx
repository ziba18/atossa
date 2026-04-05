import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../../stores/authStore';
import { useCycleStore } from '../../../stores/cycleStore';
import { CycleCalendar } from '../../../components/calendar/CycleCalendar';
import { PhaseLegend } from '../../../components/calendar/PhaseLegend';
import { Colors } from '../../../constants/colors';
import { FontSize, FontWeight, Spacing } from '../../../constants/theme';

export default function TrackScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { cycleLogs, prediction, fetchCycleLogs, fetchPrediction } = useCycleStore();

  useEffect(() => {
    if (user) { fetchCycleLogs(user.id); fetchPrediction(user.id); }
  }, [user]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
      <View style={styles.header}>
        <Text style={styles.title}>My Cycle</Text>
        <TouchableOpacity onPress={() => router.push('/(tabs)/track/log-period' as any)} style={styles.logBtn}>
          <Text style={styles.logBtnText}>+ Log Period</Text>
        </TouchableOpacity>
      </View>

      <CycleCalendar cycleLogs={cycleLogs} prediction={prediction} />
      <PhaseLegend />

      <View style={styles.actions}>
        <TouchableOpacity onPress={() => router.push('/(tabs)/track/log-symptoms' as any)} style={styles.action}>
          <Text style={styles.actionEmoji}>😣</Text>
          <Text style={styles.actionLabel}>Log Symptoms</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push('/(tabs)/track/log-metrics' as any)} style={styles.action}>
          <Text style={styles.actionEmoji}>⚖️</Text>
          <Text style={styles.actionLabel}>Log Metrics</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push('/(tabs)/track/history' as any)} style={styles.action}>
          <Text style={styles.actionEmoji}>📜</Text>
          <Text style={styles.actionLabel}>History</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.md },
  title: { fontSize: FontSize.xxl, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  logBtn: { backgroundColor: Colors.cherry, borderRadius: 99, paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs + 2 },
  logBtnText: { color: Colors.white, fontWeight: FontWeight.semibold, fontSize: FontSize.sm },
  actions: { flexDirection: 'row', padding: Spacing.md, gap: Spacing.sm },
  action: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: Spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  actionEmoji: { fontSize: 26, marginBottom: 4 },
  actionLabel: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold, color: Colors.textSecondary, textAlign: 'center' },
});

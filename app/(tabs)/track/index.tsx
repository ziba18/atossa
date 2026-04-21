import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../../stores/authStore';
import { useCycleStore } from '../../../stores/cycleStore';
import { CycleCalendar } from '../../../components/calendar/CycleCalendar';
import { PhaseLegend } from '../../../components/calendar/PhaseLegend';
import { Icon, type IconName } from '../../../components/ui/Icon';
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
        {([
          { icon: 'activity', label: 'Log Symptoms', route: '/(tabs)/track/log-symptoms' },
          { icon: 'clipboard-list', label: 'Health Log', route: '/(tabs)/track/log-health' },
          { icon: 'trending-up', label: 'Log Metrics', route: '/(tabs)/track/log-metrics' },
          { icon: 'scroll-text', label: 'History', route: '/(tabs)/track/history' },
        ] as { icon: IconName; label: string; route: string }[]).map((item) => (
          <TouchableOpacity key={item.label} onPress={() => router.push(item.route as any)} style={styles.action}>
            <Icon name={item.icon} size={26} color={Colors.cherry} />
            <Text style={styles.actionLabel}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.md },
  title: { fontSize: FontSize.xxl, fontFamily: 'CormorantGaramond_600SemiBold', color: Colors.textPrimary },
  logBtn: { backgroundColor: Colors.cherry, borderRadius: 99, paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs + 2 },
  logBtnText: { color: Colors.white, fontFamily: 'Jost_600SemiBold', fontSize: FontSize.sm },
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
  actionLabel: { fontSize: FontSize.xs, fontFamily: 'Jost_600SemiBold', color: Colors.textSecondary, textAlign: 'center', marginTop: 4 },
});

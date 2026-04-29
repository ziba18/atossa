import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../../stores/authStore';
import { useCycleStore } from '../../../stores/cycleStore';
import { CycleRing } from '../../../components/calendar/CycleRing';
import { PhaseLegend } from '../../../components/calendar/PhaseLegend';
import { Icon, type IconName } from '../../../components/ui/Icon';
import { useColors, type AppColors } from '../../../contexts/ThemeContext';
import { FontSize, Spacing } from '../../../constants/theme';

export default function TrackScreen() {
  const router = useRouter();
  const theme = useColors();
  const styles = createStyles(theme);
  const user = useAuthStore((s) => s.user);
  const { cycleLogs, prediction, fetchCycleLogs, fetchPrediction } = useCycleStore();

  useEffect(() => {
    if (user) { fetchCycleLogs(user.id); fetchPrediction(user.id); }
  }, [user]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      <View style={styles.header}>
        <Text style={styles.title}>My Cycle</Text>
        <TouchableOpacity onPress={() => router.push('/(tabs)/track/log-period' as any)} style={styles.logBtn}>
          <Text style={styles.logBtnText}>+ Log Period</Text>
        </TouchableOpacity>
      </View>

      <CycleRing cycleLogs={cycleLogs} prediction={prediction} />
      <PhaseLegend />

      <View style={styles.actions}>
        {([
          { icon: 'clipboard-list', label: 'Health Log', route: '/(tabs)/track/log-health' },
          { icon: 'trending-up', label: 'Metrics', route: '/(tabs)/track/log-metrics' },
          { icon: 'scroll-text', label: 'History', route: '/(tabs)/track/history' },
        ] as { icon: IconName; label: string; route: string }[]).map((item) => (
          <TouchableOpacity key={item.label} onPress={() => router.push(item.route as any)} style={styles.action}>
            <Icon name={item.icon} size={26} color={theme.cherry} />
            <Text style={styles.actionLabel}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}

function createStyles(c: AppColors) {
  return StyleSheet.create({
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.md },
    title: { fontSize: FontSize.xxl, fontFamily: 'CormorantGaramond_600SemiBold', color: c.textPrimary },
    logBtn: { backgroundColor: c.cherry, borderRadius: 99, paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs + 2 },
    logBtnText: { color: '#FFFFFF', fontFamily: 'Jost_600SemiBold', fontSize: FontSize.sm },
    actions: { flexDirection: 'row', padding: Spacing.md, gap: Spacing.sm },
    action: { flex: 1, backgroundColor: c.surface, borderRadius: 14, padding: Spacing.md, alignItems: 'center', borderWidth: 1, borderColor: c.border },
    actionLabel: { fontSize: FontSize.xs, fontFamily: 'Jost_600SemiBold', color: c.textSecondary, textAlign: 'center', marginTop: 4 },
  });
}

import React, { useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../../stores/authStore';
import { useCycleStore } from '../../../stores/cycleStore';
import { useAlertStore } from '../../../stores/alertStore';
import { Card } from '../../../components/ui/Card';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import { Colors } from '../../../constants/colors';
import { FontSize, FontWeight, Spacing, Shadow } from '../../../constants/theme';
import { formatDisplayDate } from '../../../algorithms/dateHelpers';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const profile = useAuthStore((s) => s.profile);
  const { cycleLogs, prediction, fetchCycleLogs, fetchPrediction, isLoading } = useCycleStore();
  const { alerts, unreadCount, fetchAlerts } = useAlertStore();

  useEffect(() => {
    if (user) {
      fetchCycleLogs(user.id);
      fetchPrediction(user.id);
      fetchAlerts(user.id);
    }
  }, [user]);

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const lastPeriod = cycleLogs[0];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero header */}
        <LinearGradient
          colors={[Colors.cherry, Colors.cherryDark]}
          style={styles.hero}
        >
          <View style={styles.heroTop}>
            <View style={styles.heroLeft}>
              <Image source={require('../../../assets/icon.png')} style={styles.headerLogo} />
              <View>
                <Text style={styles.greeting}>{greeting()}, {profile?.display_name?.split(' ')[0] ?? 'there'} 🌸</Text>
                <Text style={styles.heroDate}>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={() => router.push('/(tabs)/home/notifications' as any)} style={styles.bellBtn}>
              <Text style={styles.bell}>🔔</Text>
              {unreadCount > 0 && <View style={styles.badge}><Text style={styles.badgeText}>{unreadCount}</Text></View>}
            </TouchableOpacity>
          </View>

          {/* Prediction card */}
          {prediction?.next_period_start && (
            <View style={styles.predictionCard}>
              <Text style={styles.predTitle}>Next Period</Text>
              <Text style={styles.predDate}>{formatDisplayDate(prediction.next_period_start)}</Text>
              <Text style={styles.predConf}>
                {Math.round(prediction.confidence_score ?? 0)}% confidence
              </Text>
            </View>
          )}
        </LinearGradient>

        <View style={styles.content}>
          {/* Quick actions */}
          <Text style={styles.sectionTitle}>Quick Log</Text>
          <View style={styles.quickRow}>
            {[
              { emoji: '🩸', label: 'Log Period', route: '/(tabs)/track/log-period' },
              { emoji: '😣', label: 'Symptoms', route: '/(tabs)/track/log-symptoms' },
              { emoji: '⚖️',  label: 'Metrics',  route: '/(tabs)/track/log-metrics' },
            ].map((item) => (
              <TouchableOpacity
                key={item.label}
                onPress={() => router.push(item.route as any)}
                style={styles.quickBtn}
                activeOpacity={0.8}
              >
                <Text style={styles.quickEmoji}>{item.emoji}</Text>
                <Text style={styles.quickLabel}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Fertile window */}
          {prediction?.fertile_window_start && (
            <Card style={styles.fertileCard}>
              <Text style={styles.fertileTitle}>🌿 Fertile Window</Text>
              <Text style={styles.fertileDate}>
                {formatDisplayDate(prediction.fertile_window_start)} – {formatDisplayDate(prediction.fertile_window_end!)}
              </Text>
              <Text style={styles.ovulationDate}>
                Ovulation: {prediction.next_ovulation ? formatDisplayDate(prediction.next_ovulation) : '—'}
              </Text>
            </Card>
          )}

          {/* Recent alerts */}
          {alerts.filter((a) => !a.is_read).length > 0 && (
            <View>
              <Text style={styles.sectionTitle}>Alerts</Text>
              {alerts.filter((a) => !a.is_read).slice(0, 3).map((alert) => (
                <Card key={alert.id} style={[styles.alertCard, alert.severity === 'emergency' ? styles.alertEmergency : undefined] as any}>
                  <Text style={styles.alertTitle}>{alert.title}</Text>
                  {alert.body && <Text style={styles.alertBody}>{alert.body}</Text>}
                </Card>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  hero: { padding: Spacing.xl, paddingTop: Spacing.lg },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  heroLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, flex: 1 },
  headerLogo: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  greeting: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.white },
  heroDate: { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  bellBtn: { position: 'relative', padding: Spacing.xs },
  bell: { fontSize: 24 },
  badge: {
    position: 'absolute',
    top: 0, right: 0,
    backgroundColor: Colors.whiskey,
    borderRadius: 99,
    width: 18, height: 18,
    alignItems: 'center', justifyContent: 'center',
  },
  badgeText: { fontSize: 10, color: Colors.white, fontWeight: FontWeight.bold },
  predictionCard: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 16,
    padding: Spacing.md,
    marginTop: Spacing.lg,
  },
  predTitle: { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.8)', marginBottom: 4 },
  predDate: { fontSize: FontSize.xxl, fontWeight: FontWeight.bold, color: Colors.white },
  predConf: { fontSize: FontSize.xs, color: 'rgba(255,255,255,0.7)', marginTop: 4 },
  content: { padding: Spacing.md },
  sectionTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary, marginTop: Spacing.lg, marginBottom: Spacing.sm },
  quickRow: { flexDirection: 'row', gap: Spacing.sm },
  quickBtn: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: Spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.sm,
  },
  quickEmoji: { fontSize: 28, marginBottom: Spacing.xs },
  quickLabel: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold, color: Colors.textSecondary, textAlign: 'center' },
  fertileCard: { marginTop: Spacing.md, backgroundColor: Colors.emeraldLighter, borderColor: Colors.emerald },
  fertileTitle: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.emeraldDark },
  fertileDate: { fontSize: FontSize.lg, fontWeight: FontWeight.semibold, color: Colors.emeraldDark, marginTop: 4 },
  ovulationDate: { fontSize: FontSize.sm, color: Colors.emeraldDark, marginTop: 4, opacity: 0.8 },
  alertCard: { marginBottom: Spacing.sm, borderColor: Colors.border },
  alertEmergency: { borderColor: Colors.cherry, backgroundColor: Colors.cherryLighter },
  alertTitle: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.textPrimary },
  alertBody: { fontSize: FontSize.sm, color: Colors.textMuted, marginTop: 4 },
});

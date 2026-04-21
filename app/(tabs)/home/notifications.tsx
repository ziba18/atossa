import React, { useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../../stores/authStore';
import { useAlertStore } from '../../../stores/alertStore';
import { Header } from '../../../components/layout/Header';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { EmptyState } from '../../../components/ui/EmptyState';
import { Icon, type IconName } from '../../../components/ui/Icon';
import { Colors } from '../../../constants/colors';
import { FontSize, FontWeight, Spacing, Radius } from '../../../constants/theme';
import type { AlertLog } from '../../../types/database';

// ─── Severity config ───────────────────────────────────────────────────────────
const SEVERITY_CONFIG: Record<string, { iconName: IconName; color: string; bg: string; label: string }> = {
  info: { iconName: 'info', color: Colors.info, bg: '#E8F1FB', label: 'Info' },
  warning: { iconName: 'triangle-alert', color: Colors.whiskey, bg: Colors.whiskeyLighter, label: 'Warning' },
  critical: { iconName: 'alert-circle', color: Colors.cherry, bg: Colors.cherryLighter, label: 'Critical' },
  emergency: { iconName: 'zap', color: Colors.cherryDark, bg: '#FFD6D6', label: 'Emergency' },
};

// ─── Demo alerts shown when there is no real data ─────────────────────────────
const DEMO_ALERTS: Omit<AlertLog, 'id' | 'user_id' | 'metadata' | 'sent_to_contacts'>[] = [
  {
    alert_type: 'late_period',
    severity: 'warning',
    title: 'Period may be late',
    body: 'Your predicted period was due 3 days ago. This could be normal variation — log your period when it starts, or check with your doctor if more than 7 days late.',
    is_read: false,
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    alert_type: 'heavy_bleeding',
    severity: 'critical',
    title: 'Heavy bleeding logged',
    body: 'You logged "very heavy" flow today. If you are soaking through a pad every hour for 2+ consecutive hours, seek medical attention.',
    is_read: true,
    created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    alert_type: 'pcos_risk',
    severity: 'warning',
    title: 'PCOS risk score increased',
    body: 'Your PCOS risk score has risen to 52 based on recent cycle logs and symptoms. Review your Insights page and consider discussing this with a healthcare provider.',
    is_read: true,
    created_at: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    alert_type: 'fertile_window',
    severity: 'info',
    title: 'Fertile window starts tomorrow',
    body: 'Based on your cycle history, your fertile window is predicted to begin tomorrow and last 6 days. Your estimated ovulation date is in 5 days.',
    is_read: true,
    created_at: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

function formatRelativeDate(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24));
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  if (diff < 7) return `${diff} days ago`;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function NotificationsScreen() {
  const user = useAuthStore((s) => s.user);
  const { alerts, fetchAlerts, markAllRead } = useAlertStore();

  useEffect(() => { if (user) fetchAlerts(user.id); }, [user]);

  const displayAlerts = alerts.length > 0 ? alerts : (DEMO_ALERTS as AlertLog[]);
  const isDemo = alerts.length === 0;
  const unreadCount = displayAlerts.filter((a) => !a.is_read).length;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
      <Header title="Alerts" showBack />

      {/* Mark all read */}
      {!isDemo && unreadCount > 0 && (
        <Button
          label="Mark all as read"
          onPress={() => user && markAllRead(user.id)}
          variant="ghost"
          style={styles.markAllBtn}
        />
      )}

      <FlatList
        data={displayAlerts}
        keyExtractor={(item, i) => item.id ?? String(i)}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View>
            {/* Demo notice */}
            {isDemo && (
              <View style={styles.demoNotice}>
                <Icon name="info" size={16} color="#1A4A8A" />
                <Text style={styles.demoText}>
                  These are example alerts. Real alerts will appear here as you track your cycle and symptoms.
                </Text>
              </View>
            )}

            {/* Severity summary grid */}
            <View style={styles.summaryGrid}>
              {Object.entries(SEVERITY_CONFIG).map(([severity, cfg]) => {
                const count = displayAlerts.filter((a) => a.severity === severity).length;
                return (
                  <View key={severity} style={styles.summaryCell}>
                    <Text style={styles.summaryCount}>{count}</Text>
                    <View style={[styles.summaryBadge, { backgroundColor: cfg.bg }]}>
                      <Text style={[styles.summaryLabel, { color: cfg.color }]}>{cfg.label}</Text>
                    </View>
                  </View>
                );
              })}
            </View>

            <Text style={styles.listTitle}>Recent alerts</Text>
          </View>
        }
        ListEmptyComponent={
          <EmptyState iconName="bell" title="No notifications" subtitle="You're all caught up!" />
        }
        renderItem={({ item }) => {
          const cfg = SEVERITY_CONFIG[item.severity] ?? SEVERITY_CONFIG.info;
          return (
            <View style={[styles.alertRow, !item.is_read && { backgroundColor: cfg.bg }]}>
              <View style={[styles.alertIconBox, { backgroundColor: cfg.bg }]}>
                <Icon name={cfg.iconName} size={18} color={cfg.color} />
              </View>
              <View style={styles.alertContent}>
                <View style={styles.alertTitleRow}>
                  <Text style={[styles.alertTitle, !item.is_read && styles.alertTitleUnread]}>
                    {item.title}
                  </Text>
                  {!item.is_read && <View style={styles.unreadDot} />}
                </View>
                {item.body && <Text style={styles.alertBody}>{item.body}</Text>}
                <Text style={styles.alertTime}>{formatRelativeDate(item.created_at)}</Text>
              </View>
              {item.is_read && <Icon name="check" size={16} color={Colors.border} />}
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  markAllBtn: { marginHorizontal: Spacing.md, marginTop: Spacing.sm },
  list: { padding: Spacing.md, paddingBottom: Spacing.xxl },

  demoNotice: {
    flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm,
    backgroundColor: '#E8F1FB', borderRadius: Radius.md,
    padding: Spacing.md, marginBottom: Spacing.md,
    borderWidth: 1, borderColor: '#BDD1F0',
  },
  demoText: { flex: 1, fontSize: FontSize.sm, color: '#1A4A8A', lineHeight: 20 },

  summaryGrid: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.lg },
  summaryCell: {
    flex: 1, backgroundColor: Colors.surface,
    borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border,
    padding: Spacing.sm, alignItems: 'center',
  },
  summaryCount: { fontSize: FontSize.xxl, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  summaryBadge: { borderRadius: Radius.sm, paddingHorizontal: 6, paddingVertical: 2, marginTop: 4 },
  summaryLabel: { fontSize: 10, fontWeight: FontWeight.semibold },

  listTitle: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.textPrimary, marginBottom: Spacing.sm },

  alertRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm,
    borderRadius: Radius.md, padding: Spacing.sm, marginBottom: Spacing.sm,
    borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.surface,
  },
  alertIconBox: {
    width: 36, height: 36, borderRadius: Radius.sm,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  alertContent: { flex: 1 },
  alertTitleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, marginBottom: 2 },
  alertTitle: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.textSecondary, flex: 1 },
  alertTitleUnread: { color: Colors.textPrimary },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.cherry, flexShrink: 0 },
  alertBody: { fontSize: FontSize.xs, color: Colors.textMuted, lineHeight: 18 },
  alertTime: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 4 },
});

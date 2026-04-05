import React, { useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../../stores/authStore';
import { useAlertStore } from '../../../stores/alertStore';
import { Header } from '../../../components/layout/Header';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { EmptyState } from '../../../components/ui/EmptyState';
import { Colors } from '../../../constants/colors';
import { FontSize, FontWeight, Spacing } from '../../../constants/theme';

const SEVERITY_COLORS: Record<string, string> = {
  info: Colors.emerald,
  warning: Colors.whiskey,
  critical: Colors.cherry,
  emergency: Colors.cherryDark,
};

export default function NotificationsScreen() {
  const user = useAuthStore((s) => s.user);
  const { alerts, fetchAlerts, markAllRead } = useAlertStore();

  useEffect(() => { if (user) fetchAlerts(user.id); }, [user]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
      <Header title="Notifications" showBack />
      {alerts.length > 0 && (
        <Button label="Mark all as read" onPress={() => user && markAllRead(user.id)} variant="ghost" style={styles.markAllBtn} />
      )}
      <FlatList
        data={alerts}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<EmptyState emoji="🔔" title="No notifications" subtitle="You're all caught up!" />}
        renderItem={({ item }) => (
          <Card style={[styles.card, !item.is_read ? styles.unread : undefined] as any}>
            <View style={[styles.dot, { backgroundColor: SEVERITY_COLORS[item.severity] ?? Colors.info }]} />
            <View style={styles.content}>
              <Text style={styles.title}>{item.title}</Text>
              {item.body && <Text style={styles.body}>{item.body}</Text>}
              <Text style={styles.time}>{new Date(item.created_at).toLocaleString()}</Text>
            </View>
          </Card>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  markAllBtn: { marginHorizontal: Spacing.md, marginTop: Spacing.sm },
  list: { padding: Spacing.md },
  card: { marginBottom: Spacing.sm, flexDirection: 'row', gap: Spacing.sm },
  unread: { backgroundColor: Colors.cherryLighter },
  dot: { width: 10, height: 10, borderRadius: 99, marginTop: 5 },
  content: { flex: 1 },
  title: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.textPrimary },
  body: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2, lineHeight: 20 },
  time: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 4 },
});

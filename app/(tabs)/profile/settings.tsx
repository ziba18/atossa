import React, { memo, useCallback } from 'react';
import { View, Text, Switch, Pressable, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../../stores/authStore';
import { useUIStore } from '../../../stores/uiStore';
import { api } from '../../../lib/api';
import { syncDailyLogReminder } from '../../../lib/notifications';
import { Header } from '../../../components/layout/Header';
import { Card } from '../../../components/ui/Card';
import { useColors, type AppColors } from '../../../contexts/ThemeContext';
import { Colors } from '../../../constants/colors';
import { FontSize, FontWeight, Spacing } from '../../../constants/theme';

const REMINDER_TIMES: { label: string; value: string }[] = [
  { label: 'Morning · 9:00 AM', value: '09:00' },
  { label: 'Afternoon · 2:00 PM', value: '14:00' },
  { label: 'Evening · 8:00 PM', value: '20:00' },
];

type SettingRowProps = {
  label: string;
  desc?: string;
  value: boolean;
  onChange: (v: boolean) => void;
  styles: ReturnType<typeof createStyles>;
};

const SettingRow = memo(function SettingRow({ label, desc, value, onChange, styles }: SettingRowProps) {
  return (
    <View style={styles.row}>
      <View style={styles.rowText}>
        <Text style={styles.rowLabel}>{label}</Text>
        {desc && <Text style={styles.rowDesc}>{desc}</Text>}
      </View>
      <Switch value={value} onValueChange={onChange} trackColor={{ true: Colors.cherry }} />
    </View>
  );
});

export default function SettingsScreen() {
  const user = useAuthStore((s) => s.user);
  const profile = useAuthStore((s) => s.profile);
  const setProfile = useAuthStore((s) => s.setProfile);
  const isDarkMode = useUIStore((s) => s.isDarkMode);
  const setDarkMode = useUIStore((s) => s.setDarkMode);
  const theme = useColors();
  const styles = createStyles(theme);

  const persistProfile = useCallback(
    (updates: Record<string, unknown>) => {
      const current = useAuthStore.getState().profile;
      if (current) setProfile({ ...current, ...updates } as typeof current);
      api.patch('/me', updates).catch(() => {});
    },
    [setProfile],
  );

  const handleDarkModeChange = useCallback(
    (v: boolean) => {
      setDarkMode(v);
      persistProfile({ dark_mode: v });
    },
    [setDarkMode, persistProfile],
  );

  const handleNotificationsChange = useCallback(
    (v: boolean) => {
      persistProfile({ notifications_enabled: v });
    },
    [persistProfile],
  );

  const reminderEnabled = profile?.daily_log_reminder_enabled ?? true;
  const reminderTime = profile?.daily_log_reminder_time ?? '20:00';

  const handleDailyReminderChange = useCallback(
    (v: boolean) => {
      persistProfile({ daily_log_reminder_enabled: v });
      syncDailyLogReminder(v, reminderTime).catch(() => {});
    },
    [persistProfile, reminderTime],
  );

  const handleDailyReminderTimeChange = useCallback(
    (time: string) => {
      persistProfile({ daily_log_reminder_time: time });
      if (reminderEnabled) syncDailyLogReminder(true, time).catch(() => {});
    },
    [persistProfile, reminderEnabled],
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      <Header title="Settings" showBack />
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.sectionTitle}>Appearance</Text>
        <Card noPadding>
          <SettingRow
            label="Dark Mode"
            desc="Switch to dark theme"
            value={isDarkMode}
            onChange={handleDarkModeChange}
            styles={styles}
          />
        </Card>

        <Text style={styles.sectionTitle}>Notifications</Text>
        <Card noPadding>
          <SettingRow
            label="All Notifications"
            desc="Enable or disable all Atossa notifications"
            value={profile?.notifications_enabled ?? true}
            onChange={handleNotificationsChange}
            styles={styles}
          />
          <SettingRow
            label="Daily Log Reminder"
            desc="A daily nudge to log how you're feeling"
            value={reminderEnabled}
            onChange={handleDailyReminderChange}
            styles={styles}
          />
          {reminderEnabled && (
            <View style={styles.timeRow}>
              {REMINDER_TIMES.map((t) => (
                <Pressable
                  key={t.value}
                  onPress={() => handleDailyReminderTimeChange(t.value)}
                  style={[styles.timeChip, reminderTime === t.value && styles.timeChipActive]}
                >
                  <Text style={[styles.timeChipText, reminderTime === t.value && styles.timeChipTextActive]}>
                    {t.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

function createStyles(c: AppColors) {
  const Colors = c;
  return StyleSheet.create({
    container: { padding: Spacing.md },
    sectionTitle: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.textMuted, marginBottom: Spacing.sm, marginTop: Spacing.lg, textTransform: 'uppercase', letterSpacing: 0.8 },
    row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border },
    rowText: { flex: 1, marginRight: Spacing.md },
    rowLabel: { fontSize: FontSize.md, fontWeight: FontWeight.medium, color: Colors.textPrimary },
    rowDesc: { fontSize: FontSize.sm, color: Colors.textMuted, marginTop: 2 },
    timeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, padding: Spacing.md },
    timeChip: {
      paddingVertical: Spacing.xs,
      paddingHorizontal: Spacing.sm,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: Colors.border,
    },
    timeChipActive: { backgroundColor: Colors.cherry, borderColor: Colors.cherry },
    timeChipText: { fontSize: FontSize.sm, color: Colors.textMuted },
    timeChipTextActive: { color: '#fff', fontWeight: FontWeight.medium },
  });
}

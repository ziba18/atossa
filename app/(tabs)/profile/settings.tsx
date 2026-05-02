import React, { memo, useCallback } from 'react';
import { View, Text, Switch, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../../stores/authStore';
import { useUIStore } from '../../../stores/uiStore';
import { supabase } from '../../../lib/supabase';
import { Header } from '../../../components/layout/Header';
import { Card } from '../../../components/ui/Card';
import { useColors, type AppColors } from '../../../contexts/ThemeContext';
import { Colors } from '../../../constants/colors';
import { FontSize, FontWeight, Spacing } from '../../../constants/theme';

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
      if (!user) return;
      const current = useAuthStore.getState().profile;
      if (current) setProfile({ ...current, ...updates } as typeof current);
      supabase.from('profiles').update(updates).eq('id', user.id).then(() => {});
    },
    [user, setProfile],
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
  });
}

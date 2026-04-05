import React from 'react';
import { View, Text, Switch, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../../stores/authStore';
import { useUIStore } from '../../../stores/uiStore';
import { supabase } from '../../../lib/supabase';
import { Header } from '../../../components/layout/Header';
import { Card } from '../../../components/ui/Card';
import { Colors } from '../../../constants/colors';
import { FontSize, FontWeight, Spacing } from '../../../constants/theme';

export default function SettingsScreen() {
  const user = useAuthStore((s) => s.user);
  const profile = useAuthStore((s) => s.profile);
  const fetchProfile = useAuthStore((s) => s.fetchProfile);
  const setDarkMode = useUIStore((s) => s.setDarkMode);

  const updateProfile = async (updates: Record<string, unknown>) => {
    if (!user) return;
    await supabase.from('profiles').update(updates).eq('id', user.id);
    await fetchProfile();
  };

  const SettingRow = ({ label, desc, value, onChange }: { label: string; desc?: string; value: boolean; onChange: (v: boolean) => void }) => (
    <View style={styles.row}>
      <View style={styles.rowText}>
        <Text style={styles.rowLabel}>{label}</Text>
        {desc && <Text style={styles.rowDesc}>{desc}</Text>}
      </View>
      <Switch value={value} onValueChange={onChange} trackColor={{ true: Colors.cherry }} />
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
      <Header title="Settings" showBack />
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.sectionTitle}>Appearance</Text>
        <Card noPadding>
          <SettingRow
            label="Dark Mode"
            desc="Switch to dark theme"
            value={profile?.dark_mode ?? false}
            onChange={(v) => { setDarkMode(v); updateProfile({ dark_mode: v }); }}
          />
        </Card>

        <Text style={styles.sectionTitle}>Notifications</Text>
        <Card noPadding>
          <SettingRow
            label="All Notifications"
            desc="Enable or disable all Atossa notifications"
            value={profile?.notifications_enabled ?? true}
            onChange={(v) => updateProfile({ notifications_enabled: v })}
          />
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { padding: Spacing.md },
  sectionTitle: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.textMuted, marginBottom: Spacing.sm, marginTop: Spacing.lg, textTransform: 'uppercase', letterSpacing: 0.8 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border },
  rowText: { flex: 1, marginRight: Spacing.md },
  rowLabel: { fontSize: FontSize.md, fontWeight: FontWeight.medium, color: Colors.textPrimary },
  rowDesc: { fontSize: FontSize.sm, color: Colors.textMuted, marginTop: 2 },
});

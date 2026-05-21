import React, { useState } from 'react';
import { View, Text, StyleSheet, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../../stores/authStore';
import { supabase } from '../../../lib/supabase';
import { registerForPushNotifications } from '../../../lib/notifications';
import { Button } from '../../../components/ui/Button';
import { SafeScreen } from '../../../components/layout/SafeScreen';
import { useColors, type AppColors } from '../../../contexts/ThemeContext';
import { Colors } from '../../../constants/colors';
import { FontSize, FontWeight, Spacing } from '../../../constants/theme';

export default function Step4Notifications() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [periodReminders, setPeriodReminders] = useState(true);
  const [ovulationReminders, setOvulationReminders] = useState(true);
  const [healthAlerts, setHealthAlerts] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleNext = async () => {
    if (!user) return;
    setLoading(true);
    const enabled = periodReminders || ovulationReminders || healthAlerts;
    if (enabled) {
      try { await registerForPushNotifications(); } catch { /* not critical */ }
    }
    await supabase.from('profiles').update({ notifications_enabled: enabled }).eq('id', user.id);
    setLoading(false);
    router.push('/(auth)/onboarding/step5-connected');
  };

  const NotifRow = ({ label, desc, value, onChange }: { label: string; desc: string; value: boolean; onChange: (v: boolean) => void }) => (
    <View style={styles.row}>
      <View style={styles.rowText}>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text style={styles.rowDesc}>{desc}</Text>
      </View>
      <Switch value={value} onValueChange={onChange} trackColor={{ true: Colors.cherry }} />
    </View>
  );

  const theme = useColors();
  const styles = createStyles(theme);

  return (
    <SafeScreen>
      <View style={styles.progress}>
        <Text style={styles.step}>Step 4 of 5</Text>
        <View style={styles.progressBar}><View style={[styles.fill, { width: '80%' }]} /></View>
      </View>
      <Text style={styles.title}>Stay Informed</Text>
      <Text style={styles.subtitle}>Choose which notifications you'd like to receive.</Text>

      <NotifRow label="Period Reminders" desc="Get notified 2 days before your predicted period" value={periodReminders} onChange={setPeriodReminders} />
      <NotifRow label="Ovulation Alerts" desc="Know when your fertile window is approaching" value={ovulationReminders} onChange={setOvulationReminders} />
      <NotifRow label="Health Alerts" desc="Warnings for unusual cycle patterns or symptoms" value={healthAlerts} onChange={setHealthAlerts} />

      <Button label="Next →" onPress={handleNext} loading={loading} size="lg" fullWidth style={styles.btn} />
    </SafeScreen>
  );
}

function createStyles(c: AppColors) {
  return StyleSheet.create({
    progress: { marginBottom: Spacing.xl },
    step: { fontSize: FontSize.sm, fontFamily: 'CormorantGaramond_400Regular', color: c.textMuted, marginBottom: Spacing.xs },
    progressBar: { height: 4, backgroundColor: c.border, borderRadius: 2 },
    fill: { height: 4, backgroundColor: Colors.cherry, borderRadius: 2 },
    title: { fontSize: 28, fontFamily: 'CormorantGaramond_500Medium_Italic', color: c.textPrimary, marginBottom: Spacing.sm },
    subtitle: { fontSize: FontSize.md, fontFamily: 'CormorantGaramond_400Regular', color: c.textMuted, marginBottom: Spacing.xl, lineHeight: 22 },
    row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: c.border },
    rowText: { flex: 1, marginRight: Spacing.md },
    rowLabel: { fontSize: FontSize.md, fontFamily: 'CormorantGaramond_600SemiBold', color: c.textPrimary },
    rowDesc: { fontSize: FontSize.sm, fontFamily: 'CormorantGaramond_400Regular', color: c.textMuted, marginTop: 2 },
    btn: { marginTop: Spacing.xxl },
  });
}

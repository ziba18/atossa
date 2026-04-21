import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../../stores/authStore';
import { supabase } from '../../../lib/supabase';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Header } from '../../../components/layout/Header';
import { Icon, type IconName } from '../../../components/ui/Icon';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../../constants/colors';
import { FontSize, FontWeight, Spacing } from '../../../constants/theme';

const METRIC_OPTIONS: { type: string; label: string; unit: string; icon: IconName; placeholder: string }[] = [
  { type: 'weight', label: 'Weight', unit: 'kg', icon: 'trending-up', placeholder: '60.5' },
  { type: 'blood_pressure_systolic', label: 'BP Systolic', unit: 'mmHg', icon: 'heart-pulse', placeholder: '120' },
  { type: 'blood_pressure_diastolic', label: 'BP Diastolic', unit: 'mmHg', icon: 'activity', placeholder: '80' },
  { type: 'heart_rate', label: 'Heart Rate', unit: 'bpm', icon: 'heart-pulse', placeholder: '72' },
  { type: 'testosterone', label: 'Testosterone', unit: 'ng/dL', icon: 'dna', placeholder: '25' },
  { type: 'lh', label: 'LH', unit: 'mIU/mL', icon: 'eye', placeholder: '5' },
  { type: 'fsh', label: 'FSH', unit: 'mIU/mL', icon: 'eye', placeholder: '7' },
  { type: 'blood_glucose', label: 'Blood Glucose', unit: 'mg/dL', icon: 'droplet', placeholder: '85' },
];

export default function LogMetricsScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!user) return;
    const rows = METRIC_OPTIONS
      .filter((m) => values[m.type]?.trim())
      .map((m) => ({
        user_id: user.id,
        metric_type: m.type,
        value: parseFloat(values[m.type]),
        unit: m.unit,
        source: 'manual',
      }));
    if (rows.length === 0) { Alert.alert('Enter at least one metric.'); return; }
    setLoading(true);
    const { error } = await supabase.from('health_metrics').insert(rows);
    setLoading(false);
    if (error) { Alert.alert('Error', error.message); return; }
    Alert.alert('Saved!', `${rows.length} metric(s) recorded.`, [{ text: 'OK', onPress: () => router.back() }]);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
      <Header title="Log Health Metrics" showBack />
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.subtitle}>Enter any metrics you've measured. Leave blank to skip.</Text>
        {METRIC_OPTIONS.map((m) => (
          <View key={m.type} style={styles.metricRow}>
            <View style={styles.metricIcon}>
              <Icon name={m.icon} size={24} color={Colors.cherry} />
            </View>
            <View style={styles.metricInput}>
              <Input
                label={`${m.label} (${m.unit})`}
                value={values[m.type] ?? ''}
                onChangeText={(v) => setValues((prev) => ({ ...prev, [m.type]: v }))}
                keyboardType="decimal-pad"
                placeholder={m.placeholder}
              />
            </View>
          </View>
        ))}
        <Button label="Save Metrics" onPress={handleSave} loading={loading} size="lg" fullWidth style={styles.btn} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { padding: Spacing.md },
  subtitle: { fontSize: FontSize.md, fontFamily: 'Jost_400Regular', color: Colors.textMuted, marginBottom: Spacing.xl, lineHeight: 22 },
  metricRow: { flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.sm },
  metricIcon: { marginBottom: Spacing.md + 4 },
  metricInput: { flex: 1 },
  btn: { marginTop: Spacing.md },
});

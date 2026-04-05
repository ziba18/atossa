import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../../stores/authStore';
import { useCycleStore } from '../../../stores/cycleStore';
import { SymptomChip } from '../../../components/tracking/SymptomChip';
import { PainSlider } from '../../../components/tracking/PainSlider';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Header } from '../../../components/layout/Header';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SYMPTOM_META, type SymptomType } from '../../../constants/symptomTypes';
import { Colors } from '../../../constants/colors';
import { FontSize, FontWeight, Spacing } from '../../../constants/theme';
import { today } from '../../../algorithms/dateHelpers';

const SYMPTOM_TYPES = Object.keys(SYMPTOM_META) as SymptomType[];

export default function LogSymptomsScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { addSymptomLog } = useCycleStore();
  const [selected, setSelected] = useState<SymptomType | null>(null);
  const [severity, setSeverity] = useState(5);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const toggle = (type: SymptomType) => setSelected(selected === type ? null : type);

  const handleSave = async () => {
    if (!selected || !user) { Alert.alert('Please select a symptom.'); return; }
    setLoading(true);
    await addSymptomLog({
      user_id: user.id,
      symptom_type: selected,
      severity,
      logged_date: today(),
      notes: notes || undefined,
    });
    setLoading(false);
    Alert.alert('Logged!', `${SYMPTOM_META[selected].label} recorded.`, [
      { text: 'Log Another', onPress: () => { setSelected(null); setSeverity(5); setNotes(''); } },
      { text: 'Done', onPress: () => router.back() },
    ]);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
      <Header title="Log Symptoms" showBack />
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.subtitle}>Select the symptom you're experiencing today</Text>
        <View style={styles.chips}>
          {SYMPTOM_TYPES.filter((t) => t !== 'custom').map((type) => (
            <SymptomChip key={type} type={type} selected={selected === type} onPress={() => toggle(type)} />
          ))}
        </View>

        {selected && (
          <View style={styles.detail}>
            <PainSlider value={severity} onChange={setSeverity} label={`${SYMPTOM_META[selected].label} Severity`} />
            <Input label="Notes (optional)" value={notes} onChangeText={setNotes} placeholder="Add any details..." multiline numberOfLines={3} />
          </View>
        )}

        <Button label="Save Symptom" onPress={handleSave} loading={loading} size="lg" fullWidth style={styles.btn} disabled={!selected} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { padding: Spacing.md },
  subtitle: { fontSize: FontSize.md, color: Colors.textMuted, marginBottom: Spacing.md, lineHeight: 22 },
  chips: { flexDirection: 'row', flexWrap: 'wrap' },
  detail: { marginTop: Spacing.xl },
  btn: { marginTop: Spacing.xl },
});

import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../../stores/authStore';
import { supabase } from '../../../lib/supabase';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { SafeScreen } from '../../../components/layout/SafeScreen';
import { Colors } from '../../../constants/colors';
import { FontSize, FontWeight, Spacing } from '../../../constants/theme';

export default function Step5Connected() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { fetchProfile } = useAuthStore();
  const [email, setEmail] = useState('');
  const [relationship, setRelationship] = useState<'partner' | 'parent'>('partner');
  const [loading, setLoading] = useState(false);

  const handleFinish = async () => {
    if (!user) return;
    setLoading(true);

    if (email.trim()) {
      await supabase.from('connected_accounts').insert({
        owner_user_id: user.id,
        invite_email: email.trim().toLowerCase(),
        relationship,
        status: 'pending',
      });
    }

    await supabase.from('profiles').update({ onboarding_complete: true }).eq('id', user.id);
    await fetchProfile();
    setLoading(false);
    router.replace('/(tabs)/home');
  };

  return (
    <SafeScreen>
      <View style={styles.progress}>
        <Text style={styles.step}>Step 5 of 5</Text>
        <View style={styles.progressBar}><View style={[styles.fill, { width: '100%' }]} /></View>
      </View>

      <Text style={styles.title}>Connect a Loved One</Text>
      <Text style={styles.subtitle}>
        Optionally invite a partner or parent to keep an eye on your health. They can receive emergency alerts and view your data (with your permission).
      </Text>

      <View style={styles.relationshipRow}>
        {(['partner', 'parent'] as const).map((rel) => (
          <Button
            key={rel}
            label={rel.charAt(0).toUpperCase() + rel.slice(1)}
            onPress={() => setRelationship(rel)}
            variant={relationship === rel ? 'primary' : 'outline'}
            style={styles.relBtn}
          />
        ))}
      </View>

      <Input
        label="Their email address (optional)"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        placeholder="partner@example.com"
        hint="They'll receive an invitation to join Atossa."
      />

      <Button label="Finish Setup" onPress={handleFinish} loading={loading} size="lg" fullWidth style={styles.btn} />
      <Button label="Skip for now" onPress={() => { setEmail(''); handleFinish(); }} variant="ghost" size="md" fullWidth />
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  progress: { marginBottom: Spacing.xl },
  step: { fontSize: FontSize.sm, fontFamily: 'Jost_400Regular', color: Colors.textMuted, marginBottom: Spacing.xs },
  progressBar: { height: 4, backgroundColor: Colors.border, borderRadius: 2 },
  fill: { height: 4, backgroundColor: Colors.cherry, borderRadius: 2 },
  title: { fontSize: 28, fontFamily: 'CormorantGaramond_600SemiBold', color: Colors.textPrimary, marginBottom: Spacing.sm },
  subtitle: { fontSize: FontSize.md, fontFamily: 'Jost_400Regular', color: Colors.textMuted, marginBottom: Spacing.xl, lineHeight: 22 },
  relationshipRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.xl },
  relBtn: { flex: 1 },
  btn: { marginTop: Spacing.md, marginBottom: Spacing.sm },
});

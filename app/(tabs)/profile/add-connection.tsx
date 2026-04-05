import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../../stores/authStore';
import { supabase } from '../../../lib/supabase';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Header } from '../../../components/layout/Header';
import { Colors } from '../../../constants/colors';
import { FontSize, FontWeight, Spacing } from '../../../constants/theme';

const RELATIONSHIPS = ['partner', 'parent', 'guardian', 'friend', 'doctor'] as const;

export default function AddConnectionScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [email, setEmail] = useState('');
  const [relationship, setRelationship] = useState<typeof RELATIONSHIPS[number]>('partner');
  const [loading, setLoading] = useState(false);

  const handleInvite = async () => {
    if (!user || !email.trim()) { Alert.alert('Please enter an email address.'); return; }
    setLoading(true);
    const { error } = await supabase.from('connected_accounts').insert({
      owner_user_id: user.id,
      invite_email: email.trim().toLowerCase(),
      relationship,
      status: 'pending',
    });
    setLoading(false);
    if (error) { Alert.alert('Error', error.message); return; }
    Alert.alert('Invitation Sent!', `An invite has been sent to ${email}. They'll be notified when they join Atossa.`, [
      { text: 'OK', onPress: () => router.back() },
    ]);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
      <Header title="Invite Someone" showBack />
      <View style={styles.container}>
        <Text style={styles.subtitle}>
          Invite a partner, parent, or trusted person to view your health data and receive emergency alerts.
        </Text>
        <Input label="Their email address" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" placeholder="person@example.com" />
        <Text style={styles.label}>Their relationship to you</Text>
        <View style={styles.options}>
          {RELATIONSHIPS.map((rel) => (
            <Button
              key={rel}
              label={rel.charAt(0).toUpperCase() + rel.slice(1)}
              onPress={() => setRelationship(rel)}
              variant={relationship === rel ? 'primary' : 'outline'}
              size="sm"
              style={styles.relBtn}
            />
          ))}
        </View>
        <Button label="Send Invite" onPress={handleInvite} loading={loading} size="lg" fullWidth style={styles.btn} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { padding: Spacing.md },
  subtitle: { fontSize: FontSize.md, color: Colors.textMuted, lineHeight: 22, marginBottom: Spacing.xl },
  label: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.textPrimary, marginBottom: Spacing.sm },
  options: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.xl },
  relBtn: {},
  btn: { marginTop: Spacing.md },
});

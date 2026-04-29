import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../../stores/authStore';
import { supabase } from '../../../lib/supabase';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Header } from '../../../components/layout/Header';
import { EmptyState } from '../../../components/ui/EmptyState';
import type { ConnectedAccount } from '../../../types/database';
import { Colors } from '../../../constants/colors';
import { useColors, type AppColors } from '../../../contexts/ThemeContext';
import { FontSize, Spacing } from '../../../constants/theme';

export default function ConnectedAccountsScreen() {
  const router = useRouter();
  const theme = useColors();
  const styles = createStyles(theme);
  const user = useAuthStore((s) => s.user);
  const [connections, setConnections] = useState<ConnectedAccount[]>([]);

  useEffect(() => {
    if (!user) return;
    supabase.from('connected_accounts').select('*').eq('owner_user_id', user.id).order('created_at', { ascending: false })
      .then(({ data }) => setConnections((data ?? []) as ConnectedAccount[]));
  }, [user]);

  const handleRevoke = (id: string) => {
    Alert.alert('Revoke Access', 'This person will no longer be able to view your data.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Revoke', style: 'destructive', onPress: async () => {
        await supabase.from('connected_accounts').update({ status: 'revoked' }).eq('id', id);
        setConnections((prev) => prev.filter((c) => c.id !== id));
      }},
    ]);
  };

  const statusVariant = (status: string): 'emerald' | 'whiskey' | 'neutral' | 'cherry' => {
    if (status === 'accepted') return 'emerald';
    if (status === 'pending') return 'whiskey';
    return 'neutral';
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      <Header title="Connected Accounts" showBack />
      <FlatList
        data={connections}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<EmptyState iconName="link" title="No connections yet" subtitle="Invite a partner or parent to keep an eye on your health." />}
        ListHeaderComponent={
          <Button label="+ Invite Someone" onPress={() => router.push('/(tabs)/profile/add-connection' as any)} variant="outline" fullWidth style={styles.addBtn} />
        }
        renderItem={({ item }) => (
          <Card style={styles.card}>
            <View style={styles.row}>
              <View style={styles.info}>
                <View style={styles.nameRow}>
                  <Text style={styles.name}>{item.invite_email ?? 'Connected User'}</Text>
                  <Badge label={item.status} variant={statusVariant(item.status)} />
                </View>
                <Text style={styles.rel}>{item.relationship}</Text>
              </View>
              {item.status !== 'revoked' && (
                <TouchableOpacity onPress={() => handleRevoke(item.id)} style={styles.revokeBtn}>
                  <Text style={styles.revokeText}>Revoke</Text>
                </TouchableOpacity>
              )}
            </View>
          </Card>
        )}
      />
    </SafeAreaView>
  );
}

function createStyles(c: AppColors) {
  return StyleSheet.create({
    list: { padding: Spacing.md },
    addBtn: { marginBottom: Spacing.md },
    card: { marginBottom: Spacing.sm },
    row: { flexDirection: 'row', alignItems: 'center' },
    info: { flex: 1 },
    nameRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
    name: { fontSize: FontSize.md, color: c.textPrimary },
    rel: { fontSize: FontSize.sm, color: c.textMuted, marginTop: 2 },
    revokeBtn: { padding: Spacing.sm },
    revokeText: { fontSize: FontSize.sm, color: Colors.error },
  });
}

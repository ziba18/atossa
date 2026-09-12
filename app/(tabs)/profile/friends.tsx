import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, Pressable, ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Header } from '../../../components/layout/Header';
import { Icon } from '../../../components/ui/Icon';
import { useColors, type AppColors } from '../../../contexts/ThemeContext';
import { FontSize, Spacing, Radius } from '../../../constants/theme';
import { useAuthStore } from '../../../stores/authStore';
import { api } from '../../../lib/api';
import { computeCycleMath } from '../../../algorithms/cyclePhase';
import { PHASE_LABEL } from '../../../algorithms/cyclePhase';
import type { CyclePhaseLog } from '../../../algorithms/cyclePhaseLog';
import type { CycleLog } from '../../../types/database';

interface PendingInvite {
  id: string;
  status: string;
  invite_email: string | null;
  other_display_name: string | null;
}

interface FriendSummary {
  connection_id: string;
  friend_id: string;
  display_name: string | null;
  average_cycle_length: number;
  average_period_length: number;
  cycle_logs: CyclePhaseLog[];
}

export default function FriendsScreen() {
  const theme = useColors();
  const styles = createStyles(theme);
  const user = useAuthStore((s) => s.user);
  const profile = useAuthStore((s) => s.profile);

  const [pending, setPending] = useState<PendingInvite[]>([]);
  const [friends, setFriends] = useState<FriendSummary[]>([]);
  const [myPhase, setMyPhase] = useState<{ phase: string; cycleDay: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    const [pendingRes, friendsRes, myLogs] = await Promise.all([
      api.get<PendingInvite[]>('/connections/pending'),
      api.get<FriendSummary[]>('/connections/friends'),
      api.get<CycleLog[]>('/cycles?limit=12'),
    ]);
    setPending(pendingRes);
    setFriends(friendsRes);

    const mine = computeCycleMath({
      cycleLogs: myLogs,
      defaultCycleLength: profile?.average_cycle_length,
      defaultPeriodLength: profile?.average_period_length,
      userId: user.id,
    });
    setMyPhase(mine.hasData ? { phase: mine.phase, cycleDay: mine.cycleDay } : null);
    setLoading(false);
  }, [user, profile]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const sendInvite = async () => {
    const email = inviteEmail.trim().toLowerCase();
    if (!email || !email.includes('@')) {
      Alert.alert('Enter a valid email', 'Ask your friend for the email they use on Atossa.');
      return;
    }
    setInviting(true);
    try {
      await api.post('/connections/invite', { invite_email: email });
      setInviteEmail('');
      Alert.alert('Invite sent', `${email} will see your invite next time they open Atossa.`);
    } catch {
      Alert.alert("Couldn't send invite", 'Please try again.');
    } finally {
      setInviting(false);
    }
  };

  const respond = async (id: string, accept: boolean) => {
    await api.post(`/connections/${id}/${accept ? 'accept' : 'decline'}`);
    load();
  };

  const removeFriend = (connectionId: string, name: string | null) => {
    Alert.alert(`Remove ${name ?? 'this friend'}?`, 'They will no longer see your cycle phase, and you won’t see theirs.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: async () => { await api.delete(`/connections/${connectionId}`); load(); } },
    ]);
  };

  const friendPhase = (f: FriendSummary) => computeCycleMath({
    cycleLogs: f.cycle_logs,
    defaultCycleLength: f.average_cycle_length,
    defaultPeriodLength: f.average_period_length,
    userId: f.friend_id,
  });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      <Header title="Friends" showBack />
      {loading ? (
        <View style={styles.center}><ActivityIndicator color={theme.cherry} /></View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <Text style={styles.blurb}>
            Invite people you already know. Only your cycle phase timing is
            ever shared — never your symptoms, notes, or flow details.
          </Text>

          <View style={styles.inviteRow}>
            <TextInput
              style={styles.inviteInput}
              value={inviteEmail}
              onChangeText={setInviteEmail}
              placeholder="Friend's email"
              placeholderTextColor={theme.textMuted}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <Pressable style={styles.inviteBtn} onPress={sendInvite} disabled={inviting}>
              <Icon name="plus" size={16} color="#fff" />
            </Pressable>
          </View>

          {pending.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Invites</Text>
              {pending.map((p) => (
                <View key={p.id} style={styles.row}>
                  <Text style={styles.rowName}>{p.other_display_name ?? p.invite_email}</Text>
                  <View style={styles.rowActions}>
                    <Pressable onPress={() => respond(p.id, false)} style={styles.declineBtn}>
                      <Icon name="x" size={14} color={theme.textMuted} />
                    </Pressable>
                    <Pressable onPress={() => respond(p.id, true)} style={styles.acceptBtn}>
                      <Icon name="check" size={14} color="#fff" />
                    </Pressable>
                  </View>
                </View>
              ))}
            </View>
          )}

          {friends.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Your circle</Text>
              {friends.map((f) => {
                const math = friendPhase(f);
                const matches = myPhase && math.hasData && math.phase === myPhase.phase;
                return (
                  <View key={f.connection_id} style={styles.row}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.rowName}>{f.display_name ?? 'Friend'}</Text>
                      <Text style={styles.rowSub}>
                        {math.hasData ? `${PHASE_LABEL[math.phase]} · day ${math.cycleDay}` : 'No cycle data yet'}
                      </Text>
                      {matches && <Text style={styles.matchNote}>You're both in your {PHASE_LABEL[math.phase].toLowerCase()} phase</Text>}
                    </View>
                    <Pressable onPress={() => removeFriend(f.connection_id, f.display_name)} hitSlop={10}>
                      <Icon name="x" size={16} color={theme.textMuted} />
                    </Pressable>
                  </View>
                );
              })}
            </View>
          )}

          {pending.length === 0 && friends.length === 0 && (
            <View style={styles.emptyState}>
              <Icon name="users" size={40} color={theme.textMuted} />
              <Text style={styles.emptyText}>No one here yet — invite a friend above.</Text>
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function createStyles(c: AppColors) {
  return StyleSheet.create({
    center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    scrollContent: { padding: Spacing.lg, gap: Spacing.lg, paddingBottom: 60 },
    blurb: { fontSize: FontSize.sm, color: c.textMuted, lineHeight: 19 },

    inviteRow: { flexDirection: 'row', gap: Spacing.sm },
    inviteInput: {
      flex: 1, backgroundColor: c.surface, borderRadius: Radius.md, borderWidth: 1,
      borderColor: c.border, paddingHorizontal: 14, paddingVertical: 11,
      color: c.textPrimary, fontSize: FontSize.md,
    },
    inviteBtn: {
      width: 44, height: 44, borderRadius: Radius.md, backgroundColor: c.cherry,
      alignItems: 'center', justifyContent: 'center',
    },

    section: { gap: Spacing.sm },
    sectionTitle: { color: c.textSecondary, fontSize: FontSize.sm, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.4 },

    row: {
      flexDirection: 'row', alignItems: 'center', backgroundColor: c.surface,
      borderRadius: Radius.md, borderWidth: 1, borderColor: c.border,
      paddingHorizontal: 14, paddingVertical: 12, gap: 12,
    },
    rowName: { color: c.textPrimary, fontSize: FontSize.md, fontWeight: '700' },
    rowSub: { color: c.textMuted, fontSize: FontSize.sm, marginTop: 2 },
    matchNote: { color: c.emerald, fontSize: FontSize.sm, fontWeight: '600', marginTop: 4 },

    rowActions: { flexDirection: 'row', gap: 8 },
    declineBtn: {
      width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center',
      backgroundColor: c.surfaceElevated, borderWidth: 1, borderColor: c.border,
    },
    acceptBtn: {
      width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center',
      backgroundColor: c.cherry,
    },

    emptyState: { alignItems: 'center', gap: Spacing.md, paddingTop: 40 },
    emptyText: { color: c.textMuted, fontSize: FontSize.md, textAlign: 'center' },
  });
}

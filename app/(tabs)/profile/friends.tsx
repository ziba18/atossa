import React, { useCallback, useState } from 'react';
import { View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { UI } from '../../../constants/atossaUI';
import {
  BackButton, BigButton, Card, ConfirmDelete, InlineError, PageTitle, Screen, Section, SectionHeading, SuccessNote, TextField, Txt,
} from '../../../components/atossa/kit';
import { useAuthStore } from '../../../stores/authStore';
import { api } from '../../../lib/api';
import { computeCycleMath, PHASE_LABEL } from '../../../algorithms/cyclePhase';
import type { CyclePhaseLog } from '../../../algorithms/cyclePhaseLog';
import type { CycleLog } from '../../../types/database';

const C = UI.colors;

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
  const user = useAuthStore((s) => s.user);
  const profile = useAuthStore((s) => s.profile);

  const [pending, setPending] = useState<PendingInvite[]>([]);
  const [friends, setFriends] = useState<FriendSummary[]>([]);
  const [myPhase, setMyPhase] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState('');
  const [inviteSent, setInviteSent] = useState('');
  const [removing, setRemoving] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    try {
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
      setMyPhase(mine.hasData ? mine.phase : null);
      setLoadError('');
    } catch {
      setLoadError('Friends couldn’t be loaded. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }, [user, profile]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const sendInvite = async () => {
    const email = inviteEmail.trim().toLowerCase();
    setInviteSent('');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setInviteError('Enter the email your friend uses for Atossa.');
      return;
    }
    setInviting(true);
    setInviteError('');
    try {
      await api.post('/connections/invite', { invite_email: email });
      setInviteEmail('');
      setInviteSent(`Invite sent. ${email} will see it next time they open Atossa.`);
    } catch {
      setInviteError('The invite couldn’t be sent. Please try again.');
    } finally {
      setInviting(false);
    }
  };

  const act = async (fn: () => Promise<unknown>) => {
    try { await fn(); } catch { setLoadError('That didn’t work. Check your connection and try again.'); }
    load();
  };

  const phaseOf = (f: FriendSummary) => computeCycleMath({
    cycleLogs: f.cycle_logs,
    defaultCycleLength: f.average_cycle_length,
    defaultPeriodLength: f.average_period_length,
    userId: f.friend_id,
  });

  return (
    <Screen header={false}>
      <BackButton label="Back" />
      <View style={{ marginTop: 20 }}>
        <PageTitle title="Friends" subtitle="Invite people you know. They only see your cycle phase — never your symptoms, notes or other records." />
      </View>

      <Card style={{ marginTop: 16, gap: 12 }}>
        <TextField
          label="Friend’s email"
          value={inviteEmail}
          onChangeText={(v) => { setInviteEmail(v); setInviteError(''); setInviteSent(''); }}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          returnKeyType="send"
          onSubmitEditing={sendInvite}
          error={inviteError}
        />
        <BigButton label={inviting ? 'Sending…' : 'Send invite'} icon="send" disabled={inviting} onPress={sendInvite} />
        <SuccessNote message={inviteSent} />
      </Card>

      {loadError ? <View style={{ marginTop: 16 }}><InlineError message={loadError} /></View> : null}
      {loading ? <Txt variant="body" color={C.mutedForeground} style={{ marginTop: 24 }}>Loading…</Txt> : null}

      {pending.length > 0 ? (
        <Section>
          <SectionHeading title="Invites for you" />
          <View style={{ gap: 12 }}>
            {pending.map((p) => (
              <Card key={p.id} style={{ gap: 12 }}>
                <Txt variant="bodyBold">{p.other_display_name ?? p.invite_email ?? 'Someone'}</Txt>
                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <BigButton label="Decline" variant="outline" onPress={() => act(() => api.post(`/connections/${p.id}/decline`))} style={{ flex: 1 }} />
                  <BigButton label="Accept" icon="check" onPress={() => act(() => api.post(`/connections/${p.id}/accept`))} style={{ flex: 1 }} />
                </View>
              </Card>
            ))}
          </View>
        </Section>
      ) : null}

      {friends.length > 0 ? (
        <Section>
          <SectionHeading title="Your friends" />
          <View style={{ gap: 12 }}>
            {friends.map((f) => {
              const math = phaseOf(f);
              const same = myPhase && math.hasData && math.phase === myPhase;
              const name = f.display_name ?? 'Friend';
              return (
                <Card key={f.connection_id} style={{ gap: 8 }}>
                  <Txt variant="h3">{name}</Txt>
                  <Txt variant="body">{math.hasData ? `${PHASE_LABEL[math.phase]} phase · day ${math.cycleDay}` : 'No cycle dates yet'}</Txt>
                  {same ? <Txt variant="smallBold" color={C.success}>You’re both in the {PHASE_LABEL[math.phase].toLowerCase()} phase</Txt> : null}
                  {removing === f.connection_id ? (
                    <ConfirmDelete
                      name={`${name} from your friends`}
                      onCancel={() => setRemoving(null)}
                      onDelete={() => { setRemoving(null); act(() => api.delete(`/connections/${f.connection_id}`)); }}
                    />
                  ) : (
                    <BigButton label="Remove friend" variant="outline" textColor={C.destructive} onPress={() => setRemoving(f.connection_id)} />
                  )}
                </Card>
              );
            })}
          </View>
        </Section>
      ) : null}

      {!loading && !loadError && pending.length === 0 && friends.length === 0 ? (
        <Txt variant="body" color={C.mutedForeground} style={{ marginTop: 24 }}>No friends yet. Invite someone above.</Txt>
      ) : null}
    </Screen>
  );
}

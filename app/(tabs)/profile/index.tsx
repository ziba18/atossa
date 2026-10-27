import React, { useRef, useState } from 'react';
import { ScrollView, View, type ScrollViewInstance } from 'react-native';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { space } from '../../../constants/atossaUI';
import { DATA_LINES } from '../../../constants/dataLocation';
import {
  Button, Card, ConfirmCard, HeroNumber, SafetyLine, ScreenLarge, Txt, showToast,
} from '../../../components/atossa/kit';
import type { IconName } from '../../../components/ui/Icon';
import { Group, GroupHeading, GroupRow } from '../../../components/atossa/records/GroupedRows';
import { savedLabel } from '../../../components/atossa/records/RecordsList';
import {
  KIND_INFO, firstParam, recordTitle, sortRecords, type RecordDataKind,
} from '../../../components/atossa/records/recordKinds';
import { nextAppointment } from '../../../components/atossa/capture/AppointmentCard';
import { formatRecordDateInline, formatShortDate, noteCount, notesLabel } from '../../../lib/records/format';
import { useAuthStore } from '../../../stores/authStore';
import { useRecordsStore } from '../../../stores/recordsStore';
import { isHumanName } from '../../../lib/humanName';
import { IS_PREVIEW } from '../../../lib/preview/flag';
import { cancelAllScheduledNotifications } from '../../../lib/notifications';
import { openLegal } from '../../../components/auth/LegalLinks';

/** Visible tab title (the `from` param HeaderAvatar passes) → tab route name. */
const TAB_ROUTES: Record<string, string> = { Today: 'today', Timeline: 'timeline', 'For my doctor': 'doctor' };

const RECORD_KINDS: RecordDataKind[] = ['medicine', 'appointment', 'history'];
const RECORD_ICONS: Record<RecordDataKind, IconName> = { medicine: 'pill', appointment: 'calendar', history: 'file-text' };

/** One line under a Records row: the newest item (or the next appointment), so the row says something before it is opened. */
function previewLine(kind: RecordDataKind, records: ReturnType<typeof useRecordsStore.getState>['records']): string | undefined {
  if (kind === 'appointment') {
    const next = nextAppointment(records.appointment);
    if (next) return `Next: ${formatShortDate(next.data.date)}${next.data.who.trim() ? ` · ${next.data.who.trim()}` : ''}`;
  }
  const newest = sortRecords(kind, records[kind] as any[])[0];
  if (!newest) return undefined;
  const d = newest.data as any;
  const date = formatRecordDateInline(kind === 'medicine' ? d.started : d.date, kind === 'medicine' ? d.startedPrecision : d.datePrecision);
  const title = recordTitle(kind, d);
  return `Latest: ${title.length > 24 ? `${title.slice(0, 23).trimEnd()}…` : title}${date ? ` · ${date}` : ''}`;
}

/** Preview mode only: whether Sam's sample data has been cleared this session. */
let previewCleared = false;

export default function ProfileScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { from: rawFrom } = useLocalSearchParams<{ from?: string }>();
  const from = TAB_ROUTES[firstParam(rawFrom)] ? firstParam(rawFrom) : 'Today';

  const profile = useAuthStore((s) => s.profile);
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);
  const deleteAccount = useAuthStore((s) => s.deleteAccount);
  const records = useRecordsStore((s) => s.records);
  const clearSampleData = useRecordsStore((s) => s.clearSampleData);
  const restoreSampleData = useRecordsStore((s) => s.restoreSampleData);

  const [confirmingSignOut, setConfirmingSignOut] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const scrollRef = useRef<ScrollViewInstance | null>(null);

  const name = isHumanName(profile?.display_name) ? profile!.display_name!.trim() : '';
  const counts: Record<RecordDataKind, number> = {
    medicine: records.medicine.length,
    appointment: records.appointment.length,
    history: records.history.length,
  };
  // The "your record" summary: how many notes, and the span they cover.
  const noteDates = records.symptom.map((n) => n.data.date).filter(Boolean).sort();
  const total = noteCount(records.symptom);
  const span = noteDates.length
    ? noteDates[0] === noteDates[noteDates.length - 1]
      ? `On ${formatShortDate(noteDates[0])}`
      : `${formatShortDate(noteDates[0])} to ${formatShortDate(noteDates[noteDates.length - 1])}`
    : '';
  // Preview only: Restore follows an explicit "cleared" flag (module-level so it survives the
  // screen remounting), not "are there any records" — adding one after clearing must not hide it.
  const [sampleCleared, setSampleClearedState] = useState(previewCleared);
  const setSampleCleared = (v: boolean) => { previewCleared = v; setSampleClearedState(v); };

  // Profile is a hidden tab: jump straight back to the tab it was opened from (keeping that
  // tab's own stack), rather than the Tabs default of always returning to the first tab.
  const goBack = () => {
    const tabs = navigation.getParent();
    if (tabs) (tabs as any).navigate(TAB_ROUTES[from]);
    else router.navigate(`/(tabs)/${TAB_ROUTES[from]}` as any);
  };

  const openList = (kind: RecordDataKind) =>
    router.push({ pathname: '/(tabs)/profile/records/[kind]', params: { kind: KIND_INFO[kind].slug } } as any);

  const onSampleData = () => {
    if (sampleCleared) {
      restoreSampleData();
      setSampleCleared(false);
      showToast('Sample data restored.');
    } else {
      clearSampleData();
      setSampleCleared(true);
      showToast('Sample data cleared.');
    }
  };

  const onDeleteAccount = async () => {
    if (deleting) return;
    setDeleting(true);
    try {
      await deleteAccount();
      await cancelAllScheduledNotifications();
      router.replace('/(auth)/welcome' as any);
    } catch {
      setDeleting(false);
      showToast('We couldn’t delete your account. Check your connection and try again.');
    }
  };

  // Scrolls an in-page confirm card into view once it has laid out.
  const scrollToCard = (y: number) =>
    setTimeout(() => scrollRef.current?.scrollTo({ y: Math.max(0, y - space.xxl), animated: true }), 50);

  return (
    <ScreenLarge title="Profile" back={{ label: from, onPress: goBack }} scrollRef={scrollRef}>
      <HeroNumber
        big={String(total)}
        line={total === 0 ? 'notes so far' : `${total === 1 ? 'note' : 'notes'} in your record`}
        sub={total === 0 ? 'Your first note starts your record' : span}
        onPress={total === 0 ? undefined : () => router.push('/(tabs)/timeline' as any)}
        accessibilityHint="Opens Timeline"
      />

      <Group style={{ marginTop: space.md }}>
        <GroupRow
          icon="user"
          label={name || 'Your details'}
          detail={user?.email || undefined}
          onPress={() => router.push('/(tabs)/profile/edit-profile' as any)}
          accessibilityLabel={`${name || 'Your details'}. Edit your details`}
        />
      </Group>

      <GroupHeading title="Records" style={{ marginTop: space.xxl }} />
      <Group>
        {RECORD_KINDS.map((kind) => (
          <GroupRow
            key={kind}
            icon={RECORD_ICONS[kind]}
            label={KIND_INFO[kind].listTitle}
            detail={previewLine(kind, records) ?? 'Nothing added yet'}
            value={counts[kind] ? String(counts[kind]) : undefined}
            onPress={() => openList(kind)}
            accessibilityLabel={`${KIND_INFO[kind].listTitle}. ${savedLabel(counts[kind])}. ${previewLine(kind, records) ?? ''}`}
          />
        ))}
      </Group>

      <GroupHeading title="Settings" style={{ marginTop: space.xxl }} />
      <Group>
        <GroupRow
          icon="bell"
          label="Reminders and notifications"
          onPress={() => router.push('/(tabs)/profile/settings' as any)}
        />
        <GroupRow
          icon="users"
          label="Friends"
          detail="Share only your cycle phase with people you invite"
          onPress={() => router.push('/(tabs)/profile/friends' as any)}
        />
      </Group>

      <GroupHeading title="Where your notes are kept" style={{ marginTop: space.xxl }} />
      <Card>
        <View style={{ gap: space.sm }}>
          {DATA_LINES.map((line) => <Txt key={line} variant="secondary">{line}</Txt>)}
        </View>
      </Card>

      <GroupHeading title="About" style={{ marginTop: space.xxl }} />
      <Group>
        <GroupRow icon="file-text" label="Privacy policy" onPress={() => openLegal('privacy')} />
        <GroupRow icon="file-text" label="Terms of use" onPress={() => openLegal('terms')} />
      </Group>

      <GroupHeading title="Account" style={{ marginTop: space.xxl }} />
      <Group>
        <GroupRow
          icon="log-out"
          label="Sign out"
          chevron={false}
          onPress={() => { setConfirmingDelete(false); setConfirmingSignOut(true); }}
        />
        {IS_PREVIEW ? null : (
          <GroupRow
            icon="trash-2"
            label="Delete account"
            chevron={false}
            onPress={() => { setConfirmingSignOut(false); setConfirmingDelete(true); }}
          />
        )}
      </Group>

      {confirmingSignOut ? (
        <ConfirmCard
          title="Sign out of Atossa?"
          message="Your information stays saved. You can sign in again any time."
          style={{ marginTop: space.xl }}
          onLayout={(e) => scrollToCard(e.nativeEvent.layout.y)}
          actions={[
            { label: 'Sign out', variant: 'primary', onPress: async () => { await signOut(); router.replace('/(auth)/welcome' as any); } },
            { label: 'Cancel', variant: 'text', onPress: () => setConfirmingSignOut(false) },
          ]}
        />
      ) : null}

      {confirmingDelete ? (
        <ConfirmCard
          tone="destructive"
          title="Delete your account?"
          message="This permanently deletes your account and everything you’ve saved in Atossa: symptoms, periods, appointments, medicines, history and friend connections. It can’t be undone."
          style={{ marginTop: space.xl }}
          onLayout={(e) => scrollToCard(e.nativeEvent.layout.y)}
          actions={[
            { label: deleting ? 'Deleting…' : 'Delete account', variant: 'destructive', onPress: onDeleteAccount },
            { label: 'Cancel', variant: 'text', onPress: () => setConfirmingDelete(false) },
          ]}
        />
      ) : null}

      <SafetyLine style={{ marginTop: space.xxl }} />
      <Txt variant="secondary" style={{ textAlign: 'center', marginTop: space.sm }}>
        Your notes are stored under your account and only shared when you share them.
      </Txt>

      {IS_PREVIEW ? (
        <Button
          label={sampleCleared ? 'Restore sample data' : 'Clear sample data'}
          variant="text"
          style={{ marginTop: space.xl }}
          onPress={onSampleData}
        />
      ) : null}
    </ScreenLarge>
  );
}

import { usePageTitle } from '../../../lib/usePageTitle';
import React, { useRef, useState } from 'react';
import { ScrollView, type ScrollViewInstance } from 'react-native';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { space } from '../../../constants/atossaUI';
import {
  Button, ConfirmCard, SafetyLine, ScreenLarge, Txt, showToast,
} from '../../../components/atossa/kit';
import type { IconName } from '../../../components/ui/Icon';
import { Group, GroupHeading, GroupRow } from '../../../components/atossa/records/GroupedRows';
import { savedLabel } from '../../../components/atossa/records/RecordsList';
import { KIND_INFO, firstParam, type RecordDataKind } from '../../../components/atossa/records/recordKinds';
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

/** Preview mode only: whether Sam's sample data has been cleared this session. */
let previewCleared = false;

export default function ProfileScreen() {
  usePageTitle('Profile');
  const router = useRouter();
  const navigation = useNavigation();
  const { from: rawFrom } = useLocalSearchParams<{ from?: string }>();
  const from = TAB_ROUTES[firstParam(rawFrom)] ? firstParam(rawFrom) : 'Today';

  const profile = useAuthStore((s) => s.profile);
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);
  const deleteAccount = useAuthStore((s) => s.deleteAccount);
  const records = useRecordsStore((s) => s.records);
  const recordsLoaded = useRecordsStore((s) => s.loadedFor !== null);
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
      <Group>
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
            value={!recordsLoaded ? '–' : counts[kind] ? String(counts[kind]) : 'None'}
            onPress={() => openList(kind)}
            accessibilityLabel={recordsLoaded ? `${KIND_INFO[kind].listTitle}. ${savedLabel(counts[kind])}` : `${KIND_INFO[kind].listTitle}. Loading`}
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
            destructive
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
        Your information is private to your account.
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

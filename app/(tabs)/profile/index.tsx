import React, { useRef, useState } from 'react';
import { Platform, ScrollView, View, useWindowDimensions, type ScrollViewInstance } from 'react-native';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { space } from '../../../constants/atossaUI';
import { DATA_LINES } from '../../../constants/dataLocation';
import {
  Button, Card, ConfirmCard, InlineError, TextField, SafetyLine, ScreenLarge, Txt, showToast,
} from '../../../components/atossa/kit';
import { Group, GroupHeading, GroupRow } from '../../../components/atossa/records/GroupedRows';
import { savedLabel } from '../../../components/atossa/records/RecordsList';
import {
  firstParam,
} from '../../../components/atossa/records/recordKinds';
import { DOMAINS, ONSET_GROUP_LABEL, onsetFromHistory, type OnsetGroup } from '../../../lib/records/summary';

import { useAuthStore } from '../../../stores/authStore';
import { useRecordsStore } from '../../../stores/recordsStore';
import { isHumanName } from '../../../lib/humanName';
import { usePageTitle } from '../../../lib/usePageTitle';
import { IS_PREVIEW } from '../../../lib/preview/flag';
import { cancelAllScheduledNotifications } from '../../../lib/notifications';
import { downloadAllNotes, classifyExportError, EXPORT_ERRORS } from '../../../lib/exportNotes';
import { openLegal } from '../../../components/auth/LegalLinks';
import { IS_PILOT } from '../../../lib/pilot';

/** Visible tab title (the `from` param HeaderAvatar passes) → tab route name. */
const TAB_ROUTES: Record<string, string> = { Today: 'today', Timeline: 'timeline', 'For my doctor': 'doctor' };


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
  const clearSampleData = useRecordsStore((s) => s.clearSampleData);
  const restoreSampleData = useRecordsStore((s) => s.restoreSampleData);

  const [confirmingSignOut, setConfirmingSignOut] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportPw, setExportPw] = useState('');
  const [exportBusy, setExportBusy] = useState(false);
  const [exportError, setExportError] = useState('');
  const [exportDone, setExportDone] = useState(false);
  const scrollRef = useRef<ScrollViewInstance | null>(null);
  // Under 600 pt tall the 'Help now' link is already at the top of the screen, so its duplicate row gives the room to Records.
  const shortScreen = useWindowDimensions().height < 600;

  const name = isHumanName(profile?.display_name) ? profile!.display_name!.trim() : '';
  const recordsTotal = records.medicine.length + records.appointment.length + records.history.length;
  // "First noticed" per area, as she saved it (a year, "not sure", or her own words); never worked out from her notes.
  const onsets = onsetFromHistory(records.history);
  const onsetGroups = (Object.keys(onsets) as OnsetGroup[]).sort((a, b) => DOMAINS.findIndex((d) => d.id === a) - DOMAINS.findIndex((d) => d.id === b));
  const onsetLine = onsetGroups.map((g) => {
    const o = onsets[g]!;
    const heading = DOMAINS.find((d) => d.id === g)?.heading ?? ONSET_GROUP_LABEL[g];
    return `${heading} ${o.year ? `around ${o.year}` : o.words ? `“${o.words}”` : 'not sure'}`;
  }).join(' · ');
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

  const onExport = async () => {
    if (IS_PREVIEW) { setExportPw(''); setExportDone(true); return; } // preview: shows the done state, downloads nothing
    if (exportBusy || !user?.email) return;
    setExportBusy(true);
    setExportError('');
    try {
      await downloadAllNotes(user.email, exportPw);
      setExportPw('');
      setExportDone(true);
    } catch (e) {
      setExportError(EXPORT_ERRORS[classifyExportError(e)]);
    } finally {
      setExportBusy(false);
    }
  };

  const onDeleteAccount = async () => {
    if (deleting) return;
    if (IS_PREVIEW) { setConfirmingDelete(false); showToast('Preview only: nothing was deleted.'); return; }
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
          // Zero-width spaces after @ and . let a long address wrap at those points on a narrow screen (the row's spoken label excludes it).
          detail={user?.email ? user.email.replace('@', '@\u200B') : undefined}
          onPress={() => router.push('/(tabs)/profile/edit-profile' as any)}
          accessibilityLabel={`${name || 'Your details'} ${user?.email ?? ''}. Edit your details`}
        />
      </Group>

      {onsetGroups.length ? (
        <Group style={{ marginTop: space.md }}>
          <GroupRow
            icon="calendar"
            label="First noticed"
            detail={onsetLine}
            onPress={() => router.push({ pathname: '/(auth)/onboarding/onset', params: { groups: onsetGroups.join(','), edit: '1' } } as any)}
            accessibilityLabel={`First noticed. ${onsetLine}. Edit`}
          />
        </Group>
      ) : null}

      {shortScreen ? null : (
        <Group style={{ marginTop: space.md }}>
          <GroupRow
            icon="heart-pulse"
            label="Help now"
            detail="999, NHS 111, Samaritans"
            onPress={() => router.push('/(tabs)/profile/help-now' as any)}
          />
        </Group>
      )}

      <GroupHeading title="Records" style={{ marginTop: space.xxl }} />
      <Group>
        <GroupRow
          icon="file-text"
          label="Your records"
          detail="Medicines, appointments, health history"
          value={recordsTotal ? String(recordsTotal) : undefined}
          onPress={() => router.push('/(tabs)/profile/records' as any)}
          accessibilityLabel={`Your records. Medicines, appointments, health history. ${recordsTotal ? `${recordsTotal} saved` : 'Nothing added yet'}`}
        />
      </Group>

      <GroupHeading title="Settings" style={{ marginTop: space.xxl }} />
      <Group>
        <GroupRow
          icon="bell"
          label="Reminders and notifications"
          detail={Platform.OS === 'web' ? 'Reminders come with the iPhone app' : 'Your daily reminder and its time'}
          onPress={() => router.push('/(tabs)/profile/settings' as any)}
        />
        {IS_PILOT ? null : (
          <GroupRow
            icon="users"
            label="Friends"
            detail="Invite someone you trust to see your recent period dates"
            onPress={() => router.push('/(tabs)/profile/friends' as any)}
          />
        )}
      </Group>

      <GroupHeading title="Where your notes are kept" style={{ marginTop: space.xxl }} />
      <Group>
        {DATA_LINES.map((line) => (
          <View key={line} style={{ paddingHorizontal: space.md, paddingVertical: space.sm }}>
            <Txt variant="secondary">{line}</Txt>
          </View>
        ))}
      </Group>
      <Group style={{ marginTop: space.md }}>
        <GroupRow
            icon="download"
            label="Download all my notes"
            detail="Everything you’ve saved, as one file"
            chevron={false}
            onPress={() => { setConfirmingSignOut(false); setConfirmingDelete(false); setExportDone(false); setExporting(true); }}
          />
        <GroupRow
          icon="trash-2"
          label="Delete account"
          chevron={false}
          onPress={() => { setConfirmingSignOut(false); setExporting(false); setConfirmingDelete(true); }}
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
          onPress={() => { setConfirmingDelete(false); setExporting(false); setConfirmingSignOut(true); }}
        />
      </Group>

      {exporting ? (
        <Card style={{ marginTop: space.xl, gap: space.md }} onLayout={(e) => scrollToCard(e.nativeEvent.layout.y)}>
          {exportDone ? (
            <>
              <View accessibilityRole="alert" style={{ gap: space.xxs }}>
                <Txt variant="headline">Your file is ready</Txt>
                <Txt variant="secondary">
                  It holds everything you’ve saved, in your words. It isn’t a medical record. This copy is saved wherever you choose, so delete it when you’ve finished with it. Your notes stay in Atossa until you delete them.
                </Txt>
              </View>
              <Button label="Done" variant="primary" onPress={() => { setExporting(false); setExportDone(false); }} />
            </>
          ) : (
            <>
            <View accessibilityRole="alert" style={{ gap: space.xxs }}>
              <Txt variant="headline">Download all my notes</Txt>
              <Txt variant="secondary">
                One file with everything you’ve saved: your notes, periods, appointments, medicines and history, in your words. It downloads to this device, to keep or share as you choose.
              </Txt>
            </View>
            <TextField
              label="Your password"
              hint="Asked so no one else can download your notes."
              value={exportPw}
              onChangeText={(v) => { setExportPw(v); setExportError(''); }}
              secret
              autoFocus
              autoCapitalize="none"
              autoComplete="current-password"
              textContentType="password"
              returnKeyType="done"
              onSubmitEditing={onExport}
            />
            {exportError ? <InlineError message={exportError} /> : null}
            <View style={{ gap: space.xs }}>
              <Button label={exportBusy ? 'Making your file…' : 'Download'} variant="primary" onPress={onExport} disabled={!exportPw || exportBusy} />
              <Button label="Cancel" variant="text" onPress={() => { setExporting(false); setExportPw(''); setExportError(''); }} />
            </View>

            </>
          )}
        </Card>
      ) : null}

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
            { label: 'Download my notes first', variant: 'text', onPress: () => { setConfirmingDelete(false); setExportDone(false); setExporting(true); } },
            { label: deleting ? 'Deleting…' : 'Delete account', variant: 'destructive', onPress: onDeleteAccount },
            { label: 'Cancel', variant: 'text', onPress: () => setConfirmingDelete(false) },
          ]}
        />
      ) : null}

      <SafetyLine style={{ marginTop: space.xxl }} />
      <Txt variant="secondary" style={{ marginTop: space.sm }}>
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

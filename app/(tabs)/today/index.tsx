// Today — capture first. One large "tell Atossa" card (voice or type), quick starters, then the
// latest note and the next appointment. Chat is secondary ("Talk it through").
// Rhythm (8-pt grid): title→greeting 8 · greeting→hero 24 · hero→chips 16 · 24 between cards.
import { RecentStrip } from '../../../components/atossa/timeline/RecentStrip';
import { usePageTitle } from '../../../lib/usePageTitle';
import React, { useState } from 'react';
import { View, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { IS_PREVIEW } from '../../../lib/preview/flag';
import { Button, HeaderAvatar, InlineError, ScreenLarge, SkeletonCards, Txt, showToast } from '../../../components/atossa/kit';
import { LogBleedingSheet } from '../../../components/atossa/LogBleedingSheet';
import { PeriodCard } from '../../../components/atossa/capture/PeriodCard';
import { AppointmentCard } from '../../../components/atossa/capture/AppointmentCard';
import {
  GhostNoteCard, HeroCard, HeroNumberCard, LatestNoteCard, OnsetConfirmRow, QuickRows, RoughDayCard, latestNote,
} from '../../../components/atossa/capture/TodayCards';
import { space } from '../../../constants/atossaUI';
import { isHumanName } from '../../../lib/humanName';
import { useAuthStore } from '../../../stores/authStore';
import { useRecordsStore } from '../../../stores/recordsStore';
import { CHAT_ENABLED } from '../../../lib/features';
import { useTimelineSession } from '../../../components/atossa/timeline/session';
import { noteCount } from '../../../lib/records/format';
import { todayKey } from '../../../lib/records/dates';
import { nextAppointment } from '../../../components/atossa/capture/AppointmentCard';

function greeting(name: string | null | undefined): string {
  const hour = new Date().getHours(); // time of day only — dates always come from todayKey()
  // 00:00-04:59 is neither morning nor evening for someone awake with symptoms.
  const part = hour < 5 ? 'Hello' : hour < 12 ? 'Morning' : hour < 18 ? 'Afternoon' : 'Evening';
  const first = isHumanName(name) ? name!.trim().split(/\s+/)[0] : '';
  // Without a name a bare 'Morning' reads like a label, so spell the greeting out.
  return first ? `${part}, ${first}` : part === 'Hello' ? part : `Good ${part.toLowerCase()}`;
}

// Design preview only (dev bundle, EXPO_PUBLIC_DESIGN_PREVIEW=1): lets the state-matrix renders put the screen in loading / error / first-run / saved.
if (IS_PREVIEW) Object.assign(globalThis, { __records: useRecordsStore, __toast: showToast });

export default function TodayScreen() {
  const router = useRouter();
  usePageTitle('Today');
  const name = useAuthStore((s) => s.profile?.display_name);
  const symptoms = useRecordsStore((s) => s.records.symptom);
  const userId = useAuthStore((s) => s.user?.id);
  const loadError = useRecordsStore((s) => s.error);
  const loadedFor = useRecordsStore((s) => s.loadedFor);
  const load = useRecordsStore((s) => s.load);
  const loading = useRecordsStore((s) => s.loading);
  const setTimelineMode = useTimelineSession((s) => s.setMode);
  const setOpenDay = useTimelineSession((s) => s.setOpenDay);
  const [bleeding, setBleeding] = useState(false);
  // 568 pt phones: card gaps shrink one step so the 7-day strip (with weekday letters) clears the tab bar.
  const gap = useWindowDimensions().height < 600 ? space.sm : space.md;
  const latest = latestNote(symptoms);
  // Capture first on every phone (owner decision, 28 Oct): a one-line chip, the capture card, the 14-day strip, then the quick rows.
  const strip = loadedFor && symptoms.length > 0 ? (
    <View style={{ marginTop: gap }}>
      {/* Patterns need a few notes to say anything; from 7 on, one tap from here (Timeline > Patterns). */}
      <RecentStrip
        symptoms={symptoms}
        flush
        onDayPress={(key) => { setTimelineMode('list'); setOpenDay(key); router.push('/(tabs)/timeline' as any); }}
        onPatterns={noteCount(symptoms) >= 7 ? () => { setTimelineMode('patterns'); router.push('/(tabs)/timeline' as any); } : undefined}
      />
    </View>
  ) : null;

  const capture = (
    <>
      <HeroCard />
      {/* The one big number sits right under the capture card: capture stays first, the proof of the record is next. */}
      {loadedFor ? <View style={{ marginTop: gap }}><HeroNumberCard /></View>
        : loading ? <View style={{ marginTop: gap }}><SkeletonCards count={1} label="Loading your notes" /></View> : null}
      {strip}
      <View style={{ marginTop: space.md }}>
        <QuickRows onPeriod={() => setBleeding(true)} />
      </View>
      {loadedFor ? <View style={{ marginTop: space.md }}><PeriodCard /></View> : null}
    </>
  );

  return (
    <ScreenLarge title={greeting(name)} right={<HeaderAvatar />}>
      {loadError && !loadedFor ? (
        <InlineError message={loadError} onRetry={userId ? () => load(userId) : undefined} style={{ marginBottom: space.md }} />
      ) : null}
      {capture}
      {/* No number until the notes have loaded: a first-run "0 notes" must never flash for someone with a record. The loading skeleton sits where the number will be (right under the capture card), so it is on the first screen. */}
      {loading && !loadedFor ? null : (
      <View style={{ marginTop: space.xl, gap: space.xl }}>
        {latest ? (<><LatestNoteCard note={latest} /><OnsetConfirmRow note={latest} /></>) : loadedFor && symptoms.length === 0 ? <GhostNoteCard /> : null}
        {loadedFor ? <AppointmentCard inviteOnly /> : null}
        <RoughDayCard />
      </View>
      )}
      <View style={{ marginTop: space.lg, alignItems: 'flex-start', gap: space.xxs }}>
        {CHAT_ENABLED ? (
          <Button
            label="Talk it through instead"
            variant="text"
            align="start"
            small
            onPress={() => router.push('/(tabs)/today/chat' as any)}
            accessibilityHint="Opens a chat. It can’t diagnose; you can turn it into a note for your doctor"
          />
        ) : null}
        <Txt variant="caption">
          Atossa can’t diagnose. If you feel very unwell, contact your GP, NHS 111 or 999.
        </Txt>
        <Button
          label="Help now"
          variant="text"
          align="start"
          small
          onPress={() => router.push({ pathname: '/(tabs)/profile/help-now', params: { from: 'Today' } } as any)}
          accessibilityHint="Opens phone numbers for urgent help"
        />
      </View>
      <LogBleedingSheet visible={bleeding} onClose={() => setBleeding(false)} />
    </ScreenLarge>
  );
}

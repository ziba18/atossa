// Today — capture first. One large "tell Atossa" card (voice or type), quick starters, then the
// latest note and the next appointment. Chat is secondary ("Talk it through").
// Rhythm (8-pt grid): title→greeting 8 · greeting→hero 24 · hero→chips 16 · 24 between cards.
import React, { useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button, HeaderAvatar, ScreenLarge, Txt } from '../../../components/atossa/kit';
import { LogBleedingSheet } from '../../../components/atossa/LogBleedingSheet';
import { AppointmentCard } from '../../../components/atossa/capture/AppointmentCard';
import {
  HeroCard, HeroNumberCard, LatestNoteCard, QuickRows, RoughDayCard, latestNote,
} from '../../../components/atossa/capture/TodayCards';
import { space } from '../../../constants/atossaUI';
import { isHumanName } from '../../../lib/humanName';
import { useAuthStore } from '../../../stores/authStore';
import { useRecordsStore } from '../../../stores/recordsStore';

function greeting(name: string | null | undefined): string {
  const hour = new Date().getHours(); // time of day only — dates always come from todayKey()
  const part = hour < 12 ? 'Morning' : hour < 18 ? 'Afternoon' : 'Evening';
  const first = isHumanName(name) ? name!.trim().split(/\s+/)[0] : '';
  return first ? `${part}, ${first}` : part;
}

export default function TodayScreen() {
  const router = useRouter();
  const name = useAuthStore((s) => s.profile?.display_name);
  const symptoms = useRecordsStore((s) => s.records.symptom);
  const [bleeding, setBleeding] = useState(false);
  const latest = latestNote(symptoms);

  return (
    <ScreenLarge title="Today" subtitle={greeting(name)} right={<HeaderAvatar />}>
      <HeroNumberCard />
      <View style={{ marginTop: space.md }}><HeroCard /></View>
      <View style={{ marginTop: space.md }}>
        <QuickRows onPeriod={() => setBleeding(true)} />
      </View>
      <View style={{ marginTop: space.xl, gap: space.xl }}>
        {latest ? <LatestNoteCard note={latest} /> : null}
        <AppointmentCard />
        <RoughDayCard />
      </View>
      <View style={{ marginTop: space.lg, alignItems: 'center', gap: space.xxs }}>
        <Button
          label="Talk it through instead"
          variant="text"
          small
          onPress={() => router.push('/(tabs)/today/chat' as any)}
          accessibilityHint="Opens a chat. It can’t diagnose; you can turn it into a note for your GP"
        />
        <Txt variant="caption" style={{ textAlign: 'center' }}>
          Atossa can’t diagnose. If you feel very unwell, contact your GP, NHS 111 or 999.
        </Txt>
      </View>
      <LogBleedingSheet visible={bleeding} onClose={() => setBleeding(false)} />
    </ScreenLarge>
  );
}

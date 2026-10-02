// Today — start a capture; see what's ready for the next appointment.
// Rhythm (8-pt grid): title→greeting 8 · greeting→hero 24 · hero→chips 16 · 24 between cards.
import React, { useState } from 'react';
import { View } from 'react-native';
import { HeaderAvatar, ScreenLarge } from '../../../components/atossa/kit';
import { LogBleedingSheet } from '../../../components/atossa/LogBleedingSheet';
import { AppointmentCard } from '../../../components/atossa/capture/AppointmentCard';
import {
  HeroCard, LatestNoteCard, RoughDayCard, StarterChips, latestNote,
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
  const name = useAuthStore((s) => s.profile?.display_name);
  const symptoms = useRecordsStore((s) => s.records.symptom);
  const [bleeding, setBleeding] = useState(false);
  const latest = latestNote(symptoms);

  return (
    <ScreenLarge title="Today" subtitle={greeting(name)} right={<HeaderAvatar />}>
      <HeroCard />
      <View style={{ marginTop: space.md }}>
        <StarterChips onPeriod={() => setBleeding(true)} />
      </View>
      <View style={{ marginTop: space.xl, gap: space.xl }}>
        <RoughDayCard />
        <AppointmentCard />
        {latest ? <LatestNoteCard note={latest} /> : null}
      </View>
      <LogBleedingSheet visible={bleeding} onClose={() => setBleeding(false)} />
    </ScreenLarge>
  );
}

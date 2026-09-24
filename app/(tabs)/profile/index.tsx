import React, { useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { UI } from '../../../constants/atossaUI';
import {
  BackButton, BigButton, Card, PageTitle, RecordRow, Screen, Section, SectionHeading, Txt,
} from '../../../components/atossa/kit';
import { useAuthStore } from '../../../stores/authStore';
import { useRecordsStore } from '../../../stores/recordsStore';
import { isHumanName } from '../../../lib/humanName';
import { formatDate } from '../../../lib/records/dates';

const C = UI.colors;

function Figure({ value, label }: { value: string; label: string }) {
  return (
    <Card style={{ flex: 1, alignItems: 'center', paddingVertical: 14 }}>
      <Txt variant="h2">{value}</Txt>
      <Txt variant="small" style={{ textAlign: 'center' }}>{label}</Txt>
    </Card>
  );
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12, paddingVertical: 10 }}>
      <Txt variant="body" style={{ flex: 1 }}>{label}</Txt>
      <Txt variant="bodyBold">{value}</Txt>
    </View>
  );
}

export default function ProfileScreen() {
  const router = useRouter();
  const { profile, user, signOut } = useAuthStore();
  const symptomCount = useRecordsStore((s) => s.records.symptom.length);
  const appointmentCount = useRecordsStore((s) => s.records.appointment.length);
  const [confirmingSignOut, setConfirmingSignOut] = useState(false);

  const name = isHumanName(profile?.display_name) ? profile!.display_name!.trim() : null;
  const initial = ((name ?? user?.email)?.[0] ?? 'A').toUpperCase();

  return (
    <Screen header={false}>
      <BackButton label="Back" />

      <View style={{ alignItems: 'center', marginTop: 20 }}>
        <View style={{ width: 88, height: 88, borderRadius: 44, backgroundColor: C.accent, alignItems: 'center', justifyContent: 'center' }}>
          <Txt variant="display" color={C.accentForeground}>{initial}</Txt>
        </View>
        <View style={{ marginTop: 12, alignItems: 'center' }}>
          <PageTitle title={name ?? 'Your profile'} />
        </View>
        {user?.email ? <Txt variant="body" color={C.mutedForeground}>{user.email}</Txt> : null}
      </View>

      <View style={{ flexDirection: 'row', gap: 12, marginTop: 24 }}>
        <Figure value={String(symptomCount)} label="Symptoms saved" />
        <Figure value={String(appointmentCount)} label="Appointments" />
      </View>

      {profile ? (
        <Section>
          <SectionHeading title="About me" />
          <Card>
            <InfoLine label="Usual time between periods" value={`${profile.average_cycle_length} days`} />
            <InfoLine label="Usual period length" value={`${profile.average_period_length} days`} />
            {profile.date_of_birth ? <InfoLine label="Date of birth" value={formatDate(profile.date_of_birth)} /> : null}
          </Card>
          <BigButton label="Edit my details" icon="pencil" variant="outline" style={{ marginTop: 12 }} onPress={() => router.push('/(tabs)/profile/edit-profile' as any)} />
        </Section>
      ) : null}

      <Section>
        <View style={{ gap: 12 }}>
          <RecordRow icon="users" title="Friends" subtitle="Share only your cycle phase with people you invite" onPress={() => router.push('/(tabs)/profile/friends' as any)} />
          <RecordRow icon="settings" title="Settings" subtitle="Reminders and notifications" onPress={() => router.push('/(tabs)/profile/settings' as any)} />
        </View>
      </Section>

      <Section>
        {confirmingSignOut ? (
          <Card tone="coral" style={{ gap: 12 }}>
            <Txt variant="bodyBold">Sign out of Atossa?</Txt>
            <Txt variant="small" color={C.foreground}>Your information stays saved. You can sign in again any time.</Txt>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <BigButton label="Cancel" variant="outline" onPress={() => setConfirmingSignOut(false)} style={{ flex: 1 }} />
              <BigButton
                label="Sign out"
                variant="destructive"
                onPress={async () => { await signOut(); router.replace('/(auth)/welcome'); }}
                style={{ flex: 1 }}
              />
            </View>
          </Card>
        ) : (
          <BigButton label="Sign out" icon="log-out" variant="outline" textColor={C.destructive} onPress={() => setConfirmingSignOut(true)} />
        )}
        <Txt variant="small" style={{ textAlign: 'center', marginTop: 20 }}>Your information is private to your account.</Txt>
      </Section>
    </Screen>
  );
}

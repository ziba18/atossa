// Preview-only mock of the clinic pilot dashboard (pm/prd/clinic-dashboard.md). Counts and dates only:
// no notes, no symptom content, no names. Every number is an example. Never reachable in a real build.
import React from 'react';
import { ScrollView, View, useWindowDimensions } from 'react-native';
import { Redirect, useLocalSearchParams } from 'expo-router';
import { Button, Card, Txt } from '../components/atossa/kit';
import { colors, space } from '../constants/atossaUI';
import { IS_PREVIEW } from '../lib/preview/flag';

const TILES = [
  { n: '40', label: 'Invited' },
  { n: '31', label: 'Joined' },
  { n: '22', label: 'Active this week' },
  { n: '9 / 12', label: 'Summaries ready' },
];
const ROWS = [
  ['P-07', '12 Oct', '5', '5 Nov', 'Ready', 'Yes', 'Today'],
  ['P-12', '14 Oct', '0', '—', '—', 'No', '9 days ago'],
  ['P-19', '20 Oct', '3', '3 Nov', 'Ready', 'No', 'Yesterday'],
  ['P-23', '21 Oct', '4', '6 Nov', 'Ready', 'Yes', 'Today'],
  ['P-31', '24 Oct', '1', '—', '—', 'No', '3 days ago'],
];
const COLS = ['ID', 'Joined', 'Notes, last 7 days', 'Next appointment', 'Summary', 'Shared with clinic', 'Last active'];

const Tag = () => (
  <View style={{ alignSelf: 'flex-start', backgroundColor: colors.plumTint, paddingHorizontal: space.sm, paddingVertical: space.xxs, borderRadius: 999 }}>
    <Txt variant="caption">Mock — pilot feature · example numbers</Txt>
  </View>
);

function Consent() {
  return (
    <View role="main" style={{ flex: 1 }}><ScrollView style={{ backgroundColor: colors.canvas }} contentContainerStyle={{ padding: space.lg, gap: space.md }}>
      <Tag />
      <Txt variant="hero">Share activity with Example Clinic?</Txt>
      <Card>
        <Txt variant="groupLabel">The clinic can see</Txt>
        <View style={{ gap: space.xs, marginTop: space.sm }}>
          {['The date you joined', 'How many notes you added each week', 'Whether a summary is ready for your appointment', 'Your answers to the short questionnaire'].map((l) => <Txt key={l}>{l}</Txt>)}
        </View>
      </Card>
      <Card>
        <Txt variant="groupLabel">The clinic never sees</Txt>
        <View style={{ gap: space.xs, marginTop: space.sm }}>
          {['What is in your notes', 'Your periods or your records', 'Your summary, unless you choose to share it each time'].map((l) => <Txt key={l}>{l}</Txt>)}
        </View>
      </Card>
      <Txt variant="secondary">You can stop sharing at any time from Profile. Atossa never diagnoses.</Txt>
      <Button label="Agree and share" onPress={() => {}} />
      <Button label="Not now" variant="text" onPress={() => {}} />
    </ScrollView></View>
  );
}

export default function ClinicMock() {
  const { view } = useLocalSearchParams<{ view?: string }>();
  const { width } = useWindowDimensions();
  if (!IS_PREVIEW) return <Redirect href={'/' as any} />;
  if (view === 'consent') return <Consent />;
  const wide = width >= 900;
  return (
    <View role="main" style={{ flex: 1 }}><ScrollView style={{ backgroundColor: colors.canvas }} contentContainerStyle={{ padding: wide ? space.xxl : space.lg, gap: space.lg, maxWidth: 1240, width: '100%', alignSelf: 'center' }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: space.sm }}>
        <View style={{ gap: space.xs }}>
          <Txt variant="hero">Atossa · Pilot: Example Clinic</Txt>
          <Tag />
        </View>
        <Txt variant="secondary">Staff: J. Smith</Txt>
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.md }}>
        {TILES.map((t) => (
          <Card key={t.label} style={{ flexGrow: 1, flexBasis: wide ? 0 : '45%' }}>
            <Txt variant="hero" style={{ fontVariant: ['tabular-nums'] }}>{t.n}</Txt>
            <Txt variant="secondary">{t.label}</Txt>
          </Card>
        ))}
      </View>
      <Txt variant="secondary">Ready = a summary made in the last 14 days before a booked appointment. Median notes per patient per week: 3.</Txt>
      <Card>
        <Txt variant="groupLabel">Patients by invite week</Txt>
        <View role="table" style={{ marginTop: space.sm }}>
          <View role="row" style={{ flexDirection: 'row', paddingVertical: space.xs, borderBottomWidth: 1, borderColor: colors.hairline }}>
            {COLS.map((c) => <Txt key={c} role="columnheader" variant="secondary" style={{ flex: 1 }}>{c}</Txt>)}
          </View>
          {ROWS.map((r) => (
            <View key={r[0]} role="row" style={{ flexDirection: 'row', paddingVertical: space.sm, borderBottomWidth: 1, borderColor: colors.hairline }}>
              {r.map((c, i) => <Txt key={i} role="cell" style={{ flex: 1, fontVariant: ['tabular-nums'] }}>{c}</Txt>)}
            </View>
          ))}
        </View>
      </Card>
      <View style={{ flexDirection: 'row', gap: space.sm, flexWrap: 'wrap' }}>
        <Button label="Invite patients" onPress={() => {}} />
        <Button label="Pilot report" variant="secondary" onPress={() => {}} />
      </View>
      <Txt variant="secondary">Patient-recorded data · not a clinical assessment · access to shared summaries is logged. Counts only: the clinic sees no note content.</Txt>
    </ScrollView></View>
  );
}

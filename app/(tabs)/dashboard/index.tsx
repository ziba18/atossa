import React from 'react';
import { View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { UI } from '../../../constants/atossaUI';
import {
  BigButton, Card, InlineError, PageTitle, RecordRow, Screen, Section, SectionHeading, Txt,
} from '../../../components/atossa/kit';
import { Icon } from '../../../components/ui/Icon';
import { MonthGrid } from '../../../components/atossa/Calendar';
import { PainChart, WeeklyBars } from '../../../components/atossa/Charts';
import { useAuthStore } from '../../../stores/authStore';
import { useRecordsStore } from '../../../stores/recordsStore';
import {
  deriveCycles, periodSummary, symptomStats, weeklyStoppedDays,
} from '../../../lib/records/summary';
import {
  MONTH_NAMES, formatDate, formatRecordDate, isFuture, parseKey, todayKey,
} from '../../../lib/records/dates';

const C = UI.colors;
const PREVIEW_LIMIT = 5;

function SummaryFigure({ value, label, tone }: { value: string; label: string; tone: 'coral' | 'blue' | 'green' | 'plain' }) {
  return (
    <Card tone={tone} style={{ flexBasis: '48%', flexGrow: 1, minHeight: 116 }}>
      <Txt variant="h2" style={{ fontSize: 28, lineHeight: 34 }}>{value}</Txt>
      <Txt variant="smallBold" style={{ marginTop: 6 }}>{label}</Txt>
    </Card>
  );
}

function DashboardRecordCard({ title, count, icon, tone, onOpen }: { title: string; count: number; icon: 'pill' | 'stethoscope'; tone: 'coral' | 'green'; onOpen: () => void }) {
  return (
    <Section>
      <Pressable
        onPress={onOpen}
        accessibilityRole="button"
        accessibilityLabel={`${title}, ${count} saved entries. Open`}
        style={({ pressed }) => [{
          borderRadius: UI.radius, borderWidth: 1, borderColor: C.border, padding: 20, flexDirection: 'row', alignItems: 'center', gap: 16,
          backgroundColor: tone === 'coral' ? C.coralSoft : C.secondary, opacity: pressed ? 0.85 : 1,
        }]}
      >
        <View style={{ width: 56, height: 56, borderRadius: UI.radius, backgroundColor: C.card, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name={icon} size={28} color={C.foreground} />
        </View>
        <View style={{ flex: 1 }}>
          <Txt variant="h2">{title}</Txt>
          <Txt variant="h2" style={{ fontSize: 30, lineHeight: 36, marginTop: 4 }}>{count}</Txt>
          <Txt variant="small" color={C.foreground}>saved entries</Txt>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Txt variant="bodyBold">Open</Txt>
          <Icon name="chevron-right" size={24} color={C.foreground} />
        </View>
      </Pressable>
    </Section>
  );
}

export default function DashboardScreen() {
  const router = useRouter();
  const userId = useAuthStore((s) => s.user?.id);
  const { records, loadedFor, loading, error, load } = useRecordsStore();
  const go = (path: string, params?: Record<string, string>) => router.push({ pathname: `/(tabs)/dashboard/${path}`, params } as any);

  const symptoms = records.symptom.map((r) => ({ id: r.id, ...r.data }));
  const periodDays = records.period_day.map((r) => r.data);
  const cycles = deriveCycles(periodDays);
  const latest = cycles[0];
  const stats = symptomStats(symptoms);
  const byDateAsc = [...symptoms].sort((a, b) => a.date.localeCompare(b.date));
  const chartSymptoms = byDateAsc.slice(-30);
  const newestFirst = [...symptoms].sort((a, b) => b.date.localeCompare(a.date));
  const appointments = [...records.appointment].sort((a, b) => b.data.date.localeCompare(a.data.date));
  const previewParts = latest ? parseKey(latest.start) : parseKey(todayKey());
  const dateRange = byDateAsc.length
    ? `${formatDate(byDateAsc[0].date, true)} – ${formatDate(byDateAsc[byDateAsc.length - 1].date, true)}`
    : 'No dates saved yet';
  const dayMap = new Map(periodDays.map((d) => [d.date, d]));

  if (loading && loadedFor === null) {
    return <Screen><PageTitle title="Dashboard" /><Txt variant="body" color={C.mutedForeground}>Loading your information…</Txt></Screen>;
  }
  if (error && loadedFor === null) {
    return (
      <Screen>
        <PageTitle title="Dashboard" />
        <InlineError message={error} />
        <BigButton label="Try again" icon="refresh" onPress={() => userId && load(userId)} style={{ marginTop: 16 }} />
      </Screen>
    );
  }

  return (
    <Screen>
      <PageTitle title="Dashboard" subtitle="A history of what you reported to Atossa." />

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 20 }} accessibilityLabel="Summary figures">
        <SummaryFigure value={String(symptoms.length)} label="Symptoms saved" tone="coral" />
        <SummaryFigure value={latest?.length ? `${latest.length} days` : '—'} label="Last period" tone="blue" />
        <SummaryFigure value={`${stats.stoppedDays} ${stats.stoppedDays === 1 ? 'day' : 'days'}`} label="Days it stopped me doing things" tone="green" />
        <SummaryFigure value={symptoms.length ? `${stats.max} out of 10` : '—'} label="Highest pain score" tone="plain" />
      </View>

      <Section>
        <SectionHeading title="Pain over time" subtitle={`Your saved answers · ${dateRange}`} />
        <Card>
          {chartSymptoms.length === 0 ? (
            <Txt variant="body">Nothing to show yet. Tell Atossa how you feel in Chat and your answers will appear here.</Txt>
          ) : (
            <>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <View style={{ width: 32, height: 4, backgroundColor: C.primaryStrong }} />
                <Txt variant="smallBold">Reported pain, 0–10</Txt>
              </View>
              <PainChart
                scores={chartSymptoms.map((s) => s.score)}
                accessibilityLabel={`Pain scores: ${chartSymptoms.map((s) => s.score).join(', ')}`}
              />
              <Txt variant="small" style={{ marginTop: 12 }}>
                {symptoms.length} saved {symptoms.length === 1 ? 'score' : 'scores'}, from {stats.min} to {stats.max} out of 10.
              </Txt>
            </>
          )}
        </Card>
      </Section>

      <Section>
        <SectionHeading title="Days that stopped me doing things, by week" subtitle="From your Yes and No answers" />
        <Card>
          <WeeklyBars weeks={weeklyStoppedDays(symptoms)} />
          <Txt variant="small" style={{ marginTop: 16 }}>{stats.stoppedDays} different saved days were marked Yes.</Txt>
        </Card>
      </Section>

      <Section>
        <SectionHeading title="My symptoms" subtitle={`${symptoms.length} saved ${symptoms.length === 1 ? 'entry' : 'entries'}`} />
        <View style={{ gap: 12 }}>
          {newestFirst.length === 0 ? <Txt variant="body" color={C.mutedForeground}>No symptoms saved yet.</Txt> : null}
          {newestFirst.slice(0, PREVIEW_LIMIT).map((s) => (
            <RecordRow
              key={s.id}
              title={`${formatDate(s.date)} · ${s.score}/10`}
              subtitle={s.words}
              upcoming={isFuture(s.date)}
              onPress={() => go('symptoms', { id: s.id })}
            />
          ))}
          {newestFirst.length > PREVIEW_LIMIT ? (
            <BigButton label={`See all ${newestFirst.length} entries`} variant="outline" onPress={() => go('symptoms')} />
          ) : null}
        </View>
      </Section>

      <Section>
        <SectionHeading title="Cycle" />
        <Pressable
          onPress={() => go('calendar')}
          accessibilityRole="button"
          accessibilityLabel={`Open calendar. ${periodSummary(periodDays)}`}
          style={({ pressed }) => [{
            borderRadius: UI.radius, borderWidth: 1, borderColor: C.border, backgroundColor: C.card, padding: 16, gap: 12, opacity: pressed ? 0.85 : 1,
          }]}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Txt variant="h3">{MONTH_NAMES[previewParts.m0]} {previewParts.y}</Txt>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Txt variant="bodyBold" color={C.accentForeground}>Open calendar</Txt>
              <Icon name="chevron-right" size={22} color={C.accentForeground} />
            </View>
          </View>
          <MonthGrid
            year={previewParts.y}
            month0={previewParts.m0}
            compact
            cellHeight={34}
            cellState={(key) => {
              const d = dayMap.get(key);
              return { bleeding: !!d && d.flow !== 'None', start: d?.isStart, end: d?.isEnd };
            }}
          />
          <Txt variant="bodyBold">{periodSummary(periodDays)}</Txt>
        </Pressable>
      </Section>

      <Section>
        <SectionHeading
          title="Appointments"
          subtitle={`${appointments.length} saved`}
          right={<BigButton label="Add" icon="plus" variant="outline" onPress={() => go('appointments', { id: 'new' })} style={{ minHeight: 56, paddingHorizontal: 16 }} />}
        />
        <View style={{ gap: 12 }}>
          {appointments.slice(0, PREVIEW_LIMIT).map((a) => (
            <RecordRow
              key={a.id}
              icon="calendar"
              title={formatRecordDate(a.data.date, a.data.datePrecision)}
              subtitle={a.data.who}
              upcoming={isFuture(a.data.date)}
              onPress={() => go('appointments', { id: a.id })}
            />
          ))}
          {appointments.length > PREVIEW_LIMIT ? (
            <BigButton label={`See all ${appointments.length} appointments`} variant="outline" onPress={() => go('appointments')} />
          ) : null}
          <BigButton label="Add an appointment" icon="plus" onPress={() => go('appointments', { id: 'new' })} />
        </View>
      </Section>

      <DashboardRecordCard title="Medicines and treatments" count={records.medicine.length} icon="pill" tone="coral" onOpen={() => go('medicines')} />
      <DashboardRecordCard title="Health history" count={records.history.length} icon="stethoscope" tone="green" onOpen={() => go('health')} />
    </Screen>
  );
}

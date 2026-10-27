// Bleeding day detail (opened from a bleeding card): status, optional flow, optional note (her
// words — printed on the GP page, so she must be able to see and edit them), date, Save, Delete.
// Same rules as the Log bleeding sheet: status required, Spotting is its own status, flow optional.
import React, { useEffect, useRef, useState } from 'react';
import { urgentSignpost } from '../../../lib/urgentWording';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import {
  Button, Card, ChipGroup, ConfirmCard, DatePill, DayChooser, EmptyState, FieldLabel, GlyphLine, InlineError, ScreenLarge, TextField, Txt,
  showToast,
} from '../kit';
import { space } from '../../../constants/atossaUI';
import { haptics } from '../../../lib/haptics';
import { bleedingFacts, bleedingStatus, formatDay } from '../../../lib/records/format';
import { useRecordsStore } from '../../../stores/recordsStore';
import type { BleedingStatus, Flow, PeriodDayData } from '../../../types/records';
import { goBack, revealConfirm, useScrollRef } from './navigation';

const STATUS_OPTIONS = [
  { value: 'started', label: 'Started' },
  { value: 'ongoing', label: 'Still going' },
  { value: 'ended', label: 'Ended' },
  { value: 'spotting', label: 'Spotting' },
];
const FLOWS: Flow[] = ['None', 'Light', 'Medium', 'Heavy'];

export function BleedingDetail({ date: routeDate, from }: { date: string; from: string }) {
  const router = useRouter();
  const periodDays = useRecordsStore((s) => s.records.period_day);
  const savePeriodDays = useRecordsStore((s) => s.savePeriodDays);
  const deletePeriodDay = useRecordsStore((s) => s.deletePeriodDay);
  const rec = periodDays.find((r) => r.data.date === routeDate);
  const scrollRef = useScrollRef();

  const [date, setDate] = useState(routeDate);
  const [choosingDate, setChoosingDate] = useState(false);
  const [status, setStatus] = useState<BleedingStatus | null>(rec ? bleedingStatus(rec.data) : null);
  const [flow, setFlow] = useState<Flow | null>(rec?.data.flow ?? null);
  const [note, setNote] = useState(rec?.data.note ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [confirming, setConfirming] = useState(false);
  const done = useRef(false);
  const loaded = useRecordsStore((st) => st.loadedFor != null && !st.loading);

  // The record can arrive after mount (store still loading); take its values once.
  const seeded = useRef(Boolean(rec));
  useEffect(() => {
    if (rec && !seeded.current) {
      seeded.current = true;
      setStatus(bleedingStatus(rec.data));
      setFlow(rec.data.flow ?? null);
      setNote(rec.data.note ?? '');
    }
  }, [rec]);

  const back = () => goBack(router, from);

  // Removed elsewhere (e.g. sample data cleared) while open: go back rather than strand Sam here.
  useEffect(() => {
    if (!rec && loaded && !done.current) back();
  }, [rec, loaded]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!rec && !done.current) {
    return (
      <ScreenLarge title="Bleeding" back={{ label: from, onPress: back }}>
        <EmptyState message="Nothing is logged for this day any more." />
      </ScreenLarge>
    );
  }

  const clash = date !== routeDate && periodDays.some((r) => r.data.date === date);
  const changed = rec
    ? date !== routeDate || status !== bleedingStatus(rec.data) || (flow ?? null) !== (rec.data.flow ?? null)
      || note.trim() !== (rec.data.note ?? '').trim()
    : false;

  const save = async () => {
    if (!status || !rec) return;
    const day: PeriodDayData = {
      date,
      status,
      isStart: status === 'started',
      isEnd: status === 'ended',
      ...(flow && status !== 'spotting' ? { flow } : {}),
      note: note.trim(),
    };
    setBusy(true);
    setError('');
    try {
      await savePeriodDays([day]);
      done.current = true;
      if (date !== routeDate) await deletePeriodDay(routeDate);
      haptics.success();
      back();
      showToast('Saved.');
    } catch {
      setError("That didn't save. Check your connection and try again.");
      setBusy(false);
    }
  };

  const del = async () => {
    setBusy(true);
    setError('');
    try {
      done.current = true;
      await deletePeriodDay(routeDate);
      back();
      showToast('Bleeding entry deleted.');
    } catch {
      done.current = false;
      setError("That didn't delete. Check your connection and try again.");
      setBusy(false);
    }
  };

  return (
    <ScreenLarge
      title="Bleeding"
      subtitle={rec ? <GlyphLine icon="droplet" clay text={bleedingFacts(rec.data)} /> : undefined}
      back={{ label: from, onPress: back }}
      scrollRef={scrollRef}
    >
      <View style={{ gap: space.xxl }}>
        <View style={{ gap: space.xs }}>
          <FieldLabel label="Date" style={{ marginBottom: space.xxs }} />
          <DatePill value={date} onPress={() => setChoosingDate((v) => !v)} />
          {choosingDate ? (
            <Card>
              <DayChooser value={date} onChange={(k) => { setDate(k); setChoosingDate(false); }} />
            </Card>
          ) : null}
          {clash ? (
            <Txt variant="secondary">{`Bleeding is already logged on ${formatDay(date)}. Saving will replace it.`}</Txt>
          ) : null}
        </View>

        <View>
          <FieldLabel label="What was happening?" />
          <ChipGroup
            accessibilityLabel="Bleeding status"
            options={STATUS_OPTIONS}
            value={status}
            onChange={(v) => {
              const next = v as BleedingStatus | null;
              setStatus(next);
              // Spotting carries no flow (N10): "Spotting · Medium" contradicts itself.
              if (next === 'spotting') setFlow(null);
            }}
          />
        </View>

        {status === 'spotting' ? null : (
          <View>
            <FieldLabel label="Flow" optional />
            <ChipGroup
              accessibilityLabel="Flow"
              options={FLOWS}
              value={flow}
              allowDeselect
              onChange={(v) => setFlow(v as Flow | null)}
            />
          </View>
        )}

        {urgentSignpost(note) ? (
          <Card tone="sunken">
            <Txt accessibilityRole="alert">{urgentSignpost(note)}</Txt>
          </Card>
        ) : null}
        <TextField
          label="Anything to note?"
          optional
          value={note}
          onChangeText={setNote}
          placeholder="In your own words"
          multiline
          maxLength={500}
        />

        <InlineError message={error} />

        <Button label="Save" onPress={save} disabled={!status || !changed} loading={busy && !confirming} />

        {confirming ? (
          <ConfirmCard
            tone="destructive"
            title="Delete this bleeding entry?"
            message="It will be removed from your timeline and your summary. This can't be undone."
            onLayout={(e) => revealConfirm(scrollRef, e)}
            actions={[
              { label: 'Delete', variant: 'destructive', onPress: del },
              { label: 'Cancel', variant: 'secondary', onPress: () => setConfirming(false) },
            ]}
          />
        ) : (
          <Button variant="destructive" icon="trash-2" align="start" label="Delete entry" onPress={() => { setConfirming(true); revealConfirm(scrollRef); }} />
        )}
      </View>
    </ScreenLarge>
  );
}

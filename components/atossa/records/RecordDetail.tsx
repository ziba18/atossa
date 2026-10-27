import React, { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { useNavigation } from 'expo-router';
import { space } from '../../../constants/atossaUI';
import type {
  AppointmentData, HistoryData, HistoryType, MedicineData, Rec,
} from '../../../types/records';
import { useRecordsStore } from '../../../stores/recordsStore';
import { haptics } from '../../../lib/haptics';
import {
  Button, ChipGroup, ConfirmCard, FieldLabel, EmptyState, InlineError, ScreenLarge, SectionTitle, TextField, Txt, showToast,
} from '../kit';
import { todayKey } from '../../../lib/records/dates';
import { useScrollRef } from '../timeline/navigation';
import { RecordDateField } from './RecordDateField';
import { HISTORY_TYPES, KIND_INFO, isBeforeAtPrecision, type RecordDataKind } from './recordKinds';

const HELPED_OPTIONS = ['Helped', 'A little', 'No', 'Not sure'] as const;

type AnyData = MedicineData | AppointmentData | HistoryData;
/** History drafts may have no type yet (nothing pre-selected). */
type HistoryDraft = Omit<HistoryData, 'type'> & { type: HistoryType | '' };
type Draft = MedicineData | AppointmentData | HistoryDraft;

const blank = (kind: RecordDataKind): Draft => {
  if (kind === 'medicine') {
    return { name: '', dose: '', started: '', startedPrecision: 'exact', stopped: '', stoppedPrecision: 'exact', happened: '' };
  }
  if (kind === 'appointment') {
    return { date: '', datePrecision: 'exact', who: '', why: '', told: '', tests: '', next: '', notes: '' };
  }
  return { type: '', date: '', datePrecision: 'exact', told: '', done: '', result: '' };
};

/** Fill fields older records may lack, so every input is controlled. */
const normalise = (kind: RecordDataKind, data: AnyData): Draft => ({ ...blank(kind), ...data } as Draft);

/** What's still needed before Save is enabled, in plain words ('' = ready). */
function missing(kind: RecordDataKind, d: Draft): string {
  if (kind === 'medicine') {
    const m = d as MedicineData;
    const need = [!m.name.trim() && 'a name', !m.started && 'when you started'].filter(Boolean);
    return need.length ? `Add ${need.join(' and ')} to save.` : '';
  }
  if (kind === 'appointment') {
    const a = d as AppointmentData;
    const need = [!a.who.trim() && 'who or where', !a.date && 'the date'].filter(Boolean);
    return need.length ? `Add ${need.join(' and ')} to save.` : '';
  }
  const h = d as HistoryDraft;
  const need = [!h.type && 'what it was', !h.date && 'when'].filter(Boolean);
  return need.length ? `Add ${need.join(' and ')} to save.` : '';
}

/** Trim free text before saving; Sam's words are otherwise kept exactly as written. */
function cleaned(kind: RecordDataKind, d: Draft): AnyData {
  if (kind === 'medicine') {
    const m = d as MedicineData;
    return { ...m, name: m.name.trim(), dose: m.dose?.trim() ?? '', happened: m.happened.trim() };
  }
  if (kind === 'appointment') {
    const a = d as AppointmentData;
    return {
      ...a, who: a.who.trim(), why: a.why.trim(), told: a.told.trim(), tests: a.tests.trim(),
      next: a.next.trim(), notes: a.notes.trim(),
    };
  }
  const h = d as HistoryDraft;
  return { ...h, type: h.type as HistoryType, told: h.told.trim(), done: h.done.trim(), result: h.result.trim() };
}

/**
 * What counts as a change for the "Discard changes?" guard: trimmed text, and a date's
 * precision only when a date is actually set (tapping "Around" before picking a year isn't an edit).
 */
function signature(kind: RecordDataKind, d: Draft): string {
  const c = cleaned(kind, d) as unknown as Record<string, unknown>;
  const out: Record<string, unknown> = { ...c };
  for (const [date, prec] of [['started', 'startedPrecision'], ['stopped', 'stoppedPrecision'], ['date', 'datePrecision']]) {
    if (date in out && !out[date]) delete out[prec];
  }
  return JSON.stringify(out, Object.keys(out).sort());
}

/** Is an appointment still ahead (after today, compared at the date's own precision)? */
export function isUpcoming(a: Pick<AppointmentData, 'date' | 'datePrecision'>): boolean {
  return !!a.date && isBeforeAtPrecision(todayKey(), 'exact', a.date, a.datePrecision);
}

/**
 * Medicine / appointment / health-history detail + editor. Used by
 * `/(tabs)/profile/records/[kind]/[id]` (back → the list) and
 * `/(tabs)/timeline/record/[kind]/[id]` (back → Timeline). `id === 'new'` adds a record.
 * `onDone` runs after Back, Save and Delete — it should return to `backLabel`'s screen.
 * Leaving with unsaved edits (Back, or a swipe / hardware back) asks "Discard changes?" in-page.
 */
export function RecordDetail({
  kind, id, backLabel, onDone,
}: {
  kind: RecordDataKind;
  id: string;
  backLabel: string;
  onDone: () => void;
}) {
  const info = KIND_INFO[kind];
  const isNew = id === 'new';
  const records = useRecordsStore((s) => s.records[kind] as Rec<AnyData>[]);
  const loadedFor = useRecordsStore((s) => s.loadedFor);
  const create = useRecordsStore((s) => s.create);
  const update = useRecordsStore((s) => s.update);
  const remove = useRecordsStore((s) => s.remove);
  const existing = isNew ? undefined : records.find((r) => r.id === id);

  const navigation = useNavigation();

  const [draft, setDraft] = useState<Draft | null>(() =>
    isNew ? blank(kind) : existing ? normalise(kind, existing.data) : null);
  /** Signature of the form as it opened — anything different is an unsaved edit. */
  const [baseline, setBaseline] = useState<string | null>(() => (draft ? signature(kind, draft) : null));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [confirming, setConfirming] = useState(false);
  /** The navigation action held back while "Discard changes?" is showing (null = our own Back). */
  const [discardAsk, setDiscardAsk] = useState<{ action: any } | null>(null);
  const leaving = useRef(false);
  // Survives the RN-web null-ref quirk (see timeline/navigation.ts useScrollRef).
  const scrollRef = useScrollRef();

  // Opened before records finished loading (deep link): fill the form once the record arrives.
  useEffect(() => {
    if (!draft && existing) {
      const d = normalise(kind, existing.data);
      setDraft(d);
      setBaseline(signature(kind, d));
    }
  }, [existing, draft, kind]);

  // Delete confirm: it replaces the button at the very end of the page, so once it has rendered
  // scroll to the end so the title, message and BOTH buttons are in view (not under the tab bar).
  useEffect(() => {
    if (!confirming) return;
    const t = setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);
    return () => clearTimeout(t);
  }, [confirming]);

  const dirty = !!draft && baseline != null && signature(kind, draft) !== baseline;

  // Swipe-back / hardware back / tab re-tap pop: hold it and ask first.
  useEffect(() => {
    const unsub = (navigation as any).addListener('beforeRemove', (e: any) => {
      if (!dirty || leaving.current) return;
      e.preventDefault();
      setDiscardAsk({ action: e.data.action });
      requestAnimationFrame(() => scrollRef.current?.scrollTo({ y: 0, animated: true }));
    });
    return unsub;
  }, [navigation, dirty]);

  const leave = () => {
    leaving.current = true;
    onDone();
  };
  const requestBack = () => {
    if (!dirty) return leave();
    setDiscardAsk({ action: null });
    requestAnimationFrame(() => scrollRef.current?.scrollTo({ y: 0, animated: true }));
  };
  const discard = () => {
    const held = discardAsk?.action;
    leaving.current = true;
    setDiscardAsk(null);
    if (held) (navigation as any).dispatch(held);
    else onDone();
  };

  if (!draft) {
    return (
      <ScreenLarge title={info.title} back={{ label: backLabel, onPress: onDone }}>
        {loadedFor ? <EmptyState message="This entry isn't here any more." /> : null}
      </ScreenLarge>
    );
  }

  const set = (patch: Partial<Draft>) => {
    setError('');
    setDraft((cur) => ({ ...(cur as Draft), ...patch } as Draft));
  };

  let rangeError = '';
  if (kind === 'medicine') {
    const m = draft as MedicineData;
    if (isBeforeAtPrecision(m.stopped, m.stoppedPrecision, m.started, m.startedPrecision)) {
      rangeError = 'The stop date is before the start date.';
    }
  }
  const need = missing(kind, draft);
  // An existing entry saves only once something changed (N18, same as Bleeding detail).
  const canSave = !need && !rangeError && !busy && (isNew || dirty);

  const save = async () => {
    if (!canSave) return;
    setBusy(true);
    setError('');
    try {
      const data = cleaned(kind, draft);
      if (isNew) await create(kind, data as any);
      else await update(kind, id, data as any);
      haptics.success();
      showToast(info.saved);
      leave();
    } catch {
      setError("That couldn't be saved. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  };

  const del = async () => {
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      await remove(kind, id);
      showToast(info.deleted);
      leave();
    } catch {
      setConfirming(false);
      setError("That couldn't be deleted. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScreenLarge
      title={isNew ? info.newTitle : info.title}
      back={{ label: backLabel, onPress: requestBack }}
      scrollRef={scrollRef}
    >
      {discardAsk ? (
        <ConfirmCard
          title="Discard changes?"
          message="Your changes to this entry haven't been saved."
          style={{ marginBottom: space.xl }}
          actions={[
            { label: 'Discard', variant: 'destructive', onPress: discard },
            { label: 'Keep editing', variant: 'secondary', onPress: () => setDiscardAsk(null) },
          ]}
        />
      ) : null}
      <View style={{ gap: space.xl }}>
        {kind === 'medicine' ? <MedicineFields d={draft as MedicineData} set={set} isNew={isNew} /> : null}
        {kind === 'appointment' ? <AppointmentFields d={draft as AppointmentData} set={set} /> : null}
        {kind === 'history' ? <HistoryFields d={draft as HistoryDraft} set={set} /> : null}

        <View style={{ gap: space.xs }}>
          {rangeError ? <InlineError message={rangeError} /> : null}
          <InlineError message={error} />
          <Button label="Save" onPress={save} disabled={!canSave} loading={busy && !confirming} />
          {need ? <Txt variant="secondary" style={{ textAlign: 'center' }}>{need}</Txt> : null}
        </View>
      </View>

      {!isNew && !confirming ? (
        <Button
          label="Delete entry"
          variant="destructive"
          icon="trash-2"
          align="start"
          onPress={() => setConfirming(true)}
          style={{ marginTop: space.xl }}
        />
      ) : null}
      {!isNew && confirming ? (
        <ConfirmCard
          tone="destructive"
          title="Delete this entry?"
          message="It will be removed from your records and your summary. This can't be undone."
          onLayout={() => scrollRef.current?.scrollToEnd({ animated: true })}
          style={{ marginTop: space.xl }}
          actions={[
            { label: 'Delete', variant: 'destructive', onPress: del },
            { label: 'Cancel', variant: 'secondary', onPress: () => setConfirming(false) },
          ]}
        />
      ) : null}
    </ScreenLarge>
  );
}

// ---- per-kind fields ----------------------------------------------------------------------

type SetFn = (patch: Partial<Draft>) => void;

function MedicineFields({ d, set, isNew }: { d: MedicineData; set: SetFn; isNew: boolean }) {
  return (
    <>
      <TextField label="Name" value={d.name} onChangeText={(name) => set({ name })} autoCapitalize="sentences" />
      <TextField label="Dose" optional value={d.dose ?? ''} onChangeText={(dose) => set({ dose })} />
      <RecordDateField
        label="Started"
        value={d.started}
        precision={d.startedPrecision}
        onChange={(started, startedPrecision) => set({ started, startedPrecision })}
      />
      <RecordDateField
        label="Stopped"
        optional
        ongoingLabel="Still taking"
        initiallyOngoing={!isNew && !d.stopped}
        value={d.stopped}
        precision={d.stoppedPrecision}
        min={d.started && d.startedPrecision === 'exact' ? d.started : undefined}
        onChange={(stopped, stoppedPrecision) => set({ stopped, stoppedPrecision })}
      />
      <View>
        <FieldLabel label="Did it help?" />
        <ChipGroup
          mode="single"
          options={[...HELPED_OPTIONS]}
          allowDeselect
          value={d.helped ?? null}
          onChange={(v) => set({ helped: (v ?? undefined) as MedicineData['helped'] })}
          accessibilityLabel="Did it help?"
        />
      </View>
      <TextField
        label="What I noticed"
        hint="In your own words"
        multiline
        value={d.happened}
        onChangeText={(happened) => set({ happened })}
      />
    </>
  );
}

/**
 * An upcoming appointment (or one with no date yet) only asks forward-looking questions. "I was
 * told / Tests or prescriptions / What happens next" appear under "After the appointment" once
 * the date is today or past — or whenever Sam already wrote something in them.
 */
function AppointmentFields({ d, set }: { d: AppointmentData; set: SetFn }) {
  const ahead = !d.date || isUpcoming(d);
  const hasAfter = !!(d.told.trim() || d.tests.trim() || d.next.trim());
  return (
    <>
      <TextField label="Who or where" value={d.who} onChangeText={(who) => set({ who })} autoCapitalize="sentences" />
      <RecordDateField
        label="Date"
        allowFuture
        value={d.date}
        precision={d.datePrecision}
        onChange={(date, datePrecision) => set({ date, datePrecision })}
      />
      <TextField
        label={ahead ? 'What it’s for' : 'Why I went'}
        optional
        multiline
        value={d.why}
        onChangeText={(why) => set({ why })}
      />
      {!ahead || hasAfter ? (
        <>
          <SectionTitle title="After the appointment" style={{ marginTop: space.xs, marginBottom: 0 }} />
          <TextField label="I was told" hint="In your own words" multiline value={d.told} onChangeText={(told) => set({ told })} />
          <TextField label="Tests or prescriptions" optional multiline value={d.tests} onChangeText={(tests) => set({ tests })} />
          <TextField label="What happens next" optional multiline value={d.next} onChangeText={(next) => set({ next })} />
        </>
      ) : null}
      <TextField label="Anything else" optional multiline value={d.notes} onChangeText={(notes) => set({ notes })} />
    </>
  );
}

function HistoryFields({ d, set }: { d: HistoryDraft; set: SetFn }) {
  return (
    <>
      <View>
        <FieldLabel label="What it was" />
        <ChipGroup
          options={HISTORY_TYPES}
          ghosts={[]}
          value={d.type || null}
          onChange={(type) => set({ type: (type ?? '') as HistoryType | '' })}
          accessibilityLabel="What it was"
        />
      </View>
      <RecordDateField
        label="When"
        value={d.date}
        precision={d.datePrecision}
        onChange={(date, datePrecision) => set({ date, datePrecision })}
      />
      <TextField label="What I was told" hint="In your own words" multiline value={d.told} onChangeText={(told) => set({ told })} />
      <TextField label="What was done" optional multiline value={d.done} onChangeText={(done) => set({ done })} />
      <TextField label="Result" optional hint="How it went, in your own words" multiline value={d.result} onChangeText={(result) => set({ result })} />
    </>
  );
}

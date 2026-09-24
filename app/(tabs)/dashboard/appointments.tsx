import React, { useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { RecordRow, TextField, Txt } from '../../../components/atossa/kit';
import { DateChoice } from '../../../components/atossa/DateChoice';
import { EditorShell, RecordListPage, useBlockedDates } from '../../../components/atossa/RecordPage';
import { useRecordsStore } from '../../../stores/recordsStore';
import { formatRecordDate, isFuture, todayKey } from '../../../lib/records/dates';
import type { AppointmentData } from '../../../types/records';

const blank = (): AppointmentData => ({
  date: todayKey(), datePrecision: 'exact', who: '', why: '', told: '', tests: '', next: '', notes: '',
});

export default function AppointmentsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { records, create, update, remove } = useRecordsStore();
  const found = id && id !== 'new' ? records.appointment.find((r) => r.id === id) : undefined;
  const direct = id === 'new' || Boolean(found);
  const [editingId, setEditingId] = useState<string | 'new' | null>(id === 'new' ? 'new' : found?.id ?? null);
  const [draft, setDraft] = useState<AppointmentData | null>(id === 'new' ? blank() : found?.data ?? null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const { blocked, track } = useBlockedDates();

  const close = () => { setEditingId(null); setDraft(null); setError(''); if (direct) router.back(); };
  const run = async (fn: () => Promise<unknown>) => {
    setBusy(true); setError('');
    try { await fn(); close(); } catch { setError("That couldn't be saved. Check your connection and try again."); } finally { setBusy(false); }
  };

  if (editingId === null || !draft) {
    const sorted = [...records.appointment].sort((a, b) => b.data.date.localeCompare(a.data.date));
    return (
      <RecordListPage
        title="Appointments"
        count={sorted.length}
        onBack={() => router.back()}
        onAdd={() => { setEditingId('new'); setDraft(blank()); }}
        addLabel="Add an appointment"
        emptyText="No appointments saved yet."
      >
        {sorted.map((r) => (
          <RecordRow
            key={r.id}
            icon="calendar"
            title={formatRecordDate(r.data.date, r.data.datePrecision)}
            subtitle={r.data.who}
            upcoming={isFuture(r.data.date)}
            onPress={() => { setEditingId(r.id); setDraft(r.data); }}
          />
        ))}
      </RecordListPage>
    );
  }

  const isNew = editingId === 'new';
  return (
    <EditorShell
      title={isNew ? 'Add an appointment' : 'Appointment'}
      onBack={close}
      saveLabel="Save appointment"
      busy={busy}
      error={error}
      saveDisabled={blocked || !draft.who.trim() || !draft.date}
      onSave={() => run(() => (isNew ? create('appointment', draft) : update('appointment', editingId, draft)))}
      onDelete={isNew ? undefined : () => run(() => remove('appointment', editingId))}
      deleteName="this appointment"
    >
      <DateChoice label="Date" value={draft.date} precision={draft.datePrecision} onChange={(date, datePrecision) => setDraft({ ...draft, date, datePrecision })} onBlockedChange={track('date')} />
      <TextField label="Who or where" value={draft.who} onChangeText={(who) => setDraft({ ...draft, who })} />
      <TextField label="Why I went" multiline value={draft.why} onChangeText={(why) => setDraft({ ...draft, why })} />
      <TextField label="I was told:" multiline value={draft.told} onChangeText={(told) => setDraft({ ...draft, told })} placeholder="Write what the doctor said in your own words" />
      <TextField label="Tests or prescriptions:" multiline value={draft.tests} onChangeText={(tests) => setDraft({ ...draft, tests })} />
      <TextField label="What happens next:" multiline value={draft.next} onChangeText={(next) => setDraft({ ...draft, next })} />
      <TextField label="Notes" multiline value={draft.notes} onChangeText={(notes) => setDraft({ ...draft, notes })} />
      {!draft.who.trim() ? <Txt variant="small">Add who or where to save.</Txt> : null}
    </EditorShell>
  );
}

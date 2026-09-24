import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import { RecordRow, TextField, Txt } from '../../../components/atossa/kit';
import { DateChoice } from '../../../components/atossa/DateChoice';
import { EditorShell, RecordListPage, useBlockedDates } from '../../../components/atossa/RecordPage';
import { useRecordsStore } from '../../../stores/recordsStore';
import { formatRecordDate, isFuture, todayKey } from '../../../lib/records/dates';
import type { MedicineData } from '../../../types/records';

const blank = (): MedicineData => ({
  name: '', started: todayKey(), startedPrecision: 'exact', stopped: '', stoppedPrecision: 'exact', happened: '',
});

export default function MedicinesScreen() {
  const router = useRouter();
  const { records, create, update, remove } = useRecordsStore();
  const [editingId, setEditingId] = useState<string | 'new' | null>(null);
  const [draft, setDraft] = useState<MedicineData | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const { blocked, track } = useBlockedDates();

  const close = () => { setEditingId(null); setDraft(null); setError(''); };
  const run = async (fn: () => Promise<unknown>) => {
    setBusy(true); setError('');
    try { await fn(); close(); } catch { setError("That couldn't be saved. Check your connection and try again."); } finally { setBusy(false); }
  };

  if (editingId === null || !draft) {
    const sorted = [...records.medicine].sort((a, b) => b.data.started.localeCompare(a.data.started));
    return (
      <RecordListPage
        title="Medicines and treatments"
        count={sorted.length}
        onBack={() => router.back()}
        onAdd={() => { setEditingId('new'); setDraft(blank()); }}
        addLabel="Add medicine or treatment"
        emptyText="Nothing saved yet. Add anything you have tried, and what happened."
      >
        {sorted.map((r) => (
          <RecordRow
            key={r.id}
            title={r.data.name}
            subtitle={`${formatRecordDate(r.data.started, r.data.startedPrecision)}${r.data.stopped ? ` – ${formatRecordDate(r.data.stopped, r.data.stoppedPrecision)}` : ' – ongoing'}`}
            detail={r.data.happened}
            upcoming={isFuture(r.data.started) || isFuture(r.data.stopped)}
            onPress={() => { setEditingId(r.id); setDraft(r.data); }}
          />
        ))}
      </RecordListPage>
    );
  }

  const isNew = editingId === 'new';
  return (
    <EditorShell
      title="Medicine or treatment"
      onBack={close}
      saveLabel="Save entry"
      busy={busy}
      error={error}
      saveDisabled={blocked || !draft.name.trim() || !draft.started}
      onSave={() => run(() => (isNew ? create('medicine', draft) : update('medicine', editingId, draft)))}
      onDelete={isNew ? undefined : () => run(() => remove('medicine', editingId))}
      deleteName="this entry"
    >
      <TextField label="Name" value={draft.name} onChangeText={(name) => setDraft({ ...draft, name })} />
      <DateChoice label="Started" value={draft.started} precision={draft.startedPrecision} onChange={(started, startedPrecision) => setDraft({ ...draft, started, startedPrecision })} onBlockedChange={track('started')} />
      <DateChoice label="Stopped" optional value={draft.stopped} precision={draft.stoppedPrecision} onChange={(stopped, stoppedPrecision) => setDraft({ ...draft, stopped, stoppedPrecision })} onBlockedChange={track('stopped')} />
      <TextField label="What happened" multiline value={draft.happened} onChangeText={(happened) => setDraft({ ...draft, happened })} placeholder="For example: no relief" />
      {!draft.name.trim() ? <Txt variant="small">Add a name to save.</Txt> : null}
    </EditorShell>
  );
}

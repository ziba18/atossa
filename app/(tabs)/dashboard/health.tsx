import React, { useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { BigButton, RecordRow, TextField, Txt } from '../../../components/atossa/kit';
import { DateChoice } from '../../../components/atossa/DateChoice';
import { EditorShell, RecordListPage, useBlockedDates } from '../../../components/atossa/RecordPage';
import { useRecordsStore } from '../../../stores/recordsStore';
import { formatRecordDate, isFuture, todayKey } from '../../../lib/records/dates';
import type { HistoryData, HistoryType } from '../../../types/records';

const TYPES: HistoryType[] = ['Told to me by a doctor', 'Test or scan', 'Procedure or surgery', 'Emergency visit'];

const blank = (): HistoryData => ({
  type: 'Told to me by a doctor', date: todayKey(), datePrecision: 'exact', told: '', done: '', result: '',
});

export default function HealthHistoryScreen() {
  const router = useRouter();
  const { records, create, update, remove } = useRecordsStore();
  const [editingId, setEditingId] = useState<string | 'new' | null>(null);
  const [draft, setDraft] = useState<HistoryData | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const { blocked, track } = useBlockedDates();

  const close = () => { setEditingId(null); setDraft(null); setError(''); };
  const run = async (fn: () => Promise<unknown>) => {
    setBusy(true); setError('');
    try { await fn(); close(); } catch { setError("That couldn't be saved. Check your connection and try again."); } finally { setBusy(false); }
  };

  if (editingId === null || !draft) {
    const sorted = [...records.history].sort((a, b) => b.data.date.localeCompare(a.data.date));
    return (
      <RecordListPage
        title="Health history"
        count={sorted.length}
        onBack={() => router.back()}
        onAdd={() => { setEditingId('new'); setDraft(blank()); }}
        addLabel="Add health history"
        emptyText="Nothing saved yet. Add tests, procedures, emergency visits, or things a doctor has told you."
      >
        {sorted.map((r) => (
          <RecordRow
            key={r.id}
            title={r.data.type}
            subtitle={formatRecordDate(r.data.date, r.data.datePrecision)}
            detail={[
              r.data.told && `I was told: ${r.data.told}`,
              r.data.done && `What was done: ${r.data.done}`,
              r.data.result && `Result or how it went: ${r.data.result}`,
            ].filter(Boolean).join(' · ')}
            upcoming={isFuture(r.data.date)}
            onPress={() => { setEditingId(r.id); setDraft(r.data); }}
          />
        ))}
      </RecordListPage>
    );
  }

  const isNew = editingId === 'new';
  const empty = !draft.told.trim() && !draft.done.trim() && !draft.result.trim();
  return (
    <EditorShell
      title="Health history entry"
      onBack={close}
      saveLabel="Save entry"
      busy={busy}
      error={error}
      saveDisabled={blocked || !draft.date || empty}
      onSave={() => run(() => (isNew ? create('history', draft) : update('history', editingId, draft)))}
      onDelete={isNew ? undefined : () => run(() => remove('history', editingId))}
      deleteName="this entry"
    >
      <View>
        <Txt variant="h3">Type</Txt>
        <View style={{ gap: 12, marginTop: 10 }}>
          {TYPES.map((t) => (
            <BigButton key={t} label={t} variant="outline" selected={draft.type === t} onPress={() => setDraft({ ...draft, type: t })} />
          ))}
        </View>
      </View>
      <DateChoice label="Date" value={draft.date} precision={draft.datePrecision} onChange={(date, datePrecision) => setDraft({ ...draft, date, datePrecision })} onBlockedChange={track('date')} />
      <TextField label="I was told:" multiline value={draft.told} onChangeText={(told) => setDraft({ ...draft, told })} placeholder="Optional" />
      <TextField label="What was done:" multiline value={draft.done} onChangeText={(done) => setDraft({ ...draft, done })} placeholder="Optional" />
      <TextField label="Result or how it went" multiline value={draft.result} onChangeText={(result) => setDraft({ ...draft, result })} placeholder="Write this in your own words" />
      {empty ? <Txt variant="small">Fill in at least one box to save.</Txt> : null}
    </EditorShell>
  );
}

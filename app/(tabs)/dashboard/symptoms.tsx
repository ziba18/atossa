import React, { useState } from 'react';
import { View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { UI } from '../../../constants/atossaUI';
import { BigButton, RecordRow, TextField, Txt } from '../../../components/atossa/kit';
import { DateChoice } from '../../../components/atossa/DateChoice';
import { EditorShell, RecordListPage, useBlockedDates } from '../../../components/atossa/RecordPage';
import { useRecordsStore } from '../../../stores/recordsStore';
import { formatDate, isFuture } from '../../../lib/records/dates';
import type { Rec, SymptomData } from '../../../types/records';

const C = UI.colors;

export default function SymptomsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { records, update, remove } = useRecordsStore();
  const opened = records.symptom.find((r) => r.id === id) ?? null;
  const direct = Boolean(opened);
  const [editing, setEditing] = useState<Rec<SymptomData> | null>(opened);
  const [draft, setDraft] = useState<SymptomData | null>(opened?.data ?? null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const { blocked, track } = useBlockedDates();

  const close = () => { setEditing(null); setDraft(null); setError(''); if (direct) router.back(); };

  const run = async (fn: () => Promise<void>) => {
    setBusy(true); setError('');
    try { await fn(); close(); } catch { setError("That couldn't be saved. Check your connection and try again."); } finally { setBusy(false); }
  };

  if (!editing || !draft) {
    const sorted = [...records.symptom].sort((a, b) => b.data.date.localeCompare(a.data.date));
    return (
      <RecordListPage title="My symptoms" count={sorted.length} onBack={() => router.back()} emptyText="No symptoms saved yet. Tell Atossa how you feel in Chat.">
        {sorted.map((r) => (
          <RecordRow
            key={r.id}
            title={`${formatDate(r.data.date)} · ${r.data.score}/10`}
            subtitle={r.data.words}
            upcoming={isFuture(r.data.date)}
            onPress={() => { setEditing(r); setDraft(r.data); }}
          />
        ))}
      </RecordListPage>
    );
  }

  return (
    <EditorShell
      title="Symptom entry"
      onBack={close}
      saveLabel="Save entry"
      busy={busy}
      error={error}
      saveDisabled={blocked || !draft.words.trim()}
      onSave={() => run(() => update('symptom', editing.id, draft))}
      onDelete={() => run(() => remove('symptom', editing.id))}
      deleteName="this symptom entry"
    >
      <DateChoice label="Date" value={draft.date} precision="exact" exactOnly onChange={(date) => setDraft({ ...draft, date })} onBlockedChange={track('date')} />
      <TextField label="My own words" multiline value={draft.words} onChangeText={(words) => setDraft({ ...draft, words })} />
      <TextField label="Where I felt it" value={draft.where} onChangeText={(where) => setDraft({ ...draft, where })} />
      <View>
        <Txt variant="bodyBold">How bad it was, 0 to 10</Txt>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
          {Array.from({ length: 11 }, (_, n) => (
            <BigButton key={n} label={String(n)} variant="outline" selected={draft.score === n} onPress={() => setDraft({ ...draft, score: n })} style={{ width: '23%' }} />
          ))}
        </View>
      </View>
      <TextField label="How long" value={draft.duration} onChangeText={(duration) => setDraft({ ...draft, duration })} />
      <View>
        <Txt variant="bodyBold">Did it stop me doing things?</Txt>
        <View style={{ flexDirection: 'row', gap: 12, marginTop: 10 }}>
          <BigButton label="Yes" variant="outline" selected={draft.stopped} onPress={() => setDraft({ ...draft, stopped: true })} style={{ flex: 1 }} />
          <BigButton label="No" variant="outline" selected={!draft.stopped} onPress={() => setDraft({ ...draft, stopped: false })} style={{ flex: 1 }} />
        </View>
      </View>
      {draft.stopped ? (
        <TextField label="What it stopped me doing" multiline value={draft.stoppedWords} onChangeText={(stoppedWords) => setDraft({ ...draft, stoppedWords })} />
      ) : null}
      {blocked ? <Txt variant="small" color={C.foreground}>Confirm the future date above to save.</Txt> : null}
    </EditorShell>
  );
}

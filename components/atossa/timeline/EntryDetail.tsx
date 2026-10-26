// Symptom entry detail: the same NotedRow layout as the capture "Here's what I noted" card,
// every row editable in place with the same editors. Date via DatePill + DayChooser (no future).
// Delete is confirmed in-page (ConfirmCard), never Alert.alert.
import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, TextInput, View, type HostInstance } from 'react-native';
import { useRouter } from 'expo-router';
import {
  Button, Card, ChipGroup, ConfirmCard, DatePill, DayChooser, EmptyState, InlineError, NotedRow, ScreenLarge,
  SeverityRow, Txt, showToast,
} from '../kit';
import { StrengthEditor } from '../capture/StrengthEditor';
import { ZoneEditor } from '../capture/ZoneEditor';
import { colors, fonts, radii, space } from '../../../constants/atossaUI';
import { haptics } from '../../../lib/haptics';
import { IMPACT_OPTIONS, WHEN_OPTIONS } from '../../../lib/records/fields';
import {
  formatDuration, formatStrength, formatWhen, formatWhere, realImpacts, splitTiming, worstOf, typicalOf,
} from '../../../lib/records/format';
import { useRecordsStore } from '../../../stores/recordsStore';
import type { SymptomData } from '../../../types/records';
import { goBack, revealBlock, revealConfirm, useScrollRef } from './navigation';

type Field = 'date' | 'words' | 'where' | 'strength' | 'when' | 'duration' | 'impacts' | 'tried';

/** Impacts that mean "it didn't get in the way" — not counted as a real impact. */
const NO_IMPACT = new Set(['Nothing today']);

const realGotInWay = (impacts: string[]) => realImpacts({ impacts } as SymptomData).filter((i) => !NO_IMPACT.has(i));

/** Keep the derived/legacy fields in step before saving: score = worst, stopped from impacts. */
function normalise(d: SymptomData): SymptomData {
  const worst = worstOf(d);
  const out: SymptomData = { ...d, worst, score: worst };
  if (d.impacts) out.stopped = realGotInWay(d.impacts).length > 0;
  return out;
}

function gotInWayValue(s: SymptomData): string {
  if (s.impacts) {
    const shown = realImpacts(s);
    return shown.map((i) => (i === 'Nothing today' ? 'Nothing' : i)).join(', ');
  }
  if (s.stopped === false && !s.stoppedWords?.trim()) return 'Nothing';
  return '';
}

export function EntryDetail({ id, from }: { id: string; from: string }) {
  const router = useRouter();
  const rec = useRecordsStore((s) => s.records.symptom.find((r) => r.id === id));
  const update = useRecordsStore((s) => s.update);
  const remove = useRecordsStore((s) => s.remove);
  const scrollRef = useScrollRef();
  const [editing, setEditing] = useState<Field | null>(null);
  const [draft, setDraft] = useState<SymptomData | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [confirming, setConfirming] = useState(false);
  const deleting = useRef(false);
  const loaded = useRecordsStore((st) => st.loadedFor != null && !st.loading);
  /** The open editor's host node, and which opening has already been scrolled into view (N9). */
  const editorNode = useRef<HostInstance | null>(null);
  const revealed = useRef(0);
  const opening = useRef(0);

  const back = () => goBack(router, from);

  // The note was removed elsewhere (e.g. sample data cleared) while this screen was open:
  // don't strand Sam on a dead page — return to where she came from.
  useEffect(() => {
    if (!rec && loaded && !deleting.current) back();
  }, [rec, loaded]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!rec) {
    return (
      <ScreenLarge title="Note" back={{ label: from, onPress: back }}>
        {deleting.current ? null : <EmptyState message="This note isn’t here any more." />}
      </ScreenLarge>
    );
  }

  const s = rec.data;
  const d = editing && draft ? draft : s;

  const start = (field: Field) => {
    setError('');
    setConfirming(false);
    // Legacy notes kept "Since Tuesday" in `when`: move it to `duration` before editing, so
    // choosing a When chip can never overwrite How long (UX #4).
    setDraft({ ...s, ...splitTiming(s) });
    setEditing(field);
    opening.current += 1;
  };
  /** First layout of a just-opened editor: bring all of it (Done included) on screen (N9). */
  const revealEditor = () => {
    if (revealed.current === opening.current) return;
    revealed.current = opening.current;
    revealBlock(scrollRef, editorNode.current);
  };
  const cancel = () => { setEditing(null); setDraft(null); setError(''); };

  const save = async (next: SymptomData) => {
    setSaving(true);
    setError('');
    try {
      await update('symptom', rec.id, normalise(next));
      haptics.success();
      setEditing(null);
      setDraft(null);
    } catch {
      setError("That didn’t save. Check your connection and try again.");
    } finally {
      setSaving(false);
    }
  };

  const del = async () => {
    setSaving(true);
    setError('');
    try {
      deleting.current = true;
      await remove('symptom', rec.id);
      back();
      showToast('Note deleted.');
    } catch {
      deleting.current = false;
      setError("That didn’t delete. Check your connection and try again.");
      setSaving(false);
    }
  };

  const set = (patch: Partial<SymptomData>) => setDraft((cur) => ({ ...(cur ?? s), ...patch }));

  /** Editor block shown in place of a row: caption label, control, Done / Cancel. */
  const editor = (label: string, control: React.ReactNode, first?: boolean) => (
    <View ref={editorNode} onLayout={revealEditor} style={[styles.editor, !first && styles.divider]}>
      <Txt variant="caption">{label}</Txt>
      {control}
      <InlineError message={error} />
      <View style={styles.editorActions}>
        <Button variant="text" label="Cancel" onPress={cancel} />
        <Button variant="secondary" label="Done" loading={saving} onPress={() => draft && save(draft)} style={{ flex: 1 }} />
      </View>
    </View>
  );

  const words = s.words?.trim() ?? '';
  const isQuick = s.source === 'quick';
  // Title names the thing; the date lives once, in the DatePill under it (#27).
  const title = isQuick ? 'Rough day' : s.source === 'voice' ? 'Voice note' : 'Note';

  return (
    <ScreenLarge title={title} back={{ label: from, onPress: back }} scrollRef={scrollRef}>
      <View style={{ gap: space.lg }}>
        <View style={{ gap: space.xs }}>
          <DatePill value={d.date} onPress={() => (editing === 'date' ? cancel() : start('date'))} />
          {editing === 'date' && draft ? (
            <View ref={editorNode} onLayout={revealEditor}>
              <Card>
                <DayChooser value={draft.date} onChange={(k) => save({ ...draft, date: k })} />
                <InlineError message={error} />
              </Card>
            </View>
          ) : null}
        </View>

        <Card style={{ paddingVertical: space.xs }}>
          {/* What it felt like — Sam's own words only (never for a quick log without words). */}
          {editing === 'words' && draft
            ? editor('What it felt like', (
              <TextInput
                value={draft.words}
                onChangeText={(t) => set({ words: t })}
                multiline
                autoFocus
                accessibilityLabel="What it felt like, in your words"
                placeholder="In your words"
                placeholderTextColor={colors.ink3}
                style={[styles.input, styles.inputMulti]}
              />
            ), true)
            : <NotedRow first label="What it felt like" quote={words || undefined} onPress={() => start('words')} addLabel="Add what it felt like" />}

          {editing === 'where' && draft
            ? editor('Where', (
              <ZoneEditor
                value={draft.zones ?? []}
                onChange={(z) => set({ zones: z })}
                text={draft.whereText ?? (draft.zones?.length ? '' : draft.where ?? '')}
                onTextChange={(t) => set({ whereText: t })}
              />
            ))
            : <NotedRow label="Where" value={formatWhere(s)} onPress={() => start('where')} addLabel="Add where" />}

          {editing === 'strength' && draft
            ? editor('How strong', isQuick ? (
              <SeverityRow
                label="How strong"
                showLabel={false}
                value={worstOf(draft)}
                onChange={(n) => set({ worst: n, score: n })}
              />
            ) : (
              <StrengthEditor
                typical={typicalOf(draft)}
                worst={worstOf(draft)}
                strengthText={draft.strengthText ?? null}
                onChange={(v) => set({ typical: v.typical, worst: v.worst, score: v.worst, strengthText: v.strengthText ?? undefined })}
              />
            ))
            : <NotedRow label="How strong" value={formatStrength(s)} onPress={() => start('strength')} addLabel="Add how strong" />}

          {editing === 'when' && draft
            ? editor('When', (
              <ChipGroup
                accessibilityLabel="When"
                options={[...WHEN_OPTIONS, 'Not sure']}
                value={draft.when ?? null}
                allowDeselect
                onChange={(v) => set({ when: v ?? undefined })}
              />
            ))
            : <NotedRow label="When" value={formatWhen(s) || undefined} onPress={() => start('when')} addLabel="Add when" />}

          {/* How long — Sam's free text ("since Tuesday"). Separate from When: a chip never clears it. */}
          {editing === 'duration' && draft
            ? editor('How long', (
              <TextInput
                value={draft.duration ?? ''}
                onChangeText={(t) => set({ duration: t })}
                autoFocus
                accessibilityLabel="How long it has been going on, in your words"
                placeholder="For example, since Tuesday"
                placeholderTextColor={colors.ink3}
                style={styles.input}
              />
            ))
            : <NotedRow label="How long" value={formatDuration(s) || undefined} onPress={() => start('duration')} addLabel="Add how long" />}

          {editing === 'impacts' && draft
            ? editor('Got in the way of', (
              <ChipGroup
                mode="multi"
                accessibilityLabel="Got in the way of"
                options={[...IMPACT_OPTIONS, 'Not sure']}
                exclusive={['Nothing today', 'Not sure']}
                value={draft.impacts ?? []}
                onChange={(v) => set({ impacts: v })}
              />
            ))
            : (
              <NotedRow
                label="Got in the way of"
                quote={s.stoppedWords?.trim() || undefined}
                value={gotInWayValue(s)}
                onPress={() => start('impacts')}
                addLabel="Add what it got in the way of"
              />
            )}

          {editing === 'tried' && draft
            ? editor('Tried', (
              <TextInput
                value={draft.tried ?? ''}
                onChangeText={(t) => set({ tried: t })}
                multiline
                autoFocus
                accessibilityLabel="What you tried, in your words"
                placeholder="In your words"
                placeholderTextColor={colors.ink3}
                style={[styles.input, styles.inputMulti]}
              />
            ))
            : <NotedRow label="Tried" quote={s.tried?.trim() || undefined} onPress={() => start('tried')} addLabel="Add what you tried" />}
        </Card>

        {editing ? null : <InlineError message={error} />}

        {confirming ? (
          <ConfirmCard
            tone="destructive"
            title="Delete this note?"
            message="It will be removed from your timeline and your summary. This can't be undone."
            onLayout={(e) => revealConfirm(scrollRef, e)}
            actions={[
              { label: 'Delete', variant: 'destructive', onPress: del },
              { label: 'Cancel', variant: 'secondary', onPress: () => setConfirming(false) },
            ]}
          />
        ) : (
          <Button variant="destructive" icon="trash-2" align="start" label="Delete note" onPress={() => { cancel(); setConfirming(true); revealConfirm(scrollRef); }} />
        )}
      </View>
    </ScreenLarge>
  );
}

const styles = StyleSheet.create({
  editor: { paddingVertical: space.sm, gap: space.sm },
  divider: { borderTopWidth: 1, borderTopColor: colors.hairline },
  editorActions: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  input: {
    fontFamily: fonts.regular, fontSize: 17, lineHeight: 24, color: colors.ink,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderStrong, borderRadius: radii.input,
    paddingHorizontal: space.md, paddingVertical: space.sm,
  },
  inputMulti: { minHeight: 96, textAlignVertical: 'top' },
});
